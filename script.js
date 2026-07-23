/* ==========================================================
   WETTER-APP – JavaScript (ES6 Klassenarchitektur)
   Basis-Architektur & Grundgerüst: Ahmad
   API-Logik (WeatherAPI-Klasse): Dilan
   localStorage-Feature (StorageManager-Klasse): Ahmad
   Suchverlauf, Smart Search & Wetter-Theme: Ahmad
   ========================================================== */

/**
 * Klasse: WeatherAPI
 * Verantwortlich für die komplette Kommunikation mit der
 * OpenWeatherMap API (Fetch-Request & JSON-Verarbeitung).
 * Autor: Dilan
 */
class WeatherAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.openweathermap.org/data/2.5/weather";
    this.forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";
    this.geoUrl = "https://api.openweathermap.org/geo/1.0/direct";
    this.units = "metric"; // "metric" = °C/km-h, "imperial" = °F/mph
  }

  /** Stellt die Einheit für alle folgenden Abfragen um. */
  setUnits(units) {
    this.units = units;
  }

  /**
   * Ruft die Wetterdaten für eine bestimmte Stadt ab.
   * @param {string} city - Name der Stadt
   * @returns {Promise<Object>} Verarbeitete Wetterdaten
   * @throws {Error} Wenn die Stadt nicht gefunden wird oder ein anderer Fehler auftritt
   */
  async getWeatherByCity(city) {
    const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.units}&lang=de`;

    let response;
    try {
      response = await fetch(url);
    } catch (networkError) {
      throw new Error("Netzwerkfehler: Bitte Internetverbindung prüfen.");
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Stadt "${city}" wurde nicht gefunden.`);
      }
      if (response.status === 401) {
        throw new Error("Ungültiger API-Key. Bitte in script.js prüfen.");
      }
      if (response.status === 429) {
        throw new Error("API-Limit erreicht. Bitte später erneut versuchen.");
      }
      throw new Error(`Fehler beim Abrufen der Wetterdaten (Status ${response.status}).`);
    }

    const data = await response.json();
    return this._mapResponseToWeatherData(data);
  }

  /**
   * Ruft die Wetterdaten anhand von Koordinaten ab (für Geolocation).
   * @param {number} lat - Breitengrad
   * @param {number} lon - Längengrad
   * @returns {Promise<Object>} Verarbeitete Wetterdaten
   */
  async getWeatherByCoords(lat, lon) {
    const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}&lang=de`;

    let response;
    try {
      response = await fetch(url);
    } catch (networkError) {
      throw new Error("Netzwerkfehler: Bitte Internetverbindung prüfen.");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Ungültiger API-Key. Bitte in script.js prüfen.");
      }
      throw new Error("Wetter für deinen Standort konnte nicht geladen werden.");
    }

    const data = await response.json();
    return this._mapResponseToWeatherData(data);
  }

  /**
   * Ruft die 5-Tage-Vorhersage für eine Stadt ab.
   * Die API liefert Werte in 3-Stunden-Schritten; diese werden
   * hier zu Tageswerten zusammengefasst.
   * @param {string} city - Name der Stadt
   * @returns {Promise<Array>} Liste von Tages-Objekten
   * @throws {Error} Bei Netzwerk- oder API-Fehlern
   */
  async getForecastByCity(city) {
    const url = `${this.forecastUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.units}&lang=de`;

    let response;
    try {
      response = await fetch(url);
    } catch (networkError) {
      throw new Error("Netzwerkfehler: Bitte Internetverbindung prüfen.");
    }

    if (!response.ok) {
      throw new Error("Vorhersage konnte nicht geladen werden.");
    }

    const data = await response.json();
    return this._groupForecastByDay(data);
  }

  /**
   * Fasst die 3-Stunden-Werte der API zu Tagen zusammen.
   * Für jeden Tag werden ermittelt: Min-/Max-Temperatur, das Wetter
   * um die Mittagszeit (repräsentativ für den Tag) und die höchste
   * Regenwahrscheinlichkeit.
   * Der heutige Tag wird übersprungen, da er schon in der
   * Hauptanzeige steht.
   * @private
   */
  _groupForecastByDay(data) {
    const timezoneOffsetMs = (data.city && data.city.timezone ? data.city.timezone : 0) * 1000;
    const days = new Map();

    data.list.forEach((entry) => {
      // In die lokale Zeit der Stadt umrechnen, damit die
      // Tagesgrenzen zur jeweiligen Zeitzone passen
      const localDate = new Date(entry.dt * 1000 + timezoneOffsetMs);
      const dayKey = localDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const hour = localDate.getUTCHours();

      if (!days.has(dayKey)) {
        days.set(dayKey, {
          dateKey: dayKey,
          timestamp: entry.dt * 1000,
          min: entry.main.temp,
          max: entry.main.temp,
          icon: entry.weather[0].icon,
          description: entry.weather[0].description,
          rainChance: entry.pop || 0,
          bestHourDiff: Math.abs(hour - 12),
        });
        return;
      }

      const day = days.get(dayKey);
      day.min = Math.min(day.min, entry.main.temp);
      day.max = Math.max(day.max, entry.main.temp);
      day.rainChance = Math.max(day.rainChance, entry.pop || 0);

      // Das Wetter-Icon vom Zeitpunkt nehmen, der der Mittagszeit
      // am nächsten liegt – das beschreibt den Tag am besten
      const hourDiff = Math.abs(hour - 12);
      if (hourDiff < day.bestHourDiff) {
        day.bestHourDiff = hourDiff;
        day.icon = entry.weather[0].icon;
        day.description = entry.weather[0].description;
      }
    });

    // Heutigen Tag überspringen und auf 5 Tage begrenzen
    const todayKey = new Date(Date.now() + timezoneOffsetMs)
      .toISOString()
      .slice(0, 10);

    return Array.from(days.values())
      .filter((day) => day.dateKey !== todayKey)
      .slice(0, 5)
      .map((day) => ({
        timestamp: day.timestamp,
        min: Math.round(day.min),
        max: Math.round(day.max),
        icon: day.icon,
        description: day.description,
        rainChance: Math.round(day.rainChance * 100),
      }));
  }

  /**
   * Sucht passende Städte für die Autovervollständigung (Geocoding-API).
   * Wirft absichtlich KEINEN Fehler: schlägt die Suche fehl, gibt es
   * einfach keine Online-Vorschläge und die App läuft normal weiter.
   * @param {string} query - Teil eines Stadtnamens
   * @returns {Promise<Array>} Liste von { name, country, state }
   */
  async searchCities(query) {
    const url = `${this.geoUrl}?q=${encodeURIComponent(query)}&limit=5&appid=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      return data.map((item) => ({
        name: item.name,
        country: item.country,
        state: item.state || "",
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Wandelt die rohe API-Antwort in ein einfaches, für die UI
   * nutzbares Objekt um.
   * @private
   */
  _mapResponseToWeatherData(data) {
    return {
      city: data.name,
      country: data.sys && data.sys.country ? data.sys.country : "",
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      // metric: API liefert m/s -> in km/h umrechnen
      // imperial: API liefert bereits mph -> unverändert übernehmen
      windSpeed: this.units === "metric"
        ? Math.round((data.wind && data.wind.speed ? data.wind.speed : 0) * 3.6)
        : Math.round(data.wind && data.wind.speed ? data.wind.speed : 0),
      description: data.weather[0].description,
      iconCode: data.weather[0].icon,
      condition: data.weather[0].main,
    };
  }
}

/**
 * Klasse: StorageManager
 * Kapselt den gesamten Zugriff auf localStorage.
 * Speichert: die zuletzt gesuchte Stadt, eine Liste von
 * Favoriten-Städten sowie den Suchverlauf.
 * Läuft rein clientseitig, es wird KEINE echte Datenbank
 * benötigt (siehe README).
 * Autor: Ahmad
 */
class StorageManager {
  constructor() {
    this.LAST_CITY_KEY = "weatherApp_lastCity";
    this.FAVORITES_KEY = "weatherApp_favorites";
    this.HISTORY_KEY = "weatherApp_history";
    this.UNIT_KEY = "weatherApp_unit";
    this.MAX_HISTORY = 10;
  }

  /** Speichert die zuletzt erfolgreich gesuchte Stadt. */
  saveLastCity(city) {
    localStorage.setItem(this.LAST_CITY_KEY, city);
  }

  /** Gibt die zuletzt gesuchte Stadt zurück (oder null). */
  getLastCity() {
    return localStorage.getItem(this.LAST_CITY_KEY);
  }

  /** Speichert die gewählte Einheit ("metric" oder "imperial"). */
  saveUnit(unit) {
    localStorage.setItem(this.UNIT_KEY, unit);
  }

  /** Gibt die gespeicherte Einheit zurück (Standard: "metric"). */
  getUnit() {
    const saved = localStorage.getItem(this.UNIT_KEY);
    return saved === "imperial" ? "imperial" : "metric";
  }

  /** Gibt die Liste der gespeicherten Favoriten zurück. */
  getFavorites() {
    return this._readJson(this.FAVORITES_KEY);
  }

  /**
   * Fügt eine Stadt zu den Favoriten hinzu (keine Duplikate,
   * Groß-/Kleinschreibung wird ignoriert).
   * @returns {boolean} true, wenn hinzugefügt; false, wenn bereits vorhanden
   */
  addFavorite(city) {
    const favorites = this.getFavorites();
    const alreadyExists = favorites.some(
      (fav) => fav.toLowerCase() === city.toLowerCase()
    );

    if (alreadyExists) {
      return false;
    }

    favorites.push(city);
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }

  /** Entfernt eine Stadt aus den Favoriten. */
  removeFavorite(city) {
    const favorites = this.getFavorites().filter(
      (fav) => fav.toLowerCase() !== city.toLowerCase()
    );
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
  }

  /** Prüft, ob eine Stadt bereits Favorit ist. */
  isFavorite(city) {
    return this.getFavorites().some(
      (fav) => fav.toLowerCase() === city.toLowerCase()
    );
  }

  /* ---------- Suchverlauf ---------- */

  /**
   * Gibt den Suchverlauf zurück (neueste zuerst).
   * @returns {Array} Liste von { city, temperature, iconCode, timestamp }
   */
  getHistory() {
    return this._readJson(this.HISTORY_KEY);
  }

  /**
   * Speichert eine erfolgreiche Suche im Verlauf.
   * Dieselbe Stadt erscheint nur einmal (der alte Eintrag wird
   * durch den neuen ersetzt). Es werden maximal MAX_HISTORY
   * Einträge behalten.
   */
  addToHistory(weatherData) {
    const history = this.getHistory().filter(
      (entry) => entry.city.toLowerCase() !== weatherData.city.toLowerCase()
    );

    history.unshift({
      city: weatherData.city,
      country: weatherData.country,
      temperature: weatherData.temperature,
      iconCode: weatherData.iconCode,
      description: weatherData.description,
      timestamp: Date.now(),
    });

    const trimmed = history.slice(0, this.MAX_HISTORY);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmed));
  }

  /** Löscht den kompletten Suchverlauf. */
  clearHistory() {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  /**
   * Sucht im Verlauf nach passenden Städten (für die Smart Search).
   * @param {string} query
   * @returns {string[]} Passende Stadtnamen
   */
  searchHistory(query) {
    const lower = query.toLowerCase();
    return this.getHistory()
      .map((entry) => entry.city)
      .filter((city) => city.toLowerCase().startsWith(lower));
  }

  /**
   * Liest einen JSON-Wert aus localStorage; gibt bei Fehlern
   * ein leeres Array zurück.
   * @private
   */
  _readJson(key) {
    const raw = localStorage.getItem(key);
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
}

/**
 * Klasse: LocationService
 * Kapselt die Geolocation-API des Browsers und wandelt die
 * technischen Fehlercodes in verständliche deutsche Meldungen um.
 * Autor: Ahmad
 */
class LocationService {
  /** Prüft, ob der Browser Standortabfragen unterstützt. */
  isSupported() {
    return typeof navigator !== "undefined" && !!navigator.geolocation;
  }

  /**
   * Fragt die aktuelle Position ab.
   * @returns {Promise<{lat: number, lon: number}>}
   * @throws {Error} Mit einer für Nutzer verständlichen Meldung
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("Dein Browser unterstützt keine Standortabfrage."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(this._translateError(error)));
        },
        {
          enableHighAccuracy: false, // Stadtgenauigkeit reicht, schont den Akku
          timeout: 10000,
          maximumAge: 300000, // 5 Minuten alte Position ist noch brauchbar
        }
      );
    });
  }

  /**
   * Übersetzt die Fehlercodes der Geolocation-API.
   * @private
   */
  _translateError(error) {
    // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
    if (error.code === 1) {
      return "Standortzugriff wurde abgelehnt. Du kannst die Stadt manuell eingeben.";
    }
    if (error.code === 2) {
      return "Standort konnte nicht ermittelt werden.";
    }
    if (error.code === 3) {
      return "Standortabfrage hat zu lange gedauert. Bitte erneut versuchen.";
    }
    return "Standort konnte nicht ermittelt werden.";
  }
}

/**
 * Klasse: ThemeManager
 * Passt den Hintergrund der Seite an das aktuelle Wetter an
 * (z. B. Regen, Schnee, Sonne) und unterscheidet Tag/Nacht.
 * Autor: Ahmad
 */
class ThemeManager {
  constructor() {
    // Zuordnung: API-Wetterlage -> CSS-Klasse
    this.themeMap = {
      Clear: "theme-clear",
      Clouds: "theme-clouds",
      Rain: "theme-rain",
      Drizzle: "theme-rain",
      Thunderstorm: "theme-storm",
      Snow: "theme-snow",
      Mist: "theme-fog",
      Fog: "theme-fog",
      Haze: "theme-fog",
      Smoke: "theme-fog",
      Dust: "theme-fog",
      Sand: "theme-fog",
    };

    this.allThemes = [
      "theme-clear",
      "theme-clouds",
      "theme-rain",
      "theme-storm",
      "theme-snow",
      "theme-fog",
      "theme-night",
      "theme-default",
    ];
  }

  /**
   * Setzt das Theme anhand der Wetterdaten.
   * Der Icon-Code endet bei Nacht auf "n" (z. B. "01n").
   * @param {Object} weatherData
   */
  apply(weatherData) {
    const isNight = weatherData.iconCode.endsWith("n");
    const theme = isNight
      ? "theme-night"
      : this.themeMap[weatherData.condition] || "theme-default";

    this._setTheme(theme);
  }

  /** Setzt das Standard-Theme (beim Start, ohne Wetterdaten). */
  reset() {
    this._setTheme("theme-default");
  }

  /** @private */
  _setTheme(theme) {
    document.body.classList.remove.apply(document.body.classList, this.allThemes);
    document.body.classList.add(theme);
  }
}

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
class UIController {
  constructor() {
    this.elements = {
      form: document.getElementById("search-form"),
      input: document.getElementById("city-input"),
      suggestions: document.getElementById("suggestions"),
      loading: document.getElementById("loading"),
      errorBox: document.getElementById("error-message"),
      errorText: document.getElementById("error-text"),
      resultCard: document.getElementById("weather-result"),
      cityName: document.getElementById("city-name"),
      icon: document.getElementById("weather-icon"),
      temperature: document.getElementById("temperature"),
      description: document.getElementById("description"),
      feelsLike: document.getElementById("feels-like"),
      humidity: document.getElementById("humidity"),
      wind: document.getElementById("wind"),
      addFavoriteButton: document.getElementById("add-favorite-button"),
      favoritesList: document.getElementById("favorites-list"),
      noFavoritesText: document.getElementById("no-favorites-text"),
      historySection: document.getElementById("history-section"),
      historyList: document.getElementById("history-list"),
      clearHistoryButton: document.getElementById("clear-history-button"),
      forecastSection: document.getElementById("forecast-section"),
      forecastList: document.getElementById("forecast-list"),
      locationButton: document.getElementById("location-button"),
      unitToggle: document.getElementById("unit-toggle"),
      retryButton: document.getElementById("retry-button"),
    };

    // Aktuell gewählte Einheit: "metric" (°C) oder "imperial" (°F)
    this.unit = "metric";
  }

  /** Setzt die Anzeige-Einheit und aktualisiert den Umschalter. */
  setUnit(unit) {
    this.unit = unit;
    this.elements.unitToggle.textContent = unit === "metric" ? "°C" : "°F";
  }

  /** Gibt das Gradzeichen der aktuellen Einheit zurück. */
  getUnitSymbol() {
    return this.unit === "metric" ? "°C" : "°F";
  }

  /** Gibt die Windeinheit der aktuellen Einheit zurück. */
  getWindUnit() {
    return this.unit === "metric" ? "km/h" : "mph";
  }

  getCityInputValue() {
    return this.elements.input.value.trim();
  }

  setCityInputValue(city) {
    this.elements.input.value = city;
  }

  /**
   * Zeigt die Ladeanzeige, optional mit eigenem Text.
   * @param {string} [message] - z. B. "Standort wird ermittelt …"
   */
  showLoading(message) {
    this._hideAll();
    const label = this.elements.loading.querySelector("p");
    if (label) {
      label.textContent = message || "Lade Wetterdaten …";
    }
    this.elements.loading.classList.remove("hidden");
  }

  showWeather(weatherData) {
    this._hideAll();

    const title = weatherData.country
      ? `${weatherData.city}, ${weatherData.country}`
      : weatherData.city;

    this.elements.cityName.textContent = title;
    this.elements.icon.src = `https://openweathermap.org/img/wn/${weatherData.iconCode}@4x.png`;
    this.elements.icon.alt = weatherData.description;
    this.elements.temperature.textContent = `${weatherData.temperature}°`;
    this.elements.description.textContent = weatherData.description;
    this.elements.feelsLike.textContent = `${weatherData.feelsLike}°`;
    this.elements.humidity.textContent = `${weatherData.humidity}%`;
    this.elements.wind.textContent = `${weatherData.windSpeed} ${this.getWindUnit()}`;

    this.elements.resultCard.classList.remove("hidden");
  }

  /**
   * Zeigt eine Fehlermeldung.
   * @param {string} message
   * @param {boolean} [canRetry] - blendet den "Erneut versuchen"-Button ein
   */
  showError(message, canRetry) {
    this._hideAll();
    this.elements.errorText.textContent = message;
    this.elements.retryButton.classList.toggle("hidden", !canRetry);
    this.elements.errorBox.classList.remove("hidden");
  }

  /**
   * Markiert den Standort-Button als "arbeitet gerade" und
   * deaktiviert ihn, damit er nicht mehrfach gedrückt wird.
   */
  setLocationButtonBusy(isBusy) {
    this.elements.locationButton.disabled = isBusy;
    this.elements.locationButton.classList.toggle("is-busy", isBusy);
  }

  /** Versteckt den Standort-Button, falls der Browser ihn nicht unterstützt. */
  hideLocationButton() {
    this.elements.locationButton.classList.add("hidden");
  }

  /** Aktualisiert den Merken-Button je nach Favoriten-Status. */
  updateFavoriteButton(isFavorite) {
    this.elements.addFavoriteButton.textContent = isFavorite
      ? "★ Gemerkt"
      : "☆ Merken";
    this.elements.addFavoriteButton.classList.toggle("is-favorite", isFavorite);
  }

  _hideAll() {
    this.elements.loading.classList.add("hidden");
    this.elements.errorBox.classList.add("hidden");
    this.elements.resultCard.classList.add("hidden");
  }

  /**
   * Rendert die Favoriten-Liste im UI neu.
   * @param {string[]} favorites - Liste der Favoriten-Städte
   * @param {Function} onSelect - Callback, wenn ein Favorit angeklickt wird
   * @param {Function} onRemove - Callback, wenn ein Favorit entfernt wird
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
        event.stopPropagation();
        onRemove(city);
      });

      chip.appendChild(label);
      chip.appendChild(removeButton);
      this.elements.favoritesList.appendChild(chip);
    });
  }

  /**
   * Rendert den Suchverlauf im UI neu.
   * @param {Array} history - Einträge aus dem StorageManager
   * @param {Function} onSelect - Callback, wenn ein Eintrag angeklickt wird
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
      this.elements.forecastList.appendChild(row);
    });
  }

  /** Blendet die Vorhersage aus (z. B. bei einem Fehler). */
  hideForecast() {
    this.elements.forecastSection.classList.add("hidden");
  }

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

/**
 * Klasse: App
 * Steuert den Ablauf der Anwendung (Verbindung zwischen
 * UIController, WeatherAPI, StorageManager, ThemeManager
 * und SmartSearch).
 * Basis-Architektur: Ahmad
 */
class App {
  constructor(apiKey) {
    this.ui = new UIController();
    this.weatherApi = new WeatherAPI(apiKey);
    this.storage = new StorageManager();
    this.theme = new ThemeManager();
    this.location = new LocationService();

    this.smartSearch = new SmartSearch(
      this.ui.elements.input,
      this.ui.elements.suggestions,
      this.storage,
      this.weatherApi,
      (city) => this._handleSearch(city)
    );

    this.currentCity = null;
    // Merkt die letzte Aktion, damit "Erneut versuchen" sie wiederholen kann
    this.lastAction = null;

    this._registerEvents();
    this._loadInitialState();
  }

  _registerEvents() {
    this.ui.elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.smartSearch.hide();
      this._handleSearch(this.ui.getCityInputValue());
    });

    this.ui.elements.addFavoriteButton.addEventListener("click", () => {
      this._handleToggleFavorite();
    });

    this.ui.elements.clearHistoryButton.addEventListener("click", () => {
      this.storage.clearHistory();
      this._refreshHistory();
    });

    // Standort ermitteln
    this.ui.elements.locationButton.addEventListener("click", () => {
      this._handleLocationSearch();
    });

    // Zwischen °C und °F umschalten
    this.ui.elements.unitToggle.addEventListener("click", () => {
      this._handleUnitToggle();
    });

    // Erneut versuchen nach einem Fehler
    this.ui.elements.retryButton.addEventListener("click", () => {
      if (this.lastAction) {
        this.lastAction();
      }
    });
  }

  /**
   * Ermittelt den Standort des Nutzers und lädt das Wetter dafür.
   * Der Browser fragt dabei selbst um Erlaubnis.
   */
  async _handleLocationSearch() {
    this.lastAction = () => this._handleLocationSearch();
    this.smartSearch.hide();
    this.ui.showLoading("Standort wird ermittelt …");
    this.ui.setLocationButtonBusy(true);

    try {
      const coords = await this.location.getCurrentPosition();
      this.ui.showLoading("Lade Wetterdaten …");

      const weatherData = await this.weatherApi.getWeatherByCoords(
        coords.lat,
        coords.lon
      );

      this._applyWeather(weatherData);
    } catch (error) {
      // Bei abgelehnter Berechtigung ist ein zweiter Versuch sinnlos
      const isDenied = error.message.indexOf("abgelehnt") !== -1;
      this.ui.showError(error.message, !isDenied);
      this.ui.hideForecast();
    } finally {
      this.ui.setLocationButtonBusy(false);
    }
  }

  /**
   * Schaltet zwischen Celsius und Fahrenheit um und lädt die
   * aktuelle Stadt in der neuen Einheit neu.
   */
  _handleUnitToggle() {
    const newUnit = this.ui.unit === "metric" ? "imperial" : "metric";

    this.ui.setUnit(newUnit);
    this.weatherApi.setUnits(newUnit);
    this.storage.saveUnit(newUnit);

    // Verlauf leeren: die gespeicherten Temperaturen hätten
    // sonst die falsche Einheit
    this.storage.clearHistory();
    this._refreshHistory();

    if (this.currentCity) {
      this._handleSearch(this.currentCity);
    }
  }

  /**
   * Beim Start: gespeicherte Einheit übernehmen, Favoriten und
   * Verlauf anzeigen und, falls vorhanden, automatisch die zuletzt
   * gesuchte Stadt laden.
   */
  _loadInitialState() {
    this.theme.reset();

    // Gespeicherte Einheit wiederherstellen
    const unit = this.storage.getUnit();
    this.ui.setUnit(unit);
    this.weatherApi.setUnits(unit);

    // Standort-Button ausblenden, wenn der Browser das nicht kann
    if (!this.location.isSupported()) {
      this.ui.hideLocationButton();
    }

    this._refreshFavorites();
    this._refreshHistory();

    const lastCity = this.storage.getLastCity();
    if (lastCity) {
      this.ui.setCityInputValue(lastCity);
      this._handleSearch(lastCity);
    }
  }

  async _handleSearch(city) {
    if (!city) {
      this.ui.showError("Bitte gib eine Stadt ein.");
      return;
    }

    this.lastAction = () => this._handleSearch(city);
    this.ui.showLoading();

    try {
      const weatherData = await this.weatherApi.getWeatherByCity(city);
      this._applyWeather(weatherData);
    } catch (error) {
      // Bei "nicht gefunden" hilft ein Wiederholen nicht
      const notFound = error.message.indexOf("nicht gefunden") !== -1;
      this.ui.showError(error.message, !notFound);
      this.ui.hideForecast();
    }
  }

  /**
   * Übernimmt erfolgreich geladene Wetterdaten in die Anzeige,
   * setzt das Theme und aktualisiert Speicher und Vorhersage.
   * Wird sowohl bei der Stadtsuche als auch bei der
   * Standortabfrage verwendet.
   * @private
   */
  _applyWeather(weatherData) {
    this.ui.showWeather(weatherData);
    this.theme.apply(weatherData);

    this.currentCity = weatherData.city;
    this.ui.setCityInputValue(weatherData.city);
    this.ui.updateFavoriteButton(this.storage.isFavorite(weatherData.city));

    this.storage.saveLastCity(weatherData.city);
    this.storage.addToHistory(weatherData);
    this._refreshHistory();

    // Vorhersage separat laden: schlägt sie fehl, bleibt das
    // aktuelle Wetter trotzdem sichtbar.
    this._loadForecast(weatherData.city);
  }

  /**
   * Lädt die 5-Tage-Vorhersage. Fehler werden bewusst nur
   * verschluckt (Vorhersage wird dann ausgeblendet), damit die
   * Hauptanzeige nicht durch einen Zusatzfehler gestört wird.
   */
  async _loadForecast(city) {
    try {
      const days = await this.weatherApi.getForecastByCity(city);
      this.ui.renderForecast(days);
    } catch (error) {
      this.ui.hideForecast();
    }
  }

  /** Merkt die aktuelle Stadt oder entfernt sie aus den Favoriten. */
  _handleToggleFavorite() {
    const city = this.currentCity;

    if (!city) {
      this.ui.showError("Bitte zuerst eine Stadt suchen, bevor du sie merkst.");
      return;
    }

    if (this.storage.isFavorite(city)) {
      this.storage.removeFavorite(city);
    } else {
      this.storage.addFavorite(city);
    }

    this.ui.updateFavoriteButton(this.storage.isFavorite(city));
    this._refreshFavorites();
  }

  _refreshFavorites() {
    const favorites = this.storage.getFavorites();
    this.ui.renderFavorites(
      favorites,
      (city) => {
        this.ui.setCityInputValue(city);
        this._handleSearch(city);
      },
      (city) => {
        this.storage.removeFavorite(city);
        this._refreshFavorites();
        if (this.currentCity) {
          this.ui.updateFavoriteButton(this.storage.isFavorite(this.currentCity));
        }
      }
    );
  }

  _refreshHistory() {
    const history = this.storage.getHistory();
    this.ui.renderHistory(history, (city) => {
      this.ui.setCityInputValue(city);
      this._handleSearch(city);
    });
  }
}

/* ==========================================================
   APP-START
   WICHTIG: Hier den eigenen OpenWeatherMap API-Key eintragen!
   Siehe README.md für Anleitung.
   ========================================================== */
const API_KEY = "0bc02fed6ff5d90388957bf4af677375";

document.addEventListener("DOMContentLoaded", () => {
  new App(API_KEY);
});
