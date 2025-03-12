# Changelog

All notable changes to the Klartext Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.90] - 2025-03-12

### Added
- Hinzufügung einer CHANGELOG.md Datei zur besseren Nachverfolgung von Änderungen

## [1.5.89] - 2025-03-12

### Added
- DeepSeek als neuer KI-Anbieter
- Neues Provider-Registry-System für einfache Erweiterung mit neuen KI-Anbietern
- Dynamische Benutzeroberfläche basierend auf verfügbaren Providern
- Neue HTML-Bereinigungsfunktionen für bessere Artikelerkennung
- Unterstützung für externe Text-to-Speech (TTS) Provider:
  - Google TTS Integration mit API-Schlüssel-Konfiguration
  - Verbesserte Sprachqualität für Vorlesefunktion

### Fixed
- Verbesserte Prompt-Verarbeitung:
  - Zuverlässiges Laden und Caching von Prompts für alle Provider
  - Frühe Initialisierung von Prompts im Extension-Lebenszyklus
  - Behebt Fehler, bei dem immer der Standard-Prompt verwendet wurde
- Korrekte Speicherung der Übersetzungsstufe:
  - Übersetzungsstufe (einfachere/einfache/leichte Sprache) wird nun korrekt gespeichert
  - Einstellungen werden zuverlässig zwischen Sitzungen beibehalten
- Verbesserte Modellkompatibilität zwischen Providern:
  - Automatische Auswahl des korrekten Modells beim Wechsel des Providers
  - Validierung der Modellkompatibilität im Background-Script
  - Behebt Fehler "Model Not Exist" bei Verwendung von DeepSeek

### Improved
- Verbesserte Textverarbeitung mit optimierter Zeichensetzungsbehandlung
- Optimierte Seitenübersetzung mit intelligenter Textaufteilung
- Verbesserte Typensicherheit und Fehlerbehandlung
