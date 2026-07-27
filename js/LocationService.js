/* ==========================================================
   LocationService.js  –  Standortabfrage (Geolocation)
   Autor: Ahmad
   ========================================================== */

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
