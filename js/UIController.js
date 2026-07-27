/* ==========================================================
   UIController.js  –  Fassade für die gesamte Anzeige
   Bündelt WeatherView (aktuelles Wetter) und ListView
   (Favoriten, Verlauf, Vorhersage) zu einer einzigen
   Schnittstelle, die App verwendet. So bleibt App von der
   Aufteilung der Anzeige unberührt.
   Basis: Ahmad
   ========================================================== */

/**
 * Klasse: UIController
 * Delegiert jeden Aufruf an die passende Teil-View. Enthält
 * selbst keine DOM-Logik mehr – diese liegt in WeatherView
 * und ListView.
 */
class UIController {
  constructor() {
    this.weatherView = new WeatherView();
    this.listView = new ListView();

    // App greift an einzelnen Stellen direkt auf Elemente und die
    // Einheit zu. Beides wird hier weitergereicht, damit sich für
    // App nichts ändert.
    this.elements = {
      form: document.getElementById("search-form"),
      clearHistoryButton: document.getElementById("clear-history-button"),
      input: this.weatherView.elements.input,
      suggestions: document.getElementById("suggestions"),
      addFavoriteButton: this.weatherView.elements.addFavoriteButton,
      locationButton: this.weatherView.elements.locationButton,
      unitToggle: this.weatherView.elements.unitToggle,
      retryButton: this.weatherView.elements.retryButton,
    };
  }

  /* ---------- Einheit (wird von App gelesen) ---------- */

  get unit() {
    return this.weatherView.unit;
  }

  setUnit(unit) {
    this.weatherView.setUnit(unit);
  }

  getUnitSymbol() {
    return this.weatherView.getUnitSymbol();
  }

  getWindUnit() {
    return this.weatherView.getWindUnit();
  }

  /* ---------- Eingabefeld ---------- */

  getCityInputValue() {
    return this.weatherView.getCityInputValue();
  }

  setCityInputValue(city) {
    this.weatherView.setCityInputValue(city);
  }

  /* ---------- Aktuelles Wetter (an WeatherView) ---------- */

  showLoading(message) {
    this.weatherView.showLoading(message);
  }

  showWeather(weatherData) {
    this.weatherView.showWeather(weatherData);
  }

  showError(message, canRetry) {
    this.weatherView.showError(message, canRetry);
  }

  updateFavoriteButton(isFavorite) {
    this.weatherView.updateFavoriteButton(isFavorite);
  }

  setLocationButtonBusy(isBusy) {
    this.weatherView.setLocationButtonBusy(isBusy);
  }

  hideLocationButton() {
    this.weatherView.hideLocationButton();
  }

  /* ---------- Listen (an ListView) ---------- */

  renderFavorites(favorites, onSelect, onRemove) {
    this.listView.renderFavorites(favorites, onSelect, onRemove);
  }

  renderHistory(history, onSelect) {
    this.listView.renderHistory(history, onSelect);
  }

  renderForecast(days) {
    this.listView.renderForecast(days);
  }

  hideForecast() {
    this.listView.hideForecast();
  }
}
