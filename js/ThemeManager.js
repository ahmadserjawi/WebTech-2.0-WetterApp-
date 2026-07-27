/* ==========================================================
   ThemeManager.js  –  Wetterabhängiger Hintergrund
   Autor: Ahmad
   ========================================================== */

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
