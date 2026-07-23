# 🌤️ Wetter-App – WebTech 2 Projekt

Eine einfache, clientseitige Wetter-App auf Basis von reinem
HTML5, CSS3 und Vanilla JavaScript (ES6+), die aktuelle
Wetterdaten über die OpenWeatherMap Current Weather Data API abruft.

## Funktionen

- Eingabe eines Stadtnamens
- Anzeige von Temperatur (°C), Beschreibung und passendem Icon
- Anzeige von "gefühlter Temperatur", Luftfeuchtigkeit und Windgeschwindigkeit
- Fehlerbehandlung (z. B. Stadt nicht gefunden, ungültiger API-Key,
  API-Limit erreicht, Netzwerkfehler)
- **Smart Search (Autovervollständigung)**: beim Tippen erscheinen
  Vorschläge – zuerst aus dem eigenen Suchverlauf (ohne API-Anfrage,
  mit 🕘 markiert), dazu echte Städtevorschläge über die
  OpenWeatherMap Geocoding-API (mit 🔍 markiert). Bedienbar per Maus
  oder Tastatur (Pfeiltasten, Enter, Escape).
- **Suchverlauf via `localStorage`**: die letzten 10 Suchen werden
  mit Temperatur, Icon und relativer Zeitangabe ("vor 5 Min.")
  gespeichert und bleiben auch nach dem Neuladen erhalten. Ein Klick
  auf einen Eintrag ruft die Stadt erneut ab; der Verlauf kann
  jederzeit geleert werden.
- **Favoriten & letzte Suche via `localStorage`**: die zuletzt gesuchte
  Stadt wird beim nächsten Öffnen der Seite automatisch geladen; zusätzlich
  können beliebig viele Städte als Favoriten gespeichert und per Klick
  erneut abgerufen werden
- **Standort ermitteln**: ein Klick auf "📍 Mein Standort" lädt das
  Wetter für die aktuelle Position (Geolocation-API des Browsers).
  Der Browser fragt dabei selbst um Erlaubnis; wird sie abgelehnt,
  erscheint ein verständlicher Hinweis und die manuelle Suche
  funktioniert unverändert weiter.
- **Einheiten umschalten**: Wechsel zwischen °C/km-h und °F/mph
  über einen Button. Die Wahl wird gespeichert und bleibt nach
  dem Neuladen erhalten.
