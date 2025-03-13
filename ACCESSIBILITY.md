# Barrierefreiheit - Klartext Extension

## Konformität
Die Klartext Extension strebt Konformität mit WCAG 2.0 Level AA und BITV 2.0 an.

### Implementierte Richtlinien

#### 1. Wahrnehmbar
- Textalternativen für Nicht-Text-Inhalte
- Anpassbare Darstellung
  - Schriftgrößen: normal, groß, sehr groß
  - Kontrastverhältnis mindestens 4.5:1
- Text-zu-Sprache Funktionalität
  - Konfigurierbare Sprachausgabe
  - Anpassbare Geschwindigkeit und Tonhöhe

#### 2. Bedienbar
- Vollständige Tastaturbedienung
- Ausreichende Zeitvorgaben
- Keine blinkenden Inhalte
- Navigationshilfen
  - Strukturierte Übersetzungsansicht
  - Klare Überschriftenhierarchie

#### 3. Verständlich
- Drei Übersetzungsstufen:
  - Einfachere Sprache
  - Einfache Sprache
  - Leichte Sprache (DIN SPEC 33429)
- Konsistente Navigation
- Fehleridentifikation und -korrektur

#### 4. Robust
- Kompatibilität mit Hilfstechnologien
  - ARIA-Attribute
  - Semantische HTML-Struktur
  - Screen Reader Unterstützung

## Bekannte Einschränkungen
1. Einige dynamisch generierte Inhalte könnten nicht vollständig mit ARIA-Labels versehen sein
2. Kontrastwerte bei benutzerdefinierten Themes nicht garantiert
3. Keine vollständige Unterstützung für sehr alte Bildschirmleser

## Nächste Schritte
1. Vollständige WCAG 2.0 Level AA Audit durchführen
2. BITV 2.0 Konformitätsprüfung
3. Automatisierte Accessibility Tests implementieren
4. Dokumentation der Bedienungshilfen vervollständigen

## Feedback
Barrierefreiheitsprobleme bitte melden unter: [https://github.com/bhamm/klartext/issues](https://github.com/bhamm/klartext/issues)
