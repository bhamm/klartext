# Klartext - Leichte Sprache Chrome Extension

Eine Chrome-Erweiterung, die deutsche Texte in "Leichte Sprache" übersetzt, um sie für Menschen mit eingeschränktem Sprachverständnis zugänglicher zu machen.

## Version 1.5.77

Die aktuelle Version enthält folgende Verbesserungen:
- Unterstützung für externe Text-to-Speech (TTS) Provider:
  - Google TTS Integration mit API-Schlüssel-Konfiguration
  - Verbesserte Sprachqualität für Vorlesefunktion
- Fehlerbehebung: Verbesserte Modellkompatibilität zwischen Providern
  - Automatische Auswahl des korrekten Modells beim Wechsel des Providers
  - Validierung der Modellkompatibilität im Background-Script
  - Behebt Fehler "Model Not Exist" bei Verwendung von DeepSeek
- Hinzufügung von DeepSeek als neuer KI-Anbieter
- Neues Provider-Registry-System für einfache Erweiterung mit neuen KI-Anbietern
- Dynamische Benutzeroberfläche basierend auf verfügbaren Providern
- Verbesserte Textverarbeitung mit optimierter Zeichensetzungsbehandlung
- Neue HTML-Bereinigungsfunktionen für bessere Artikelerkennung
- Optimierte Seitenübersetzung mit intelligenter Textaufteilung
- Verbesserte Typensicherheit und Fehlerbehandlung

## Features

- Text-zu-Sprache Funktion:
  - Vorlesen der Übersetzung mit Wort-Hervorhebung
  - Play/Pause Steuerung
  - Deutsche Sprachausgabe
  - Visuelle Rückmeldung
- Artikel-Modus für ganze Textabschnitte
  - Hover-Hervorhebung von Artikeln
  - Einfache Auswahl durch Klicken
  - Automatische Texterkennung
- Flexible Textgrößen:
  - Normal
  - Groß
  - Sehr groß
- Unterstützung für verschiedene KI-Anbieter:
  - OpenAI GPT-4/3.5
  - Google Gemini
  - Anthropic Claude
  - DeepSeek
  - Meta Llama 2 (lokal oder gehostet)
- Flexibel konfigurierbare API-Endpoints
- Kontextmenü-Integration für einfache Textauswahl
- Zugängliches Overlay-Design mit Unterstützung für:
  - Große Schrift
  - Hoher Kontrast
  - Screenreader-Kompatibilität
  - Tastatursteuerung
- Lokaler Cache für häufig übersetzte Texte
- Vollständig auf Deutsch lokalisiert

## Installation

1. Laden Sie den Code herunter oder klonen Sie das Repository
2. Öffnen Sie Chrome und navigieren Sie zu `chrome://extensions/`
3. Aktivieren Sie den "Entwicklermodus" (oben rechts)
4. Klicken Sie auf "Entpackte Erweiterung laden"
5. Wählen Sie den Ordner mit dem Erweiterungscode aus

## Konfiguration

