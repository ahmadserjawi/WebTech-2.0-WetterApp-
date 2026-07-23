/* ==========================================================
   WETTER-APP – JavaScript (ES6 Klassenarchitektur)
   Basis-Architektur & Grundgerüst: Ahmad
   API-Logik (WeatherAPI-Klasse): Dilan
   localStorage-Feature (StorageManager-Klasse): Ahmad
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
  }

  /**
   * Ruft die Wetterdaten für eine bestimmte Stadt ab.
   * @param {string} city - Name der Stadt
   * @returns {Promise<Object>} Verarbeitete Wetterdaten
   * @throws {Error} Wenn die Stadt nicht gefunden wird oder ein anderer Fehler auftritt
   */
  async getWeatherByCity(city) {
    const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=de`;

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
      throw new Error(`Fehler beim Abrufen der Wetterdaten (Status ${response.status}).`);
    }

    const data = await response.json();
    return this._mapResponseToWeatherData(data);
  }

  /**
   * Wandelt die rohe API-Antwort in ein einfaches, für die UI
   * nutzbares Objekt um.
   * @private
   */
  _mapResponseToWeatherData(data) {
    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      iconCode: data.weather[0].icon,
    };
  }
}

/**
 * Klasse: StorageManager
 * Kapselt den gesamten Zugriff auf localStorage.
 * Speichert: die zuletzt gesuchte Stadt sowie eine Liste
 * von Favoriten-Städten. Läuft rein clientseitig, es wird
 * KEINE echte Datenbank benötigt (siehe README).
 * Autor: Ahmad
 */
class StorageManager {
  constructor() {
    this.LAST_CITY_KEY = "weatherApp_lastCity";
    this.FAVORITES_KEY = "weatherApp_favorites";
  }

  /** Speichert die zuletzt erfolgreich gesuchte Stadt. */
  saveLastCity(city) {
    localStorage.setItem(this.LAST_CITY_KEY, city);
  }

  /** Gibt die zuletzt gesuchte Stadt zurück (oder null). */
  getLastCity() {
    return localStorage.getItem(this.LAST_CITY_KEY);
  }

  /** Gibt die Liste der gespeicherten Favoriten zurück. */
  getFavorites() {
    const raw = localStorage.getItem(this.FAVORITES_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
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
}

/**
 * Klasse: UIController
 * Verantwortlich für alle DOM-Manipulationen: Anzeigen von
 * Ergebnissen, Fehlermeldungen, Ladezuständen und Favoriten.
 * Basis: Ahmad
 */
class UIController {
  constructor() {
    this.elements = {
      form: document.getElementById("search-form"),
      input: document.getElementById("city-input"),
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
      addFavoriteButton: document.getElementById("add-favorite-button"),
      favoritesList: document.getElementById("favorites-list"),
      noFavoritesText: document.getElementById("no-favorites-text"),
    };
  }

  getCityInputValue() {
    return this.elements.input.value.trim();
  }

  setCityInputValue(city) {
    this.elements.input.value = city;
  }

  showLoading() {
    this._hideAll();
    this.elements.loading.classList.remove("hidden");
  }

  showWeather(weatherData) {
    this._hideAll();

    this.elements.cityName.textContent = weatherData.city;
    this.elements.icon.src = `https://openweathermap.org/img/wn/${weatherData.iconCode}@2x.png`;
    this.elements.icon.alt = weatherData.description;
    this.elements.temperature.textContent = `${weatherData.temperature}°C`;
    this.elements.description.textContent = weatherData.description;
    this.elements.feelsLike.textContent = `Gefühlt: ${weatherData.feelsLike}°C`;
    this.elements.humidity.textContent = `Luftfeuchtigkeit: ${weatherData.humidity}%`;

    this.elements.resultCard.classList.remove("hidden");
  }

  showError(message) {
    this._hideAll();
    this.elements.errorText.textContent = message;
    this.elements.errorBox.classList.remove("hidden");
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
}

/**
 * Klasse: App
 * Steuert den Ablauf der Anwendung (Verbindung zwischen
 * UIController, WeatherAPI und StorageManager).
 * Basis-Architektur: Ahmad
 */
class App {
  constructor(apiKey) {
    this.ui = new UIController();
    this.weatherApi = new WeatherAPI(apiKey);
    this.storage = new StorageManager();

    this._registerEvents();
    this._loadInitialState();
  }

  _registerEvents() {
    this.ui.elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this._handleSearch(this.ui.getCityInputValue());
    });

    this.ui.elements.addFavoriteButton.addEventListener("click", () => {
      this._handleAddFavorite();
    });
  }

  /**
   * Beim Start: Favoriten anzeigen und, falls vorhanden,
   * automatisch die zuletzt gesuchte Stadt laden.
   */
  _loadInitialState() {
    this._refreshFavorites();

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

    this.ui.showLoading();

    try {
      const weatherData = await this.weatherApi.getWeatherByCity(city);
      this.ui.showWeather(weatherData);
      this.storage.saveLastCity(weatherData.city);
    } catch (error) {
      this.ui.showError(error.message);
    }
  }

  _handleAddFavorite() {
    const city = this.ui.getCityInputValue();

    if (!city) {
      this.ui.showError("Bitte zuerst eine Stadt suchen, bevor du sie merkst.");
      return;
    }

    const wasAdded = this.storage.addFavorite(city);
    if (!wasAdded) {
      this.ui.showError(`"${city}" ist bereits in deinen Favoriten.`);
      return;
    }

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
      }
    );
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
