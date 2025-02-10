# Klartext - Leichte Sprache Chrome Extension

Eine Chrome-Erweiterung, die deutsche Texte in "Leichte Sprache" übersetzt, um sie für Menschen mit eingeschränktem Sprachverständnis zugänglicher zu machen.

## Features

- Unterstützung für verschiedene KI-Anbieter:
  - OpenAI GPT-4/3.5
  - Google Gemini
  - Anthropic Claude
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

   ### Meta Llama 2
   - Lokale Installation oder gehosteter Dienst
   - Optional: API-Schlüssel je nach Setup
   - Verfügbare Modelle: llama-2-70b, llama-2-13b, llama-2-7b
   - Standard-Endpoint: http://localhost:8080/completion

3. Optional:
   - Eigenen API-Endpoint konfigurieren
   - Große Schrift aktivieren
   - Modell auswählen

4. Einstellungen speichern

## Verwendung

1. Markieren Sie einen deutschen Text auf einer Webseite
2. Klicken Sie mit der rechten Maustaste auf den markierten Text
3. Wählen Sie "In Leichte Sprache übersetzen"
4. Die Übersetzung erscheint in einem zugänglichen Overlay-Fenster

## Technische Details

Die Erweiterung bietet eine flexible Architektur für verschiedene KI-Provider:

- **Provider-System:** Modulare Integration verschiedener KI-Dienste
- **API-Konfiguration:** Anpassbare Endpoints und Modelle
- **Caching:** Lokaler Cache für häufig übersetzte Texte
- **Fehlerbehandlung:** Robuste Fehlerbehandlung für API-Aufrufe

## Entwicklung

### Projektstruktur

```
klartext/
├── manifest.json           # Extension-Konfiguration
├── _locales/              # Lokalisierungsdateien
│   └── de/
│       └── messages.json
├── src/
│   ├── background/        # Service Worker
│   │   └── background.js
│   ├── content/           # Content Scripts
│   │   ├── content.js
│   │   └── overlay.css
│   └── popup/            # Popup UI
│       ├── popup.html
│       └── popup.js
└── icons/                # Extension-Icons
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

5. Paket für Distribution erstellen:
   ```bash
   npm run package
   ```
   Dies erstellt eine `klartext.zip` Datei, die im Chrome Web Store hochgeladen werden kann.

### Entwicklungshinweise

- **Provider-Integration:**
  - Modulares System für einfache Erweiterung
  - Standardisierte Schnittstelle für neue Provider
  - Konfigurierbare Modelle und Endpoints

- **Sicherheit:**
  - Sichere Speicherung der API-Schlüssel
  - HTTPS-Verschlüsselung für API-Kommunikation
  - Lokale Ausführung für Llama 2 möglich

- **Barrierefreiheit:**
  - ARIA-Attribute für Screenreader
  - Tastatur-Navigation
  - Hoher Kontrast und große Schrift
  - Reduzierte Bewegung unterstützt

## Lizenz

MIT License - Siehe LICENSE-Datei für Details
