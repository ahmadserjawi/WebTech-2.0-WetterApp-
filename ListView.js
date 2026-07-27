/* ==========================================================
   ListView.js  –  Anzeige der drei Listen
   Zuständig für: Favoriten-Chips, Suchverlauf,
   5-Tage-Vorhersage (inklusive Temperaturbalken).
   Autorin: Cheyenne
   ========================================================== */

/**
 * Klasse: ListView
 * Baut die Listen im DOM auf. Bekommt die Daten und die
 * Klick-Callbacks übergeben und kennt selbst keine anderen
 * Klassen – dadurch bleibt die Anzeige von der Logik getrennt.
 */
class ListView {
  constructor() {
    this.elements = {
      favoritesList: document.getElementById("favorites-list"),
      noFavoritesText: document.getElementById("no-favorites-text"),
      historySection: document.getElementById("history-section"),
      historyList: document.getElementById("history-list"),
      forecastSection: document.getElementById("forecast-section"),
      forecastList: document.getElementById("forecast-list"),
    };
  }

  /* ==========================================================
     FAVORITEN
     ========================================================== */

  /**
   * Rendert die Favoriten-Liste neu.
   * @param {string[]} favorites - Liste der Favoriten-Städte
   * @param {Function} onSelect - Callback bei Klick auf einen Favoriten
   * @param {Function} onRemove - Callback beim Entfernen
   */
  renderFavorites(favorites, onSelect, onRemove) {
    this.elements.favoritesList.innerHTML = "";

    if (favorites.length === 0) {
      this.elements.noFavoritesText.classList.remove("hidden");
      this.elements.favoritesList.appendChild(this.elements.noFavoritesText);
      return;
    }

    this.elements.noFavoritesText.classList.add("hidden");

    favorites.forEach((city) => {
      const chip = document.createElement("div");
      chip.className = "favorite-chip";

      const label = document.createElement("span");
      label.textContent = city;
      label.addEventListener("click", () => onSelect(city));

      const removeButton = document.createElement("button");
      removeButton.className = "remove-favorite";
      removeButton.type = "button";
      removeButton.textContent = "✕";
      removeButton.title = "Favorit entfernen";
      removeButton.addEventListener("click", (event) => {
        // Verhindert, dass gleichzeitig der Chip angeklickt wird
        event.stopPropagation();
        onRemove(city);
      });

      chip.appendChild(label);
      chip.appendChild(removeButton);
      this.elements.favoritesList.appendChild(chip);
    });
  }

  /* ==========================================================
     SUCHVERLAUF
     ========================================================== */

  /**
   * Rendert den Suchverlauf neu.
   * @param {Array} history - Einträge aus dem StorageManager
   * @param {Function} onSelect - Callback bei Klick auf einen Eintrag
   */
  renderHistory(history, onSelect) {
    this.elements.historyList.innerHTML = "";

    if (history.length === 0) {
      this.elements.historySection.classList.add("hidden");
      return;
    }

    this.elements.historySection.classList.remove("hidden");

    history.forEach((entry) => {
      const row = document.createElement("button");
      row.className = "history-item";
      row.type = "button";
      row.addEventListener("click", () => onSelect(entry.city));

      const icon = document.createElement("img");
      icon.src = `https://openweathermap.org/img/wn/${entry.iconCode}.png`;
      icon.alt = entry.description || "";
      icon.loading = "lazy";

      const name = document.createElement("span");
      name.className = "history-city";
      name.textContent = entry.city;

      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = this._formatRelativeTime(entry.timestamp);

      const temp = document.createElement("span");
      temp.className = "history-temp";
      temp.textContent = `${entry.temperature}°`;

      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(time);
      row.appendChild(temp);
      this.elements.historyList.appendChild(row);
    });
  }

  /* ==========================================================
     5-TAGE-VORHERSAGE
     ========================================================== */

  /**
   * Rendert die 5-Tage-Vorhersage.
   * Der Temperaturbalken zeigt die Tagesspanne im Verhältnis zur
   * gesamten Woche, damit man wärmere und kältere Tage sofort sieht.
   * @param {Array} days - Tages-Objekte aus der WeatherAPI
   */
  renderForecast(days) {
    this.elements.forecastList.innerHTML = "";

    if (!days || days.length === 0) {
      this.elements.forecastSection.classList.add("hidden");
      return;
    }

    this.elements.forecastSection.classList.remove("hidden");

    // Gesamtspanne der Woche für die Balkenbreite ermitteln
    const weekMin = Math.min.apply(null, days.map((d) => d.min));
    const weekMax = Math.max.apply(null, days.map((d) => d.max));
    const weekRange = weekMax - weekMin || 1; // Division durch 0 vermeiden

    days.forEach((day) => {
      this.elements.forecastList.appendChild(
        this._buildForecastRow(day, weekMin, weekRange)
      );
    });
  }

  /** Blendet die Vorhersage aus (z. B. bei einem Fehler). */
  hideForecast() {
    this.elements.forecastSection.classList.add("hidden");
  }

  /**
   * Baut eine einzelne Zeile der Vorhersage.
   * @private
   */
  _buildForecastRow(day, weekMin, weekRange) {
    const row = document.createElement("div");
    row.className = "forecast-row";

    // Wochentag
    const name = document.createElement("span");
    name.className = "forecast-day";
    name.textContent = this._formatWeekday(day.timestamp);

    // Icon
    const icon = document.createElement("img");
    icon.className = "forecast-icon";
    icon.src = `https://openweathermap.org/img/wn/${day.icon}.png`;
    icon.alt = day.description;
    icon.title = day.description;
    icon.loading = "lazy";

    // Regenwahrscheinlichkeit (nur ab 20 % anzeigen)
    const rain = document.createElement("span");
    rain.className = "forecast-rain";
    rain.textContent = day.rainChance >= 20 ? `${day.rainChance}%` : "";

    // Tiefstwert
    const min = document.createElement("span");
    min.className = "forecast-min";
    min.textContent = `${day.min}°`;

    // Temperaturbalken
    const barTrack = document.createElement("span");
    barTrack.className = "forecast-bar";
    const barFill = document.createElement("span");
    barFill.className = "forecast-bar-fill";
    const left = ((day.min - weekMin) / weekRange) * 100;
    const width = ((day.max - day.min) / weekRange) * 100;
    barFill.style.left = `${left}%`;
    barFill.style.width = `${Math.max(width, 8)}%`; // Mindestbreite
    barTrack.appendChild(barFill);

    // Höchstwert
    const max = document.createElement("span");
    max.className = "forecast-max";
    max.textContent = `${day.max}°`;

    row.appendChild(name);
    row.appendChild(icon);
    row.appendChild(rain);
    row.appendChild(min);
    row.appendChild(barTrack);
    row.appendChild(max);
    return row;
  }

  /* ==========================================================
     HILFSFUNKTIONEN (Datum & Zeit)
     ========================================================== */

  /**
   * Gibt "Morgen" oder den Wochentag zurück (z. B. "Montag").
   * @private
   */
  _formatWeekday(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);

    if (date.toDateString() === tomorrow.toDateString()) {
      return "Morgen";
    }

    const weekdays = [
      "Sonntag", "Montag", "Dienstag", "Mittwoch",
      "Donnerstag", "Freitag", "Samstag",
    ];
    return weekdays[date.getDay()];
  }

  /**
   * Wandelt einen Zeitstempel in "vor 5 Min." o. Ä. um.
   * @private
   */
  _formatRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "gerade eben";
    if (minutes < 60) return `vor ${minutes} Min.`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "gestern";
    return `vor ${days} Tagen`;
  }
}
