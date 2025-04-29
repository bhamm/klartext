# Changelog

All notable changes to the Klartext Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.96] - 2025-04-29

### Removed
- Vollständige Entfernung aller experimentellen Einstellungen:
  - Entfernung des "Experimentelle Funktionen" Bereichs aus der Benutzeroberfläche
  - Entfernung der `ExperimentalFeatures` Schnittstelle aus dem Code
  - Umwandlung der verbleibenden Einstellungen (Vergleichsansicht, Kommentare ausschließen) in reguläre Einstellungen
  - Bereinigung aller Referenzen zu experimentellen Funktionen in Tests und Typdefinitionen

## [1.5.95] - 2025-04-28

### Removed
- Experimentelle Vollseiten-Übersetzungsfunktion:
  - Entfernung der experimentellen Vollseiten-Übersetzung aus der Benutzeroberfläche
  - Entfernung des Kontextmenüeintrags für die Vollseiten-Übersetzung
  - Bereinigung des Codes und der Einstellungen im Zusammenhang mit der Vollseiten-Übersetzung
  - Entfernung der zugehörigen Tests

## [1.5.94] - 2025-03-12

### Added
- Integrierte Open Sans Schriftart für konsistente Typografie:
  - Lokale Einbindung der Schriftarten (Regular, Medium, SemiBold)
  - Verbesserte Lesbarkeit durch optimierte Schriftdarstellung
  - Unabhängigkeit von externen Schriftquellen
- Neue Dokumentation zur Barrierefreiheit:
  - Detaillierte WCAG 2.0 und BITV 2.0 Konformitätsübersicht
  - Dokumentation implementierter Accessibility-Features
  - Roadmap für vollständige Konformität

### Improved
- Überarbeitetes CSS für einheitliche Schriftdarstellung:
  - Konsistente Schriftfamilien-Definitionen
  - Optimierte Fallback-Schriften
  - Verbesserte Typografie-Hierarchie
- Optimierter Font-Download-Prozess:
  - Schriften werden nur bei Bedarf heruntergeladen
  - Verbesserte Fehlerbehandlung beim Download
  - Parallele Downloads für schnellere Build-Zeit

## [1.5.93] - 2025-03-12

### Improved
- Verbesserte HTML-Bereinigung für Übersetzungen:
  - Entfernung von Bildern und Tracking-Pixeln aus dem Übersetzungs-Payload
  - Entfernung von Autor-Informationen und Bildunterschriften
  - Entfernung von Metadaten-Elementen wie Artikel-IDs und Zeitstempeln
  - Entfernung von Spenden- und Abonnement-Aufforderungen
  - Bessere Fokussierung auf den eigentlichen Textinhalt für die Übersetzung

### Fixed
- Behebt Problem, bei dem Bilder und andere nicht relevante Elemente in den Übersetzungs-Payload aufgenommen wurden
- Reduziert die Tokenzahl bei Übersetzungen durch effizientere Bereinigung des HTML-Inhalts

## [1.5.92] - 2025-03-12

### Fixed
- Fehler behoben, bei dem der Originaltext im Canny-Feedback fehlte
- Verbesserte Speicherung des Originaltexts für Feedback in allen Übersetzungsmodi:
  - Textauswahl-Modus: Speichert den ausgewählten Text beim Start der Übersetzung
  - Artikel-Modus: Speichert den Inhalt des ausgewählten Artikels
  - Vollseiten-Modus: Speichert den Text aller erkannten Inhaltsabschnitte

### Improved
- Zuverlässigere Feedback-Funktion durch konsistente Erfassung des Originaltexts
- Bessere Diagnose von Übersetzungsproblemen durch vollständige Kontextinformationen

## [1.5.91] - 2025-03-12

### Added
- Anzeige der aktuellen Übersetzungsstufe im Feedback-Formular für bessere Benutzerinformation
- Verwendung der Standard-Übersetzungsstufe (Leichte Sprache), wenn keine explizit gespeichert wurde

### Improved
- Verbesserte Fehlerbehandlung bei fehlender Übersetzungsstufe
- Benutzerfreundlichere Darstellung der Übersetzungsstufe im Feedback-Formular

## [1.5.90] - 2025-03-12

### Added
- Hinzufügung einer CHANGELOG.md Datei zur besseren Nachverfolgung von Änderungen
- Anzeige der Versionsnummer am unteren Rand der Einstellungsseite
- Einbeziehung der Übersetzungsstufe in Feedback und Fehlerberichte für bessere Diagnose

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
