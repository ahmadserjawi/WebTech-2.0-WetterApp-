/* ==========================================================
   App.js  –  Steuerung: verbindet alle Klassen
   Autor: Ahmad
   ========================================================== */

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
