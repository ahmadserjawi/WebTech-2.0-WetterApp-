# 🌤️ Wetter-App – WebTech 2 Projekt

Eine einfache, clientseitige Wetter-App auf Basis von reinem
HTML5, CSS3 und Vanilla JavaScript (ES6+), die aktuelle
Wetterdaten über die OpenWeatherMap Current Weather Data API abruft.

## Funktionen

- Eingabe eines Stadtnamens
- Anzeige von Temperatur (°C), Beschreibung und passendem Icon
- Anzeige von "gefühlter Temperatur" und Luftfeuchtigkeit
- Fehlerbehandlung (z. B. Stadt nicht gefunden, ungültiger API-Key, Netzwerkfehler)
- **Favoriten & letzte Suche via `localStorage`**: die zuletzt gesuchte
  Stadt wird beim nächsten Öffnen der Seite automatisch geladen; zusätzlich
  können beliebig viele Städte als Favoriten gespeichert und per Klick
  erneut abgerufen werden
- Responsive Design für Desktop und Mobile

## Technologien

- HTML5
- CSS3
- Vanilla JavaScript (ES6-Klassen, `fetch`, `async/await`, `localStorage`)
- OpenWeatherMap API

## Projektstruktur

```
├── index.html      # Grundstruktur der Seite
├── style.css       # Layout, Design & Responsive Anpassungen
├── script.js       # JS-Logik (App, UIController, WeatherAPI, StorageManager)
└── README.md       # Diese Datei
```

## API-Key einrichten

1. Kostenlosen Account auf [openweathermap.org](https://openweathermap.org/api) erstellen.
2. Unter "API keys" den eigenen Key kopieren.
3. In `script.js` die Zeile ganz am Ende der Datei anpassen:

```javascript
const API_KEY = "DEIN_API_KEY_HIER";
```

4. `DEIN_API_KEY_HIER` durch den eigenen Key ersetzen.
5. Hinweis: Neue API-Keys benötigen manchmal bis zu 2 Stunden, bis sie aktiv sind.

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
| **Ahmad** | Hauptverantwortlicher / Projektleitung | Projekt-Setup & GitHub-Repository-Verwaltung, komplette HTML-Struktur, grundlegendes CSS-Layout, Basis-Architektur der JS-Klassen (`App`, `UIController`, `StorageManager`), localStorage-Feature, Deployment/Hosting auf GitHub Pages |
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
