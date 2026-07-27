/* ==========================================================
   SmartSearch.js  –  Autovervollständigung der Stadtsuche
   Autor: Ahmad
   ========================================================== */

/**
 * Klasse: SmartSearch
 * Autovervollständigung für das Suchfeld. Kombiniert zwei Quellen:
 *   1. Städte aus dem eigenen Suchverlauf (sofort, ohne API-Anfrage)
 *   2. Echte Städtevorschläge über die Geocoding-API
 * Nutzt "Debouncing": erst nach einer kurzen Tipppause wird die
 * API gefragt, damit nicht bei jedem Buchstaben eine Anfrage rausgeht.
 * Autor: Ahmad
 */
class SmartSearch {
  /**
   * @param {HTMLInputElement} input - Das Suchfeld
   * @param {HTMLElement} dropdown - Container für die Vorschläge
   * @param {StorageManager} storage
   * @param {WeatherAPI} api
   * @param {Function} onSelect - Callback bei Auswahl einer Stadt
   */
  constructor(input, dropdown, storage, api, onSelect) {
    this.input = input;
    this.dropdown = dropdown;
    this.storage = storage;
    this.api = api;
    this.onSelect = onSelect;

    this.suggestions = [];
    this.activeIndex = -1;
    this.debounceTimer = null;
    this.DEBOUNCE_MS = 300;
    this.MIN_CHARS = 2;

    // Merkt sich den letzten online gesuchten Begriff, damit für
    // denselben Text nicht mehrfach die API gefragt wird.
    this.lastQuery = "";
    this.cache = new Map();

    this._registerEvents();
  }

  /** @private */
  _registerEvents() {
    // Tippen im Suchfeld
    this.input.addEventListener("input", () => {
      const query = this.input.value.trim();
      clearTimeout(this.debounceTimer);

      if (query.length < this.MIN_CHARS) {
        this.hide();
        return;
      }

      // 1. Sofort: Treffer aus dem Verlauf anzeigen (ohne API)
      const localHits = this.storage.searchHistory(query).map((city) => ({
        label: city,
        value: city,
        source: "history",
      }));
      this._render(localHits);

      // 2. Verzögert: Vorschläge von der API nachladen
      this.debounceTimer = setTimeout(() => {
        this._fetchOnlineSuggestions(query, localHits);
      }, this.DEBOUNCE_MS);
    });

    // Tastatursteuerung: Pfeiltasten, Enter, Escape
    this.input.addEventListener("keydown", (event) => {
      if (this.dropdown.classList.contains("hidden")) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this._move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this._move(-1);
      } else if (event.key === "Enter" && this.activeIndex >= 0) {
        event.preventDefault();
        this._choose(this.suggestions[this.activeIndex]);
      } else if (event.key === "Escape") {
        this.hide();
      }
    });

    // Klick außerhalb schließt die Vorschläge
    document.addEventListener("click", (event) => {
      if (
        !this.input.contains(event.target) &&
        !this.dropdown.contains(event.target)
      ) {
        this.hide();
      }
    });
  }

  /**
   * Holt Städtevorschläge von der API und mischt sie mit den
   * lokalen Treffern (ohne Duplikate).
   * @private
   */
  async _fetchOnlineSuggestions(query, localHits) {
    // Denselben Begriff nicht zweimal bei der API anfragen
    if (query === this.lastQuery) return;
    this.lastQuery = query;

    let cities;
    if (this.cache.has(query)) {
      // Bereits gesucht: Ergebnis aus dem Zwischenspeicher nehmen
      cities = this.cache.get(query);
    } else {
      cities = await this.api.searchCities(query);
      this.cache.set(query, cities);
    }

    // Nur anzeigen, wenn der Nutzer nicht schon weitergetippt hat
    if (this.input.value.trim() !== query) return;

    const localNames = localHits.map((h) => h.value.toLowerCase());

    const onlineHits = cities
      .filter((c) => localNames.indexOf(c.name.toLowerCase()) === -1)
      .map((c) => ({
        label: c.state
          ? `${c.name}, ${c.state} (${c.country})`
          : `${c.name} (${c.country})`,
        value: c.name,
        source: "api",
      }));

    this._render(localHits.concat(onlineHits));
  }

  /**
   * Baut die Vorschlagsliste im DOM auf.
   * @private
   */
  _render(items) {
    this.suggestions = items;
    this.activeIndex = -1;
    this.dropdown.innerHTML = "";

    if (items.length === 0) {
      this.hide();
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "suggestion";

      const icon = document.createElement("span");
      icon.className = "suggestion-icon";
      // Uhr = aus dem Verlauf, Lupe = von der API
      icon.textContent = item.source === "history" ? "🕘" : "🔍";

      const text = document.createElement("span");
      text.textContent = item.label;

      row.appendChild(icon);
      row.appendChild(text);

      row.addEventListener("mousedown", (event) => {
        event.preventDefault(); // verhindert Fokusverlust vor dem Klick
        this._choose(item);
      });

      row.addEventListener("mouseenter", () => {
        this.activeIndex = index;
        this._highlight();
      });

      this.dropdown.appendChild(row);
    });

    this.dropdown.classList.remove("hidden");
  }

  /**
   * Bewegt die Auswahl mit den Pfeiltasten.
   * @private
   */
  _move(direction) {
    const count = this.suggestions.length;
    if (count === 0) return;

    this.activeIndex = (this.activeIndex + direction + count) % count;
    this._highlight();
  }

  /** @private */
  _highlight() {
    const children = this.dropdown.children;
    for (let i = 0; i < children.length; i++) {
      children[i].classList.toggle("active", i === this.activeIndex);
    }
  }

  /** @private */
  _choose(item) {
    this.input.value = item.value;
    this.hide();
    this.onSelect(item.value);
  }

  /** Schließt die Vorschlagsliste. */
  hide() {
    this.dropdown.classList.add("hidden");
    this.dropdown.innerHTML = "";
    this.suggestions = [];
    this.activeIndex = -1;
    this.lastQuery = "";
  }
}

/**
 * Klasse: UIController
 * Verantwortlich für alle DOM-Manipulationen: Anzeigen von
 * Ergebnissen, Fehlermeldungen, Ladezuständen, Favoriten
 * und Suchverlauf.
 * Basis: Ahmad
 */
