/* ==========================================================
   script.js  –  Einstiegspunkt der Wetter-App
   Startet die Anwendung, sobald die Seite geladen ist.
   Die einzelnen Klassen liegen im Ordner js/ und werden
   in index.html vor dieser Datei eingebunden.
   ========================================================== */

/* WICHTIG: Hier den eigenen OpenWeatherMap API-Key eintragen.
   Siehe README.md für die Anleitung. */
const API_KEY = "0bc02fed6ff5d90388957bf4af677375";

document.addEventListener("DOMContentLoaded", () => {
  new App(API_KEY);
});
