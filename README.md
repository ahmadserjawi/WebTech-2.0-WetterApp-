# Wetter-App – WebTech 2 Projekt

Clientseitige Wetter-App mit HTML5, CSS3 und Vanilla JavaScript (ES6+). Nutzt die OpenWeatherMap API für aktuelle Wetterdaten und Vorhersagen.

## Funktionen

- Wetter nach Stadtname abrufen (Temperatur, Beschreibung, Icon)
- Gefühlte Temperatur, Luftfeuchtigkeit, Windgeschwindigkeit
- Fehlerbehandlung (Stadt nicht gefunden, ungültiger API-Key, API-Limit, Netzwerkfehler)
- Autovervollständigung bei der Suche: zeigt zuerst eigene frühere Suchen, dann Vorschläge über die Geocoding-API. Funktioniert mit Maus und Tastatur (Pfeiltasten, Enter, Escape)
- Suchverlauf (letzte 10 Suchen) wird in localStorage gespeichert, inkl. Temperatur und Zeitangabe ("vor 5 Min."). Bleibt nach Neuladen erhalten, kann geleert werden
- Letzte Suche wird beim erneuten Öffnen automatisch geladen; Favoriten können gespeichert und wieder abgerufen werden
- Standortabfrage über die Geolocation-API des Browsers ("Mein Standort"). Bei Ablehnung bleibt die manuelle Suche normal nutzbar
- Umschalten zwischen °C/km-h und °F/mph, Auswahl bleibt gespeichert
- "Erneut versuchen"-Button bei Netzwerk-/Serverfehlern (nicht bei Fehlern, wo Wiederholen sowieso nichts bringt, z. B. Stadt nicht gefunden)
- 5-Tage-Vorhersage mit Wochentag, Icon, Min/Max-Temperatur, Regenwahrscheinlichkeit und Temperaturbalken
- Hintergrund passt sich dem Wetter an (Sonne, Wolken, Regen, Gewitter, Schnee, Nebel) und unterscheidet Tag/Nacht
- Responsive für Desktop und Mobile

## Technologien

- HTML5, CSS3
- Vanilla JavaScript (ES6-Klassen, fetch, async/await, localStorage)
- OpenWeatherMap: Current Weather API, 5 Day Forecast API, Geocoding API
- Geolocation API des Browsers

## Projektstruktur

```
├── index.html
├── style.css
├── script.js         # Einstiegspunkt, ruft nur die App auf
├── js/               # einzelne Klassen, siehe unten
├── UML.md            # Klassendiagramm (Mermaid)
├── uml-diagramm.png
├── uml-diagramm.svg
└── README.md
```

## Klassen

Jede Klasse ist in einer eigenen Datei im Ordner `js/` (ca. 70–260 Zeilen pro Datei). Diagramm dazu in `UML.md`.

| Klasse | Aufgabe |
|---|---|
| `WeatherAPI` | Kommunikation mit OpenWeatherMap (aktuelles Wetter, Vorhersage, Städtesuche), Einheiten-Umschaltung, Fehlerbehandlung |
| `LocationService` | Geolocation-API des Browsers, übersetzt Fehlercodes in verständliche Meldungen |
| `StorageManager` | localStorage: letzte Stadt, Favoriten, Suchverlauf, Einheit |
| `ThemeManager` | wetterabhängiger Hintergrund inkl. Tag/Nacht |
| `SmartSearch` | Autovervollständigung mit Debouncing und Tastatursteuerung |
| `WeatherView` | zeigt aktuelles Wetter im DOM an (Karte, Ladezustand, Fehler, Buttons) |
| `ListView` | zeigt Favoriten, Verlauf und 5-Tage-Vorhersage an |
| `UIController` | fasst `WeatherView` und `ListView` zusammen |
| `App` | verbindet alles und steuert den Ablauf |

## Standortabfrage – gut zu wissen

- Browser fragt selbst nach Erlaubnis, das lässt sich nicht umgehen
- funktioniert nur über HTTPS oder localhost – bei `file://` (Doppelklick) evtl. blockiert, über GitHub Pages kein Problem
- wird vom Browser nicht unterstützt → Button wird ausgeblendet

## Einheiten-Umschaltung – gut zu wissen

Beim Wechsel °C/°F wird die Anfrage neu gestellt statt selbst umzurechnen, damit Wind und gefühlte Temperatur stimmen. Suchverlauf wird dabei geleert (sonst falsche Einheit gespeichert).

## Vorhersage – gut zu wissen

OpenWeatherMap liefert 3-Stunden-Werte (40 Stück über 5 Tage), die zu Tageswerten zusammengerechnet werden:
- Min/Max-Temperatur: kleinster/größter Wert des Tages
- Icon/Beschreibung: vom Zeitpunkt nächst der Mittagszeit
- Regenwahrscheinlichkeit: höchster Wert des Tages
- Tagesgrenzen nach Ortszeit der jeweiligen Stadt, nicht die des Nutzers
- heutiger Tag wird übersprungen (steht schon oben)
- schlägt der Abruf fehl, wird nur dieser Bereich ausgeblendet, Rest bleibt sichtbar

## API-Key einrichten

1. Kostenlosen Account auf [openweathermap.org](https://openweathermap.org/api)
2. Unter "API keys" den Key kopieren
3. In `script.js` ganz unten:
```javascript
const API_KEY = "DEIN_API_KEY_HIER";
```
4. Ersetzen durch eigenen Key
5. Neue Keys brauchen manchmal bis zu 2 Stunden, bis sie aktiv sind

Die Smart Search schont das API-Kontingent durch Debouncing (300 ms) und Zwischenspeicherung bereits gesuchter Begriffe.

**Sicherheitshinweis:** API-Key ist im Quellcode sichtbar, da rein clientseitig. Für dieses Projekt in Ordnung, in einer echten Anwendung würde der Key serverseitig verborgen.

## Datenspeicherung

Kein Backend, keine Datenbank – GitHub Pages hostet nur statische Dateien. Favoriten, Verlauf usw. werden daher im `localStorage` des Browsers gespeichert. Reicht für diesen Funktionsumfang völlig aus.

## Team

| Person | Rolle | Aufgaben |
|---|---|---|
| Ahmad | Projektleitung | Setup & Repo, HTML-Struktur, CSS-Grundlayout, Basis-Architektur (`App`, `UIController`, `StorageManager`), localStorage-Features, Smart Search, 5-Tage-Vorhersage, Standortabfrage, Einheiten-Umschaltung, ThemeManager, Deployment |
| Cheyenne | Design | CSS-Styling, Farbkonzept, UI-Feinschliff, Responsive-Anpassungen |
| Dilan | API-Logik | `WeatherAPI`-Klasse: Fetch-Request, JSON-Verarbeitung, Fehlerbehandlung |

## Lokal ausführen

`index.html` im Browser öffnen, am besten über VS Code "Live Server", um CORS-Probleme zu vermeiden.

## Deployment (GitHub Pages)

1. Repo erstellen, alle Dateien ins Root-Verzeichnis pushen
2. Settings → Pages
3. Build and deployment → Source: "Deploy from a branch"
4. Branch `main`, Ordner `/ (root)`, Save
5. nach 1–2 Min live unter `https://<username>.github.io/<repo-name>/`

## Live-Demo

https://ahmadserjawi.github.io/WebTech-2.0-WetterApp-/
