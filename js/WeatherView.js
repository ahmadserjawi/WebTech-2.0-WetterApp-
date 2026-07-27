/* ==========================================================
   WeatherView.js  –  Anzeige des aktuellen Wetters
   Zuständig für: Wetterkarte, Ladeanzeige, Fehlermeldung,
   Einheiten-Anzeige, Merken-Button, Standort-Button.
   Autorin: Cheyenne
   ========================================================== */

/**
 * Klasse: WeatherView
 * Kapselt alle DOM-Zugriffe rund um das aktuelle Wetter.
 * Kennt keine anderen Klassen und ruft keine API auf – sie
 * bekommt fertige Daten übergeben und zeigt sie an.
 */
class WeatherView {
  constructor() {
    this.elements = {
      input: document.getElementById("city-input"),
      loading: document.getElementById("loading"),
      errorBox: document.getElementById("error-message"),
      errorText: document.getElementById("error-text"),
      retryButton: document.getElementById("retry-button"),
      resultCard: document.getElementById("weather-result"),
      cityName: document.getElementById("city-name"),
      icon: document.getElementById("weather-icon"),
      temperature: document.getElementById("temperature"),
      description: document.getElementById("description"),
      feelsLike: document.getElementById("feels-like"),
      humidity: document.getElementById("humidity"),
      wind: document.getElementById("wind"),
      addFavoriteButton: document.getElementById("add-favorite-button"),
      locationButton: document.getElementById("location-button"),
      unitToggle: document.getElementById("unit-toggle"),
    };

    // Aktuell gewählte Einheit: "metric" (°C) oder "imperial" (°F)
    this.unit = "metric";
  }

  /* ---------- Eingabefeld ---------- */

  getCityInputValue() {
    return this.elements.input.value.trim();
  }

  setCityInputValue(city) {
    this.elements.input.value = city;
  }

  /* ---------- Einheiten ---------- */

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

  /* ---------- Zustände: Laden / Fehler / Ergebnis ---------- */

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

  /**
   * Zeigt die Wetterdaten an.
   * @param {Object} weatherData - aufbereitete Daten der WeatherAPI
   */
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
   * Versteckt Laden, Fehler und Ergebnis – damit immer nur
   * genau einer dieser drei Zustände sichtbar ist.
   * @private
   */
  _hideAll() {
    this.elements.loading.classList.add("hidden");
    this.elements.errorBox.classList.add("hidden");
    this.elements.resultCard.classList.add("hidden");
  }

  /* ---------- Buttons ---------- */

  /** Aktualisiert den Merken-Button je nach Favoriten-Status. */
  updateFavoriteButton(isFavorite) {
    this.elements.addFavoriteButton.textContent = isFavorite
      ? "★ Gemerkt"
      : "☆ Merken";
    this.elements.addFavoriteButton.classList.toggle("is-favorite", isFavorite);
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
}
