/* ==========================================================
   WeatherAPI.js  –  Kommunikation mit der OpenWeatherMap API
   Autor: Dilan
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