- **"Erneut versuchen" bei Fehlern**: bei Netzwerk- oder
  Serverproblemen erscheint ein Button, der die letzte Aktion
  wiederholt. Bei sinnlosen Wiederholungen (z. B. "Stadt nicht
  gefunden" oder abgelehnter Standortzugriff) wird er bewusst
  nicht angezeigt.
- **5-Tage-Vorhersage**: unter dem aktuellen Wetter werden die nächsten
  Tage mit Wochentag, Icon, Tiefst-/Höchsttemperatur und
  Regenwahrscheinlichkeit angezeigt. Ein Temperaturbalken zeigt die
  Tagesspanne im Verhältnis zur ganzen Woche, sodass wärmere und
  kältere Tage auf einen Blick erkennbar sind.
- **Wetterabhängiges Design**: der Hintergrund der Seite passt sich
  automatisch der aktuellen Wetterlage an (Sonne, Wolken, Regen,
  Gewitter, Schnee, Nebel) und unterscheidet zusätzlich Tag und Nacht
- Responsive Design für Desktop und Mobile

## Technologien

- HTML5
- CSS3
- Vanilla JavaScript (ES6-Klassen, `fetch`, `async/await`, `localStorage`)
- OpenWeatherMap Current Weather API, 5 Day Forecast API und
  Geocoding API (für die Städtesuche)
- Geolocation API des Browsers (für die Standortabfrage)

## Projektstruktur

```
├── index.html      # Grundstruktur der Seite
├── style.css       # Layout, Design & Responsive Anpassungen
├── script.js       # JS-Logik (App, UIController, WeatherAPI,
│                   #           StorageManager, SmartSearch, ThemeManager)
└── README.md       # Diese Datei
```

## Klassenübersicht

| Klasse | Aufgabe |
|--------|---------|
| `WeatherAPI` | Kommunikation mit der OpenWeatherMap API (aktuelles Wetter per Stadt oder Koordinaten, 5-Tage-Vorhersage, Städtesuche), Einheiten-Umschaltung, Fehlerbehandlung und Aufbereitung der Vorhersagedaten zu Tageswerten |
| `LocationService` | Kapselt die Geolocation-API des Browsers und übersetzt die Fehlercodes in verständliche Meldungen |
| `StorageManager` | Kapselt `localStorage`: letzte Stadt, Favoriten, Suchverlauf, gewählte Einheit |
| `ThemeManager` | Setzt den wetterabhängigen Hintergrund (inkl. Tag/Nacht) |
| `SmartSearch` | Autovervollständigung mit Debouncing, Zwischenspeicher und Tastatursteuerung |
| `UIController` | Alle DOM-Manipulationen (Anzeige, Fehler, Laden, Listen) |
| `App` | Verbindet alle Klassen und steuert den Ablauf |

## Hinweis zur Standortabfrage

Die Standortfunktion nutzt die **Geolocation-API des Browsers**. Wichtig
zu wissen:

- Der Browser fragt **selbst** um Erlaubnis – die App kann das nicht
  umgehen. Lehnt der Nutzer ab, wird die manuelle Suche weiter angeboten.
- Moderne Browser erlauben Geolocation nur über **HTTPS** oder
  `localhost`. Beim Öffnen der Datei direkt per Doppelklick
  (`file://`) kann die Abfrage daher blockiert werden. Über GitHub
  Pages (HTTPS) funktioniert sie zuverlässig.
- Unterstützt ein Browser die Funktion gar nicht, wird der Button
  automatisch ausgeblendet.

## Hinweis zur Einheiten-Umschaltung

Beim Wechsel zwischen °C und °F wird die Anfrage mit einem anderen
`units`-Parameter erneut gestellt, statt die Werte selbst umzurechnen –
so bleiben auch Windgeschwindigkeit und "gefühlte Temperatur" korrekt.
Der Suchverlauf wird dabei geleert, da die gespeicherten Temperaturen
sonst in der falschen Einheit angezeigt würden.

## Hinweis zur Vorhersage

Die OpenWeatherMap-Vorhersage liefert Werte in **3-Stunden-Schritten**
(40 Einträge über 5 Tage). Diese werden in `WeatherAPI` zu Tageswerten
zusammengefasst:

- **Tiefst-/Höchsttemperatur**: Minimum und Maximum aller Werte des Tages
- **Icon und Beschreibung**: vom Zeitpunkt, der der Mittagszeit am
  nächsten liegt (repräsentativ für den Tag)
- **Regenwahrscheinlichkeit**: der höchste Wert des Tages
- **Zeitzonen**: die Tagesgrenzen werden anhand der lokalen Zeit der
  jeweiligen Stadt gebildet, nicht nach der Zeit des Nutzers
- Der heutige Tag wird übersprungen, da er bereits in der Hauptanzeige steht

Schlägt der Abruf der Vorhersage fehl, wird nur dieser Bereich
ausgeblendet – das aktuelle Wetter bleibt sichtbar.

## API-Key einrichten

1. Kostenlosen Account auf [openweathermap.org](https://openweathermap.org/api) erstellen.
2. Unter "API keys" den eigenen Key kopieren.
3. In `script.js` die Zeile ganz am Ende der Datei anpassen:

```javascript
const API_KEY = "DEIN_API_KEY_HIER";
```

4. `DEIN_API_KEY_HIER` durch den eigenen Key ersetzen.
5. Hinweis: Neue API-Keys benötigen manchmal bis zu 2 Stunden, bis sie aktiv sind.

**Schonender Umgang mit dem API-Kontingent:** Die Smart Search fragt die
API nicht bei jedem Tastendruck, sondern erst nach einer kurzen Tipppause
(300 ms, sogenanntes *Debouncing*). Bereits gesuchte Begriffe werden
zwischengespeichert. Fällt die Städtesuche aus, funktioniert die normale
Wettersuche unverändert weiter.

**Sicherheitshinweis:** Da diese App rein clientseitig läuft, ist der
API-Key im Quellcode sichtbar. Für ein Uni-Projekt ist das üblich; in
einer echten Anwendung würde der Key serverseitig verborgen werden.

## Hinweis zur Datenspeicherung

Diese App verwendet **keine echte Datenbank** und **kein Backend**.
Da GitHub Pages ausschließlich statische Dateien hosten kann (kein
Server-Code, keine Datenbank-Anbindung), wird für das "Merken" von
Städten stattdessen die **`localStorage`-API des Browsers** genutzt.

- Die Daten bleiben nur lokal im Browser des jeweiligen Nutzers gespeichert
- Es entstehen keine Server-Kosten und keine Backend-Komplexität
- Für den Funktionsumfang dieser App (Favoriten, letzte Suche) ist das
  völlig ausreichend

## Team & Aufgabenverteilung

| Person | Rolle | Aufgaben |
|--------|-------|----------|
| **Ahmad** | Hauptverantwortlicher / Projektleitung | Projekt-Setup & GitHub-Repository-Verwaltung, komplette HTML-Struktur, grundlegendes CSS-Layout, Basis-Architektur der JS-Klassen (`App`, `UIController`, `StorageManager`), localStorage-Feature (Favoriten, Suchverlauf & Einheiten), Smart Search (`SmartSearch`), 5-Tage-Vorhersage, Standortabfrage (`LocationService`), Einheiten-Umschaltung, wetterabhängiges Theme (`ThemeManager`), Deployment/Hosting auf GitHub Pages |
| **Cheyenne** | Visuelles Design | CSS-Styling, Farbkonzept, UI-Feinschliff, Responsive-Design-Anpassungen |
| **Dilan** | API-Logik | Implementierung der `WeatherAPI`-Klasse: Fetch-Request an OpenWeatherMap, JSON-Datenverarbeitung und Fehlerbehandlung auf API-Ebene |

## Lokale Ausführung

Da keine Build-Tools benötigt werden, reicht es, `index.html`
im Browser zu öffnen (idealerweise über einen lokalen
Server wie die VS Code "Live Server"-Erweiterung, um
CORS-/Fetch-Probleme zu vermeiden).

## Deployment via GitHub Pages

1. Repository auf GitHub erstellen und alle Dateien (`index.html`,
   `style.css`, `script.js`, `README.md`) in das **Root-Verzeichnis** pushen.
2. Im Repository: **Settings → Pages**
3. Unter "Build and deployment" → Source: **"Deploy from a branch"**
4. Branch: `main`, Ordner: `/ (root)` auswählen, dann **Save**
5. Nach 1–2 Minuten ist die Seite live unter:
   `https://<username>.github.io/<repo-name>/`

## Live-Demo

🔗 [Link zur gehosteten Version hier einfügen, nach Deployment via GitHub Pages]
