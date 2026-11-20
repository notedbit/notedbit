# notedbit · Gestaltung und technische Prüfung des zweiten Durchlaufs

Ausgangspunkt war Commit `92173fb` im [Entwurfs-PR #1](https://github.com/notedbit/notedbit/pull/1). Der veröffentlichte Vergleichsstand war `ee2e9b0` auf `main`. Geprüft wurden Übergabe, erster PR, Projektinventar, Quellenaudit und Website-Dateien. Frühere Projektprüfungen werden im jeweiligen Projekt als historische Belege behandelt.

## Warum die Startseite umgebaut wurde

- Der alte Hero kombinierte den Slogan „Building software. Making things work.“ mit Farbverlauf und einer separaten Themenbox. Name, Studiengang und konkrete Stellensuche traten dadurch in den Hintergrund. Jetzt bilden Name und Studium die erste Leseebene. Ein kurzer, eigener Text nennt Tätigkeiten und Bewerbungsziel.
- Die drei früheren Projektkarten wiederholten Bildformat, Farbflächen und Aufklappen. Die wichtigsten Belege waren teils erst nach Interaktion sichtbar. Die Videoproduktion zeigt jetzt die abspielbare Hochkantausgabe, das Spiel einen unverfälschten Ausschnitt der JavaScript-Spielwelt und der Web-Beitrag zwei direkte Wege zur Technik und zum Quellcode.
- Profil-Tabs und mehrere Reihen mit Technologiebegriffen wiederholten Angaben aus dem Hero. Die Linux-Praxis steht sichtbar neben einer kurzen, mit Fallstudien verknüpften Technikliste. Die Kontaktadresse kann direkt kopiert oder geöffnet werden.
- Die Wortmarke hebt nur `db` dezent hervor. Das Favicon zeichnet das `b` durch Spiegelung desselben Pfads wie das `d`. Graphit, warme Schriftfarbe, feine Linien und ein heller Akzent bilden ein gemeinsames System für Startseite, Archiv und Fallstudien. Die Systemschriften kommen ohne zusätzliche Anfragen aus.
- Das Archiv behält Suche, Filter, Liste und Karten. Es zeigt Datum, Titel, Technik und Stand als Zeilen und reserviert größere Medien für geöffnete Einträge. Fallstudien verwenden einen einheitlichen Einstieg und inhaltlich unterschiedliche Belege. Die elf Archiveinträge und bestehenden Projektpfade bleiben die Grundlage für spätere Ergänzungen.

## Betrieb und Auffindbarkeit

| Bereich | Befund |
| --- | --- |
| GitHub Pages | Die authentifizierte Pages-Abfrage meldete `built`, Branch `main` und Verzeichnis `/`. HTTPS ist aktiv und wird erzwungen. Der direkte Aufruf über HTTP wurde auf HTTPS umgeleitet. `CNAME` enthält `notedbit.com`. |
| URLs | Startseite, Archiv, neun Fallstudien und Dungeon Crawler sind im Sitemap-Verzeichnis geführt. Für Spiel und Browserübungen wurden kanonische URLs ergänzt. Der alte Simulationspfad bleibt direkt erreichbar und ist über `noindex` von der Indexierung ausgenommen, sobald die aktualisierte Seite bereitgestellt und neu gecrawlt ist. |
| Sprache und Vorschauen | HTML-Titel, Beschreibung und Open-Graph-Daten haben statische englische Ausgangswerte. Aufgerufene Seiten können die Texte über DE/EN umschalten. Die Sprachwahl wird lokal gespeichert und auch zwischen gleichzeitig geöffneten Seiten desselben Ursprungs synchronisiert. Es existiert je Seite eine kanonische URL und keine separat indexierbare deutsche URL. |
| Architektur und Ressourcen | Das Portfolio läuft mit statischem HTML, CSS und JavaScript. Die Seiten binden keine externen Webfonts, Analytics-Skripte oder Social-Media-Widgets ein. Externe Profile werden erst beim Anklicken geladen. Die Archiv-Einbettung lädt das Spiel vom selben Ursprung auf Anforderung. |
| Medien | Beide Videos sind lokal bereitgestellte H.264/AAC-MP4s. Die Produktdemo umfasst 62,5 Sekunden bei 1080 × 1920 und rund 6,50 MB, der Horrorausschnitt 42 Sekunden bei 540 × 960 und rund 1,52 MB. Die Dateien sind belegte Ausgaben. Ein neuer nativer Renderlauf war nicht Bestandteil dieser Website-Prüfung. |

Die Pages-Konfiguration lässt sich mit `gh api repos/notedbit/notedbit/pages` prüfen, sofern der verwendete GitHub-Zugang die Rechte hat. [Pages-REST-API](https://docs.github.com/en/rest/pages/pages#get-a-apiname-pages-site)

## Behobene Frontend-Befunde

- Die globale Navigation enthält die tatsächlich verwendete Menü-, Fokus- und Scrollzustandslogik. Historische Funktionen für animiert eingeblendete Bereiche, Startseitenkarten und Profil-Tabs wurden nach der Layoutumstellung entfernt.
- Das Wörterbuch in `language.js` verwendet die vorhandenen gemeinsamen Schlüssel aus HTML und dynamischen Meldungen. 178 ungenutzte Einträge aus älteren Seitenfassungen wurden entfernt. Neue projektbezogene Texte verwenden die Übersetzung direkt an der jeweiligen Stelle im HTML.
- Die C++-Browserübungen zeigen auch bei aktivem Deutsch berechnete Ergebnisse. Fehlertexte und bereits ausgegebene Sortierschritte folgen dem Sprachwechsel. Außerhalb des sicheren JavaScript-Ganzzahlbereichs erscheint ein eigener Hinweis.
- Der Dungeon Crawler verarbeitet Pfeiltasten, T und R auf dem fokussierten Spielfeld. Start und Neustart setzen den Fokus an der jeweils passenden Stelle. Die Figurenauswahl hat einen auslesbaren Auswahlzustand. Das Startmenü passt bei 320 px in die Spielfläche und kann bei Bedarf vertikal scrollen. Die zugrunde liegende Spielmechanik blieb erhalten.
- Der alte Simulations-Direktlink liefert die archivierte Darstellung einschließlich Favicon. Bei bevorzugter reduzierter Bewegung startet die Wiedergabe pausiert. Pause hält auch die Canvas-Aktualisierung an. Bekannte Physik- und Kollisionsfehler bleiben dokumentiert, und die Simulation hat keinen Einstieg aus dem Portfolio.

## Nachprüfung der interaktiven Seiten

Lokal über `python3 -m http.server 8000 --bind 127.0.0.1` starten. Die folgenden Abläufe wurden mit Chromium 156 und Playwright geprüft.

| Seite | Ablauf und Ergebnis |
| --- | --- |
| `/demos/cpp-exercises/` | DE wählen und den voreingestellten Ausdruck berechnen. `sieben geteilt-durch zwei = 3` bleibt sichtbar. Bei `eins geteilt-durch null` erscheint der deutsche Fehler, der beim Wechsel zu EN mitwechselt. Per Pfeiltaste den Sortier-Tab auswählen. Die Eingabe `9, 2, 5` ergibt `2, 5, 9`. Bereits angezeigte Schritte wechseln zwischen „Pass“ und „Durchlauf“. `1, 9007199254740995, 2` zeigt den Bereichsfehler. |
| `/games/dungeoncrawler/` | Dieselbe Website in zweitem Tab öffnen. Die dort aktive Sprache folgt einem Wechsel im ersten Tab. Außerhalb des Spielfelds greifen die Pfeiltasten normal. Den Magier mit Enter auswählen und anschließend das Spiel starten. Die Anzeige beginnt mit 20 HP. Das Spielfeld erhält sichtbaren Tastaturfokus. Pfeil nach oben verändert den Canvas-Inhalt. R setzt den Lauf zurück und fokussiert die gewählte Figur. Bei 320, 390 und 768 px blieb der Startknopf in EN und DE vollständig sichtbar und startete per Klick einen Lauf mit 50 HP. |
| `/demos/simulation/` | Die Seite nach gespeicherter DE-Auswahl direkt aufrufen. Archivstatus und `noindex` prüfen. Bei reduzierter Bewegung steht der Status auf „Pausiert“. Nach „Weiter“ reagieren die drei Moduswechsel und der Laufzeitzähler. Nach „Pause“ bleibt der Zähler stehen. Dieser Ablauf prüft Bedienung und Anzeige. Er stellt keinen Physiknachweis dar. |

## Vorher-Nachher-Ansichten

Der Vergleich verwendet die deutsche Ansicht von Commit `92173fb` und des zweiten Durchlaufs. In jedem Bild steht Durchlauf 1 links und Durchlauf 2 rechts.

| Ansicht | Vergleich |
| --- | --- |
| Startseite, 1440 px | [Desktop](portfolio-review/startseite-desktop.webp) |
| Startseite, 390 px | [Mobil](portfolio-review/startseite-mobil.webp) |
| Projektarchiv, 1440 px | [Desktop](portfolio-review/projektarchiv-desktop.webp) |
| Fallstudie Videoproduktion, 390 px | [Mobil](portfolio-review/fallstudie-mobil.webp) |

## Ergebnisse der Gesamtprüfung

| Bereich | Ergebnis |
| --- | --- |
| HTML und Ziele | Nu HTML Checker prüfte 14 HTML-Dokumente ohne Fehler. 229 interne Referenzen sowie Sitemap-Pfade und Medien geprüft. `CNAME` stimmt bytegenau mit `main` überein. |
| Responsive Darstellung | Chromium 156 und WebKit 26.5 bei 320, 375, 390, 768, 1024 und 1440 CSS-Pixeln. Alle 14 Seiten geprüft, in beiden Sprachen, soweit eine Auswahl angeboten wird. Keine horizontalen Seitenüberläufe oder abgeschnittenen Hauptüberschriften in der Prüfung. |
| Browser-Zoom | Chromium mit 1440 px Fensterbreite und 100, 125, 150 und 200 Prozent echtem Browser-Zoom. Effektive Breiten 1440, 1152, 960 und 720 CSS-Pixel, bestätigt über die Skalierungswerte des Browsers. Alle 14 Seiten geprüft. |
| Bedienung | In Chromium geprüft: Sprachwahl mit Navigation und Neuladen, Tastaturfokus, Sprunglink, Menü mit Escape, Suche und Filter, Liste und Karten, Einzel- und Sammelaktionen, Projekt-Direktlinks und bedarfsgeladener Dungeon Crawler. |
| Medien und Demos | Beide MP4s mit geladenen Postern abgespielt. Crawler gestartet und gespielt, auch bei 320 px. C++-Übungen und der alte Simulationspfad geprüft. Die Simulation bleibt archiviert. |
| Automatisierte Barrierefreiheit | axe-core 4.12 meldete auf 14 Seiten bei 390 und 1440 px einschließlich offenem Archiv keine Verstöße gegen die geprüften WCAG-2/2.1-A/AA-Regeln. Die Prüfung ersetzt keine manuelle Prüfung mit Screenreader. |
| Konsole und Netzwerk | Keine Browserfehler, fehlgeschlagenen lokalen HTTP-Anfragen oder Anfragen an externe Dienste beim Seitenaufruf in den geprüften Abläufen. |
| Lokales Ladeverhalten | Fünf frische Aufrufe der Startseite pro Stand. Median der übertragenen Daten ca. 454 kB → 97 kB. CLS blieb 0. LCP variierte bei Wiederholungen. Die Zahlen stammen von einem lokalen HTTP-Server und bilden keinen Produktionsverkehr ab. |

### Testlauf wiederholen

Im Repository-Root ausführen. Die Testabhängigkeiten kommen in ein temporäres Verzeichnis. Die Website selbst bleibt ohne Build-Schritt.

```bash
notedbit_qa_deps=$(mktemp -d)
npm install --prefix "$notedbit_qa_deps" playwright@1.62.1 axe-core@4.12.0
"$notedbit_qa_deps/node_modules/.bin/playwright" install chromium
NODE_PATH="$notedbit_qa_deps/node_modules" node docs/qa-check.cjs .
```

Der Test benötigt Node.js 22 oder neuer und Python 3. Er startet selbst einen lokalen HTTP-Server. Mit `QA_SCREEN_DIR` kann ein Verzeichnis für Screenshots gesetzt werden. `CHROMIUM_PATH` wählt eine Chromium-Installation aus. Für die zweite Rendering-Engine WebKit zusätzlich über Playwright installieren und `QA_WEBKIT=1` setzen. Das Skript prüft dann auch Layout und Konsole in WebKit. Interaktionen und Videowiedergabe wurden in diesem Durchlauf in Chromium geprüft.

### Geänderte Bereiche

| Dateien | Änderung |
| --- | --- |
| `index.html`, `portfolio.css`, `style.css` | Persönlicher Einstieg, unterschiedliche Projektformate, sichtbare Linux-Praxis und Kontakt. Gemeinsame Gestaltung getrennt von der alten Basis. Unbenutzte Regeln älterer Layouts entfernt. |
| `projects/*.html`, `projects/projects.css`, `archive.js` | Elf Einträge in der Listenansicht, optionale Karten, mehrsprachige Suche und präzisere Fallstudien. |
| `language.js`, `script.js` | Schlankere Sprachauswahl, gemeinsamer Menüzustand und Fokussteuerung. |
| `assets/favicon.svg`, `assets/og-preview.*` | Gespiegeltes `db` und neue Vorschaugrafik. |
| `games/dungeoncrawler/`, `demos/` | Gezielte Korrekturen an Startansicht, Tastaturbedienung und Sprachausgabe. |
| `docs/` | Prüfung, Vergleichsansichten, Testskript und Aktualisierung des Quellenaudits. |

## Offen vor einer Freigabe zur Veröffentlichung

- **Impressum und Datenschutz.** Prüfen, welche Angaben für das konkrete öffentliche Bewerbungsportfolio erforderlich sind. Hosting und Zugriffsdaten bei GitHub Pages sowie die lokale Sprachspeicherung gehören in die Prüfung. Es wurden keine neuen persönlichen oder rechtlichen Angaben ergänzt. [Datenschutzerklärung von GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- **Rechte und Attribution.** Weiterverwendung der Produktbilder und Audiobestandteile, Horror-Ausgabe, Medien-Screenshots, Spielgrafiken und Hochschularbeiten klären. Im aktuellen Quellenaudit wurden die Namen zweier Mitstudierender entfernt. Die Gruppenautorenschaft bleibt dokumentiert. Frühere öffentliche Versionen in der Git-Historie wurden dabei nicht umgeschrieben. Pages liefert Dateien aus dem öffentlichen Dokumentationsverzeichnis auch als eigene URLs aus. Die vorhandenen Bilder und Videos wurden auf technische Formate geprüft. Eine vollständige Prüfung sichtbarer personenbezogener Details oder der Medienrechte wurde nicht durchgeführt.
- **Audiovisuelle Zugänglichkeit.** Die MP4s enthalten Ton. Es gibt keine separaten Untertitelspuren oder vollständigen Transkripte im Repository. Sichtbare Texte im Bild belegen keine vollständige Abdeckung der gesprochenen Inhalte und Tonereignisse. Die Canvas-Spielwelt bietet derzeit keine gleichwertige nichtvisuelle Spieloberfläche.
- **Externe Ziele.** GitHub-Repositorium, Spiel-Codepfad und Instagram antworteten bei der Abfrage. LinkedIn blockierte die automatische HTTP-Prüfung mit Status 999. Die Mailadresse im Portfolio lässt sich als `mailto:`-Link öffnen. Die Zustellung wurde nicht getestet.
- **Messung im Betrieb.** Erkenntnisse aus lokalen Browserdaten sind Labormesswerte. Reale Core Web Vitals und Hosting-Latenz des neuen Stands können erst nach einer genehmigten Veröffentlichung mit geeigneten Daten bewertet werden.
