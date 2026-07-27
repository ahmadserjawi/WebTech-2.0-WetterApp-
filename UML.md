# UML-Klassendiagramm – Wetter-App

Die App besteht aus **9 Klassen** in `script.js`. `App` ist die zentrale
Steuerung und verbindet alle übrigen Klassen; die Fachklassen kennen
einander bewusst nicht (Ausnahme: `SmartSearch` liest den Verlauf und
nutzt die Städtesuche).

## Klassendiagramm

```mermaid
classDiagram
    class App {
        -ui : UIController
        -weatherApi : WeatherAPI
        -storage : StorageManager
        -theme : ThemeManager
        -location : LocationService
        -smartSearch : SmartSearch
        -currentCity : string
        -lastAction : Function
        -_handleSearch(city) void
        -_handleLocationSearch() void
        -_handleUnitToggle() void
        -_applyWeather(data) void
        -_loadForecast(city) void
        -_handleToggleFavorite() void
        -_refreshFavorites() void
        -_refreshHistory() void
    }

    class WeatherAPI {
        -apiKey : string
        -units : string
        -baseUrl : string
        -forecastUrl : string
        -geoUrl : string
        +getWeatherByCity(city) Promise
        +getWeatherByCoords(lat, lon) Promise
        +getForecastByCity(city) Promise
        +searchCities(query) Promise
        +setUnits(units) void
        -_groupForecastByDay(data) Array
        -_mapResponseToWeatherData(data) Object
    }

    class StorageManager {
        -LAST_CITY_KEY : string
        -FAVORITES_KEY : string
        -HISTORY_KEY : string
        -UNIT_KEY : string
        -MAX_HISTORY : number
        +saveLastCity(city) void
        +getLastCity() string
        +addFavorite(city) boolean
        +removeFavorite(city) void
        +isFavorite(city) boolean
        +getFavorites() Array
        +addToHistory(data) void
        +getHistory() Array
        +clearHistory() void
        +searchHistory(query) Array
        +saveUnit(unit) void
        +getUnit() string
        -_readJson(key) Array
    }

    class UIController {
        -weatherView : WeatherView
        -listView : ListView
        -elements : Object
        +showWeather(data) void
        +showLoading(message) void
        +showError(message, canRetry) void
        +renderForecast(days) void
        +renderHistory(entries, onSelect) void
        +renderFavorites(favs, onSelect, onRemove) void
        +setUnit(unit) void
        ... (reicht an die Views weiter)
    }

    class WeatherView {
        -elements : Object
        -unit : string
        +showWeather(data) void
        +showLoading(message) void
        +showError(message, canRetry) void
        +setUnit(unit) / getUnitSymbol() / getWindUnit()
        +getCityInputValue() / setCityInputValue(city)
        +updateFavoriteButton(isFav) void
        +setLocationButtonBusy(busy) void
        +hideLocationButton() void
        -_hideAll() void
    }

    class ListView {
        -elements : Object
        +renderFavorites(favs, onSelect, onRemove) void
        +renderHistory(entries, onSelect) void
        +renderForecast(days) void
        +hideForecast() void
        -_buildForecastRow(day, min, range) Element
        -_formatWeekday(ts) string
        -_formatRelativeTime(ts) string
    }

    class SmartSearch {
        -input : Element
        -dropdown : Element
        -storage : StorageManager
        -api : WeatherAPI
        -suggestions : Array
        -activeIndex : number
        -cache : Map
        -debounceTimer : number
        -DEBOUNCE_MS : number
        +hide() void
        -_fetchOnlineSuggestions(q, local) void
        -_render(items) void
        -_move(direction) void
        -_highlight() void
        -_choose(item) void
    }

    class ThemeManager {
        -themeMap : Object
        -allThemes : Array
        +apply(weatherData) void
        +reset() void
        -_setTheme(theme) void
    }

    class LocationService {
        +isSupported() boolean
        +getCurrentPosition() Promise
        -_translateError(error) string
    }

    App --> WeatherAPI : nutzt
    App --> UIController : nutzt
    App --> StorageManager : nutzt
    App --> ThemeManager : nutzt
    App --> LocationService : nutzt
    App --> SmartSearch : erzeugt
    UIController --> WeatherView : bündelt
    UIController --> ListView : bündelt
    SmartSearch --> StorageManager : liest Verlauf
    SmartSearch ..> WeatherAPI : searchCities()
```

## Externe Schnittstellen

```mermaid
flowchart LR
    subgraph APP["Wetter-App (script.js)"]
        API[WeatherAPI]
        ST[StorageManager]
        TH[ThemeManager]
        LO[LocationService]
        UI[UIController]
    end

    OWM["OpenWeatherMap API<br/>weather · forecast · geo"]
    LS["localStorage<br/>Browser-Speicher"]
    DOM["DOM<br/>index.html + style.css"]
    GEO["Geolocation API<br/>navigator.geolocation"]

    API -->|fetch HTTPS| OWM
    ST -->|liest / schreibt| LS
    TH -->|setzt CSS-Klasse| DOM
    UI -->|verändert| DOM
    LO -->|fragt Position| GEO
```

## Ablauf einer Suche (Sequenzdiagramm)

```mermaid
sequenceDiagram
    actor Nutzer
    participant App
    participant SmartSearch
    participant WeatherAPI
    participant StorageManager
    participant ThemeManager
    participant UIController

    Nutzer->>SmartSearch: tippt "Ber"
    SmartSearch->>StorageManager: searchHistory("Ber")
    StorageManager-->>SmartSearch: Treffer aus Verlauf
    SmartSearch-->>Nutzer: zeigt Vorschläge (sofort)
    Note over SmartSearch: 300 ms Tipppause abwarten
    SmartSearch->>WeatherAPI: searchCities("Ber")
    WeatherAPI-->>SmartSearch: Städteliste
    SmartSearch-->>Nutzer: Vorschläge ergänzt

    Nutzer->>App: wählt "Berlin"
    App->>UIController: showLoading()
    App->>WeatherAPI: getWeatherByCity("Berlin")
    WeatherAPI-->>App: Wetterdaten
    App->>UIController: showWeather(daten)
    App->>ThemeManager: apply(daten)
    App->>StorageManager: addToHistory(daten)
    App->>WeatherAPI: getForecastByCity("Berlin")
    WeatherAPI-->>App: 5 Tageswerte
    App->>UIController: renderForecast(tage)
```

## Aufgabenverteilung im Diagramm

| Farbe | Person | Klassen |
|-------|--------|---------|
| 🔵 Blau | **Ahmad Serjawi** | `App`, `StorageManager`, `SmartSearch`, `ThemeManager`, `LocationService` |
| 🟢 Grün | **Cheyenne** | `WeatherView`, `ListView`, `UIController` (Anzeige & Design), HTML + CSS |
| 🟠 Orange | **Dilan** | `WeatherAPI` (API-Anbindung & Fehlerbehandlung) |
