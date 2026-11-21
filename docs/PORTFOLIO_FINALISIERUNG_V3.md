# notedbit · Abschlussprüfung V3

Geprüft am 21. November 2026. V3 begann nach dem zweiten Design-Durchlauf bei `63a3693`. Während der Prüfung wurde [PR #3](https://github.com/notedbit/notedbit/pull/3) gemergt. Der V3-Branch wurde auf den aktualisierten Stand `87771e53` rebasiert. Der Kompatibilitätsfix für ältere MediaQueryList-Listener ist enthalten und separat getestet. Die offenen Freigabepunkte stehen in [Issue #2](https://github.com/notedbit/notedbit/issues/2).

## Ausgangslage und gezielte Korrekturen

Die Startseite nannte bereits Person, Studium, Bewerbungsziel und Kontakt. Arbeitsproben, eigenständige Beiträge und Quellcode waren direkt erreichbar. Die zweisprachige Navigation, Archivsuche, Filter, Medienwiedergabe und interaktiven Demos bestanden den regulären Ausgangstest. Keines der Probleme erforderte ein neues Layout.

| Reproduzierbarer Befund | Änderung |
| --- | --- |
| Bei einem 640 × 205 px großen Querformatfenster endete das offene Mobilmenü bei y = 256 px. Die letzten Einträge gerieten aus dem sichtbaren Bereich. Der Fokus sprang bei einem aktivierten Startseitenlink auf den Dokumentkörper. | Das Menü bleibt im sichtbaren Bereich und scrollt intern. Die drei Startseiten-Sprungziele nehmen Fokus an. Der Sprunglink erscheint beim ersten Tastendruck ohne verzögerten Übergang. |
| Ein Klick auf „Spiel starten“ während des Ladens der Sprites ließ den Dungeon Crawler nach erfolgreichem Laden im Startmenü stehen. Bei Grafikausfall fehlte am Startknopf ein sichtbarer Hinweis zum erneuten Versuch. | Ein früher Start wird vorgemerkt. Nach dem Laden beginnt das Spiel mit der gewählten Figur. Bei einem Ladefehler erklärt eine zweisprachige Statusmeldung am Startknopf den erneuten Versuch. |
| Mehrere Projekttexte waren präziser formuliert als durch die zugänglichen Belege gedeckt. Die beiden Videofallstudien hatten keine textliche Bildbeschreibung. | Eigenleistungen und Grenzen geschärft. Zwei zweisprachige Bildbeschreibungen sind mit den Playern verknüpft. Seitentitel, Beschreibungen und Open Graph auf den Projektseiten abgeglichen. |

## Fachlicher Abgleich der elf Archiveinträge

| Eintrag | Beleg und Einordnung |
| --- | --- |
| Automatisierte Videoproduktion | Veröffentlichtes Prototypvideo mit 62,5 Sekunden. Der frühere Linux-Test erzeugte eine andere Ausgabe. Qwen, Kokoro und FFmpeg sind im früheren Quellenbefund beschrieben. Die PySide6-Oberfläche ist dokumentiert, ihre Laufzeit wurde in V3 nicht geprüft. |
| Python-Simulation | Unvollständiger Prototyp mit Fehlern in Physik und Kollisionen. Der separate archivierte Browserprototyp bleibt über seinen Direktpfad erreichbar. Videoexport und Korrektheit der nativen Anwendung sind unbelegt. |
| Horrorvideo | Das 42-Sekunden-Beispiel belegt eine generierte Ausgabe. Die Fallstudie nennt Python und FFmpeg, schildert die Pipeline und ordnet frühere Tests samt Batch-Limitierung ein. Angaben zu einzelnen Modellen und Bibliotheken mit unzureichendem Beleg wurden entfernt. |
| Bibliotheksverwaltung | Die historische C++-Arbeit war laut Audit kompilierbar. Ihr Befehlsdispatcher war unvollständig, einzelne Quellbeiträge sind ungeklärt. |
| Dungeon Crawler | Dokumentierte selbstständige C++-Studienarbeit und separate JavaScript-Adaption. Die Browserfassung belegt rundenbasierte Kämpfe, zufällige Level und Truhen. Eine Inventarmechanik war in der Adaption nicht belegt. |
| Webentwicklung | Öffentlicher HTML-, CSS- und JavaScript-Quellcode, Elf-Einträge-Archiv und überprüfbare Pages-Bereitstellung. Der Screenshot zeigt einen historischen Stand. |
| Linux und Automatisierung | Dokumentierte NVMe-Migration, Diagnose sowie Wartung per Shell und systemd. V3 prüfte die Website-Darstellung und Fallstudie. |
| Gameserverbetrieb | Einrichtung und Betrieb eines privaten Servers mit Wartung und Backups. Die Eigenleistung betrifft die Administration. |
| MemeSmoke | Historische Meilensteine werden durch die eingebundenen Screenshots belegt. Aktuelle Reichweite ist offen. |
| C++-Grundlagen | Archivierte kleine Übungen. Die direkt erreichbaren Browser-Adaptionen der Gruppenaufgaben sind als spätere JavaScript-Versionen gekennzeichnet. |
| Rechnerarchitektur und Digitaltechnik | Eigene datierte Übungen und abgebildeter RISC-V-Ausschnitt aus der historischen Dokumentation. Ursprung und Einordnung als Studienarbeit sind ausgewiesen. |

Die öffentlich sichtbare Kontaktadresse sowie GitHub, Instagram und LinkedIn sind wie bisher verlinkt. GitHub und Instagram lieferten bei der Prüfung HTTP 200. LinkedIn blockierte den automatisierten Aufruf mit HTTP 999. Der `mailto:`-Link ist syntaktisch korrekt. E-Mail-Zustellung und LinkedIn-Profilinhalt wurden nicht geprüft. Im Portfolio ist kein öffentlich freigegebener Lebenslauf hinterlegt.

## Vorher–Nachher

Die Vergleiche zeigen `87771e53` links und V3 rechts. Der Mobilvergleich zeigt den Scrollversuch im Menü. Der Desktopvergleich zeigt die sichtbare Rückmeldung direkt am Spielstart, während eine Grafikdatei kontrolliert verzögert wird. Die Figurenbilder sind in dieser Aufnahme ausgeblendet.

- [Desktop · verzögerte Spielgrafik](portfolio-v3/desktop-spiel-laden.webp)
- [Mobil · Menü im Querformat](portfolio-v3/mobil-navigation-querformat.webp)

## Regressionstest und Live-Stand

| Bereich | Ergebnis |
| --- | --- |
| Statische Prüfungen | 14 HTML-Dokumente ohne Fehler im Nu HTML Checker. JavaScript-Syntax, Parsing der sechs CSS-Dateien und `git diff --check` bestanden. `CNAME` und `assets/` bytegleich mit `main`. |
| Links und Auffindbarkeit | 229 interne Referenzen, Sitemap, Robots, Canonicals sowie Medienpfade geprüft. Titel, Meta-Descriptions und Open Graph der Projektseiten stimmen zusammen. Die archivierte Simulation bleibt per Direktlink erreichbar und mit `noindex` gekennzeichnet. |
| Layout und Zoom | Matrix bei 320, 375, 390, 768, 1024 und 1440 CSS-Pixeln. Chromium mit echtem 100, 125, 150 und 200 Prozent Browser-Zoom. Keine Überläufe im geprüften Bereich. |
| Bedienung | Sprachwechsel und Persistenz, Archivsuche und Filter, Direktlinks, Karten und Liste, Tastatur und Fokus, Game-Start inklusive verspäteter und fehlgeschlagener Sprite-Anfrage, Einbettung, C++-Übungen, archivierte Simulation und beide MP4s. PR #3 mit simulierter alter MediaQueryList-Schnittstelle geprüft. |
| Zugänglichkeit | axe-core ohne Befunde in den geprüften WCAG-Regeln. Chromium-Baum zeigt Navigation, Hauptinhalt, Archivsuche, Spielsteuerung und Übungs-Tabs. Ein End-to-End-Test mit echtem Screenreader und gleichwertiger nichtvisueller Spielzugang bleiben offen. |
| Laden | Fünf lokale Startseitenaufrufe lagen im Median bei rund 98 kB übertragenen Daten, zuvor rund 97 kB. CLS blieb 0. Keine Seitenfehler oder fehlgeschlagenen lokalen HTTP-Anfragen in den normalen Testabläufen. Feldmesswerte stehen aus. |

Tests mit `docs/qa-check.cjs` wiederholbar. Einrichtung und optionale Browser stehen im [Prüfbericht des zweiten Durchlaufs](PORTFOLIO_REVIEW_2026-11-20.md#testlauf-wiederholen). Die absichtlich blockierte Sprite-Anfrage im Fehlerfalltest wird getrennt vom normalen Netzwerkprotokoll getestet.

**Live-Stand:** Das letzte Pages-Deployment für `87771e53` war erfolgreich. 23 ausgelieferte Dateien, darunter alle 14 HTML-Seiten, zentrale Skripte, CSS, Sitemap und Favicon, lieferten HTTP 200 und stimmten bytegleich mit `main` überein. In Chrome auf der Live-Domain habe ich Sprachumschaltung und Persistenz, Archivsuche, eingebetteten Dungeon Crawler (50 HP nach Start) und die C++-Rechenübung (Ergebnis 3) geprüft. Die vollständige Geräte- und Medienregression lief lokal auf dem V3-Branch. Für V3 wurde wegen der Freigabepunkte kein Deployment ausgelöst. [Pages-Deployment von PR #3](https://github.com/notedbit/notedbit/actions/runs/44853872108)

## Rechte und Betreiberentscheidungen

Die Seite bindet keine externen Schriften, Analyse-Skripte oder Social-Widgets ein. Die Spracheinstellung liegt im lokalen Browserspeicher. Spiel und MP4s werden vom selben Ursprung geladen. Externe Profile werden erst per Link aufgerufen. Für einen Datenschutzhinweis sind der bestätigte Verantwortliche mit Kontakt, die Verarbeitung durch GitHub Pages und Kontakt per E-Mail, die jeweilige Grundlage, Empfänger, gegebenenfalls Drittlandübermittlung und Speicherdauer zu klären. Dazu kommen die für den konkreten Betreiber anwendbaren Betroffenenrechte und Beschwerdeinformationen. [DSGVO, insbesondere Art. 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj) · [GitHubs Datenschutzerklärung](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)

Für das Impressum muss der Betreiber Sitzland und Anwendungsbereich bestätigen. Bei Anwendbarkeit von § 18 Abs. 1 MStV ist für ein öffentliches Angebot außerhalb rein persönlicher oder familiärer Zwecke neben dem Namen die für die Veröffentlichung freigegebene Anschrift erforderlich. Weitere Angaben hängen vom tatsächlichen Anbieter und der rechtlichen Einordnung ab. Das Repository enthält den veröffentlichten Namen und die Kontakt-E-Mail, aber keine bestätigte Anbieteranschrift oder Betreibertexte. [§ 18 MStV](https://www.gesetze-bayern.de/Content/Document/MStV-18) · [Die Medienanstalten](https://www.die-medienanstalten.de/aufgaben/aufsicht/impressumspflicht/)

Im bereits veröffentlichten Produktvideo stimmen drei Bildmotive bei 00:22, 00:26 und 00:30 mit Motiven der Hersteller-Galerie überein. Für Bilder, Footage und Ton ist im Repository keine Freigabe für Portfolio, Videodatei und öffentliches GitHub-Repository dokumentiert. Benötigt werden Quellen und belastbare Nutzungsfreigaben für diese Bestandteile sowie der Rechteabgleich für Spielgrafiken, Hochschulmaterialien, weitere Screenshots und generierte Medien. Alternativ kann der Betreiber eigene oder passend lizenzierte Ersatzmedien freigeben. Eine Übereinstimmung mit der Galerie belegt die Herkunft der Motive, aber keine Aussage über privat erteilte Nutzungsrechte. [Hersteller-Galerie des POP Phone](https://www.nativeunion.com/products/pop-phone)

Beide MP4s enthalten gesprochenen Ton und eingeblendeten englischen Text. Separate Untertitelspuren und geprüfte vollständige Transkripte fehlen. Die V3-Bildbeschreibungen erfassen sichtbare Szenen. Zur Freigabe von Untertiteln müssen Wortlaut, Zeitmarken und relevante Tonereignisse gegen die Originaldateien geprüft und die Erlaubnis zur Weitergabe bestätigt werden.

**Einschätzung:** Inhalt und Bedienung sind für die technische Vorauswahl bei Werkstudentenstellen und Praktika geeignet. Die offenen Betreiber- und Medienrechte verhindern eine vollständige Veröffentlichungsfreigabe. Der V3-PR bleibt bis zur Klärung offen. Der verifizierte `main`-Stand mit PR #3 bleibt live.

## Nachtrag nach dem Merge von PR #4

Ausgangspunkt des Nachtrags ist `44cb032` auf `main`. Das [Pages-Deployment dieses Stands](https://github.com/notedbit/notedbit/actions/runs/44910472494) war erfolgreich.

- Im Vollbild blendete die alte CSS-Regel die Touch-Steuerung aus. Sie belegt jetzt eine eigene Zeile mit mindestens 44 px hohen Tasten. Das Spielfeld behält seine Proportionen im verfügbaren Raum. Bei geringer Höhe lässt sich der Startdialog scrollen. Die Teleport-Taste erscheint beim Magier und gibt ihren Zustand an assistive Technik weiter.
- Im Archiv setzt eine Aktion Suchtext und Kategorie gemeinsam zurück. Sie erscheint bei aktiven Filtern und gibt nach dem Zurücksetzen den Fokus an das Suchfeld zurück.

Die Tests in `docs/qa-check.cjs` prüfen einen Vollbildlauf mit Touch-Eingabe bei 320 px, den Vollbild-Ersatz ohne Browser-API im 640 × 240 px-Querformat und das Zurücksetzen einer ergebnislosen Suche. Der normale Funktionstest für Archiv, Videos, Sprache und Demos wurde mit Chromium erneut ausgeführt. 14 HTML-Dokumente und 229 interne Referenzen wurden geprüft.
