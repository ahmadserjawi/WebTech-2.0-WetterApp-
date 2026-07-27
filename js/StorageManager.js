/* ==========================================================
   StorageManager.js  –  Zugriff auf localStorage
   Autor: Ahmad
   ========================================================== */

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