1. Klicken Sie auf das Klartext-Icon in der Chrome-Toolbar
2. Wählen Sie einen KI-Anbieter:

   ### OpenAI GPT-4/3.5
   - API-Schlüssel von [OpenAI](https://platform.openai.com) benötigt
   - Beginnt mit "sk-"
   - Verfügbare Modelle: gpt-4, gpt-4-turbo, gpt-3.5-turbo

   ### Google Gemini
   - API-Schlüssel von [Google AI Studio](https://makersuite.google.com/app/apikey) benötigt
   - Verfügbare Modelle: gemini-pro, gemini-pro-vision

   ### Anthropic Claude
   - API-Schlüssel von [Anthropic](https://console.anthropic.com/) benötigt
   - Beginnt mit "sk-"
   - Verfügbare Modelle: claude-2, claude-instant

   ### DeepSeek
   - API-Schlüssel von [DeepSeek Platform](https://platform.deepseek.com/api_keys) benötigt
   - Verfügbare Modelle: deepseek-chat, deepseek-reasoner
   - Standard-Endpoint: https://api.deepseek.com/chat/completions

   ### Meta Llama 2
   - Lokale Installation oder gehosteter Dienst
   - Optional: API-Schlüssel je nach Setup
   - Verfügbare Modelle: llama-2-70b, llama-2-13b, llama-2-7b
   - Standard-Endpoint: http://localhost:8080/completion

3. Optional:
   - Eigenen API-Endpoint konfigurieren
   - Große Schrift aktivieren
   - Modell auswählen

4. Text-zu-Sprache (TTS) konfigurieren:
   ### Browser TTS
   - Standardmäßig wird die integrierte Browser-Sprachausgabe verwendet
   - Keine API-Schlüssel erforderlich
   - Begrenzte Sprachqualität und Stimmenauswahl

   ### Google TTS
   - Hochwertige Sprachausgabe mit natürlicheren Stimmen
   - API-Schlüssel von [Google Cloud](https://console.cloud.google.com/) benötigt
   - Aktivieren Sie die "Text-to-Speech API" in Ihrem Google Cloud-Projekt
   - Wählen Sie aus verschiedenen deutschen Stimmen
   - Der API-Schlüssel kann in den Einstellungen überschrieben werden
   - Standard-API-Schlüssel aus api-keys.json wird verwendet, wenn kein benutzerdefinierter Schlüssel angegeben ist

5. Einstellungen speichern

## Verwendung

### Text-Auswahl-Modus
1. Markieren Sie einen deutschen Text auf einer Webseite
2. Klicken Sie mit der rechten Maustaste auf den markierten Text
3. Wählen Sie "Markierten Text in Leichte Sprache übersetzen"
4. Die Übersetzung erscheint in einem zugänglichen Overlay-Fenster

### Artikel-Modus
1. Klicken Sie mit der rechten Maustaste auf eine beliebige Stelle der Webseite
2. Wählen Sie "Artikel in Leichte Sprache übersetzen"
3. Bewegen Sie die Maus über den gewünschten Textbereich
4. Klicken Sie auf den hervorgehobenen Bereich

### Text-zu-Sprache
1. Klicken Sie in der Übersetzung auf den "Vorlesen" Button
2. Der Text wird vorgelesen und das aktuelle Wort hervorgehoben
3. Klicken Sie erneut zum Pausieren/Fortsetzen
4. Die Vorlesefunktion stoppt automatisch am Ende oder beim Schließen

### Textgröße anpassen
1. Öffnen Sie die Erweiterungseinstellungen
2. Wählen Sie unter "Textgröße" eine der Optionen:
   - Normal (18px)
   - Groß (22px)
   - Sehr groß (26px)
3. Speichern Sie die Einstellungen

## Technische Details

Die Erweiterung bietet eine flexible Architektur für verschiedene KI-Provider:

- **Provider-System:** Modulare Integration verschiedener KI-Dienste
- **API-Konfiguration:** Anpassbare Endpoints und Modelle
- **Caching:** Lokaler Cache für häufig übersetzte Texte
- **Fehlerbehandlung:** Robuste Fehlerbehandlung für API-Aufrufe
- **HTML-Bereinigung:** Intelligente Filterung von irrelevanten Elementen
  - Entfernung von Werbung, Navigation, Formularen und versteckten Elementen
  - Kommentarbereinigung für bessere Textqualität
  - Optimierte Artikelerkennung
- **Textverarbeitung:** Verbesserte Verarbeitung von Text für Sprachausgabe
  - Intelligente Zeichensetzungsbehandlung
  - Optimierte Wortaufteilung für Text-zu-Sprache
- **Seitenübersetzung:** Effiziente Verarbeitung großer Textmengen
  - Automatische Aufteilung in übersetzbare Abschnitte
  - Intelligente Größenbegrenzung für optimale API-Nutzung

## Entwicklung

### Projektstruktur

```
klartext/
├── manifest.json           # Extension-Konfiguration
├── _locales/               # Lokalisierungsdateien
│   └── de/
│       └── messages.json
├── src/
│   ├── background/         # Service Worker & Backend
│   │   ├── background.ts
│   │   ├── providers/      # KI-Provider Implementierungen
│   │   │   ├── registry.ts     # Provider-Registry-System
│   │   │   ├── base.ts         # Basis-Provider-Klasse
│   │   │   ├── index.ts        # Provider-Exports
│   │   │   ├── config.ts       # Provider-Konfiguration
│   │   │   ├── openai.ts       # OpenAI-Provider
│   │   │   ├── google.ts       # Google-Provider
│   │   │   ├── anthropic.ts    # Anthropic-Provider
│   │   │   ├── deepseek.ts     # DeepSeek-Provider
│   │   │   ├── local.ts        # Lokaler Provider
│   │   │   └── example-provider-template.ts # Template für neue Provider
│   │   └── tts-providers/  # Text-to-Speech Provider
│   │       ├── registry.ts     # TTS-Provider-Registry
│   │       ├── base.ts         # Basis-TTS-Provider-Klasse
│   │       ├── index.ts        # TTS-Provider-Exports
│   │       ├── browser.ts      # Browser-TTS-Provider
│   │       ├── google.ts       # Google-TTS-Provider
│   │       └── __tests__/      # Tests für TTS-Provider
│   ├── config/             # Konfigurationsdateien
│   │   └── api-keys.json   # API-Schlüssel (nicht im Git)
│   ├── content/            # Content Scripts
│   │   ├── index.ts        # Haupteinstiegspunkt
│   │   ├── overlay.css     # Styling für Overlay
│   │   ├── controllers/    # Controller-Komponenten
│   │   │   ├── page-controller.ts    # Seitensteuerung
│   │   │   └── speech-controller.ts  # Sprachausgabesteuerung
│   │   ├── services/       # Service-Komponenten
│   │   ├── ui/             # UI-Komponenten
│   │   ├── utils/          # Hilfsfunktionen
│   │   │   ├── dom-utils.ts    # DOM-Manipulationsfunktionen
│   │   │   └── html-cleaner.ts # HTML-Bereinigungsfunktionen
│   │   └── types/          # TypeScript-Typdefinitionen
│   ├── settings/           # Einstellungs-UI
│   │   ├── settings.html
│   │   ├── components/     # UI-Komponenten
│   │   │   ├── provider-selector.ts  # KI-Provider-Auswahl
│   │   │   ├── settings-panel.ts     # Einstellungspanel
│   │   │   └── speech-settings.ts    # TTS-Einstellungen
│   │   └── services/       # Einstellungsdienste
│   └── shared/             # Gemeinsam genutzte Module
│       └── types/          # Gemeinsame Typdefinitionen
│           ├── settings.ts     # Einstellungstypen
│           ├── api.ts          # API-Typen
│           └── tts/            # TTS-spezifische Typen
│               └── provider.ts # TTS-Provider-Typen
├── test/                   # Testdateien
│   ├── content/            # Tests für Content Scripts
│   └── extension/          # Integrationstests
└── icons/                  # Extension-Icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Lokale Entwicklung

1. Repository klonen und Abhängigkeiten installieren:
   ```bash
   git clone [repository-url]
   cd klartext
   npm install
   ```

2. API-Schlüssel konfigurieren:
   - Erstellen Sie die Datei `src/config/api-keys.json`
   - Fügen Sie die API-Konfiguration hinzu:
     ```json
     {
       "canny": {
         "apiKey": "Ihr-Canny-API-Schlüssel",
         "boardID": "Ihr-Board-ID",
         "categoryID": "Ihre-Kategorie-ID",
         "userID": "Ihre-User-ID"
       },
       "providers": {
         "openAI": {
           "apiKey": "Ihr-OpenAI-API-Schlüssel"
         },
         "anthropic": {
           "apiKey": "Ihr-Anthropic-API-Schlüssel"
         },
         "google": {
           "apiKey": "Ihr-Google-API-Schlüssel"
         },
         "deepseek": {
           "apiKey": "Ihr-DeepSeek-API-Schlüssel"
         },
         "googleTTS": {
           "apiKey": "Ihr-Google-TTS-API-Schlüssel",
           "apiEndpoint": "https://texttospeech.googleapis.com/v1"
         }
       }
     }
     ```
   - Diese Datei wird nicht in Git versioniert
   - Die API-Schlüssel werden als Standard-Schlüssel verwendet, können aber in den Einstellungen überschrieben werden

2. Icons generieren:
   ```bash
   npm run build
   ```

3. Erweiterung in Chrome laden:
   - Chrome öffnen und zu `chrome://extensions` navigieren
   - "Entwicklermodus" aktivieren
   - "Entpackte Erweiterung laden" klicken
   - Das Projektverzeichnis auswählen

4. Entwickeln:
   - Änderungen am Code vornehmen
   - In Chrome die Erweiterung neu laden, um Änderungen zu sehen
   - Die Konsole im DevTools für Debug-Ausgaben prüfen

5. Tests ausführen:
   ```bash
   # Unit-Tests mit Jest ausführen
   npm test
   
   # Selenium-Tests für die Benutzeroberfläche ausführen
   npm run test:selenium
   
   # Einen einzelnen Selenium-Test ausführen
   npm run test:selenium:single test/selenium/specs/translate-selection.test.js
   ```

6. Neuen KI-Provider hinzufügen:
   - Erstellen Sie eine neue Datei in `src/background/providers/` (z.B. `my-provider.ts`)
   - Verwenden Sie das Template aus `example-provider-template.ts` als Grundlage
   - Implementieren Sie die `translate`-Methode für Ihren Provider
   - Definieren Sie die Provider-Metadaten (ID, Name, Modelle, Endpoint, etc.)
   - Fügen Sie den API-Endpoint zu `host_permissions` in `manifest.json` hinzu
   - Der Provider wird automatisch registriert und in den Einstellungen verfügbar sein

7. Neuen TTS-Provider hinzufügen:
   - Erstellen Sie eine neue Datei in `src/background/tts-providers/` (z.B. `my-tts-provider.ts`)
   - Erweitern Sie die `BaseTTSProvider`-Klasse
   - Implementieren Sie die `synthesize`-Methode für Ihren TTS-Provider
   - Implementieren Sie die `getVoices`-Methode, um verfügbare Stimmen zurückzugeben
   - Definieren Sie die Provider-Metadaten (ID, Name, Beschreibung, etc.)
   - Registrieren Sie den Provider in der `registry.ts`
   - Fügen Sie den API-Endpoint zu `host_permissions` in `manifest.json` hinzu
   - Aktualisieren Sie `api-keys.json`, um einen Standard-API-Schlüssel für Ihren Provider hinzuzufügen

7. Paket für Distribution erstellen:
   ```bash
   npm run package
   ```
   Dies erstellt eine `klartext.zip` Datei.

### Selenium-Tests

Die Erweiterung enthält End-to-End-Tests mit Selenium, die die Hauptfunktionen der Benutzeroberfläche testen:

- **Teststruktur:**
  ```
  test/selenium/
  ├── config/           # Testkonfiguration
  ├── helpers/          # Hilfsfunktionen für Tests
  ├── fixtures/         # Testdaten und -seiten
  ├── specs/            # Testspezifikationen
  │   ├── translate-selection.test.js  # Test für Textauswahl-Übersetzung
  │   ├── article-mode.test.js         # Test für Artikel-Modus
  │   ├── text-to-speech.test.js       # Test für Vorlesefunktion
  │   ├── text-size.test.js            # Test für Textgrößenänderung
  │   ├── feedback.test.js             # Test für Feedback-Funktion
  │   └── print.test.js                # Test für Druckfunktion
  └── runner.js         # Testrunner-Skript
  ```

- **Testausführung:**
  - Die Tests verwenden Selenium WebDriver mit Chrome
  - Jeder Test startet eine eigene Browser-Instanz mit der Erweiterung
  - Die Tests simulieren Benutzerinteraktionen wie Textauswahl, Klicks und Eingaben
  - Mocks werden für externe APIs wie SpeechSynthesis verwendet

- **Anpassung der Tests:**
  - CSS-Selektoren können in `helpers/selectors.js` angepasst werden
  - Timeouts und andere Konfigurationen in `config/setup.js`
  - Testdaten in `fixtures/test-page.html`

### Entwicklungshinweise

- **KI-Provider-Integration:**
  - Provider-Registry-System für einfache Erweiterung mit neuen KI-Anbietern
  - Selbstregistrierung von Providern mit Metadaten
  - Dynamische Benutzeroberfläche basierend auf verfügbaren Providern
  - Standardisierte Schnittstelle für neue Provider
  - Konfigurierbare Modelle und Endpoints
  - Beispiel-Template für neue Provider-Implementierungen

- **TTS-Provider-System:**
  - Modulare Architektur für verschiedene Text-to-Speech-Anbieter
  - Basis-Klasse mit standardisierter Schnittstelle
  - Unterstützung für Browser-TTS und externe Dienste wie Google TTS
  - Konfigurierbare API-Schlüssel mit Überschreibungsmöglichkeit
  - Stimmenauswahl für verschiedene Sprachen und Dialekte
  - Einheitliche Fehlerbehandlung und Logging
  - Einfache Erweiterbarkeit für neue TTS-Provider

- **Sicherheit:**
  - Sichere Speicherung der API-Schlüssel
  - HTTPS-Verschlüsselung für API-Kommunikation
  - Lokale Ausführung für Llama 2 möglich
  - Möglichkeit, API-Schlüssel in den Einstellungen zu überschreiben

- **Barrierefreiheit:**
  - ARIA-Attribute für Screenreader
  - Tastatur-Navigation
  - Hoher Kontrast und flexible Textgrößen
  - Reduzierte Bewegung unterstützt
  - Text-zu-Sprache Integration mit hochwertigen Stimmen
  - Wort-für-Wort Hervorhebung

## Lizenz

MIT License - Siehe LICENSE-Datei für Details
