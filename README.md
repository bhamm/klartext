# Klartext - Leichte Sprache Chrome Extension

Eine Chrome-Erweiterung, die deutsche Texte in "Leichte Sprache" übersetzt, um sie für Menschen mit eingeschränktem Sprachverständnis zugänglicher zu machen.

## Features

- Kontextmenü-Integration für einfache Textauswahl
- Intelligente Auswahl zwischen GPT-4 und Gemini für optimale Übersetzungen
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
2. Geben Sie Ihre API-Schlüssel ein:
   - GPT-4 API-Schlüssel (für komplexe Texte)
   - Gemini API-Schlüssel (für einfache Texte)
3. Optional: Aktivieren Sie "Große Schrift" für bessere Lesbarkeit
4. Klicken Sie auf "Einstellungen speichern"

## Verwendung

1. Markieren Sie einen deutschen Text auf einer Webseite
2. Klicken Sie mit der rechten Maustaste auf den markierten Text
3. Wählen Sie "In Leichte Sprache übersetzen"
4. Die Übersetzung erscheint in einem zugänglichen Overlay-Fenster

## Technische Details

Die Erweiterung verwendet einen hybriden Ansatz für Übersetzungen:

- **Komplexe Texte:** Werden an GPT-4 gesendet für präzise Übersetzungen
- **Einfache Texte:** Werden von Gemini übersetzt für schnellere Verarbeitung
- **Häufige Texte:** Werden aus dem lokalen Cache abgerufen

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

- Die Erweiterung verwendet einen hybriden Ansatz für Übersetzungen:
  - GPT-4 für komplexe Texte
  - Gemini für einfache Texte
  - Lokaler Cache für häufig übersetzte Texte
- Content Scripts werden bei Bedarf dynamisch injiziert
- Alle API-Schlüssel werden sicher im Chrome Storage gespeichert
- Die Overlay-UI ist vollständig barrierefrei mit Tastatur-Navigation und Screenreader-Unterstützung

## Lizenz

MIT License - Siehe LICENSE-Datei für Details
