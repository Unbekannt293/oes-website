/**
 * Allgemeine Mietbedingungen (AGB): Text von Louis (OES_AGB´S.docx, Stand 18.10.2026), am 04.11.2026 an die
 * gebaute Seite angeglichen. Eine Quelle fuer die Seite /agb und das PDF
 * im Mailanhang (server/utils/rechtstexte-pdf.ts).
 * Angeglichen: Bestellknopf heisst wie auf der Seite "Zahlungspflichtig
 * bestellen" (Louis' Brief), Paketnamen wie im Katalog (Basic, Classic,
 * Premium, Premium Plus, Deluxe), § 6 (2) Zahlungsfrist statt "keine
 * Reservierung vor Zahlung" (so arbeitet die Seite, shared/zahlungsfrist.ts).
 * Vor dem Go-live juristisch pruefen lassen.
 */
import type { Rechtstext } from './typ'

export const AGB: Rechtstext = {
  "titel": "Allgemeine Mietbedingungen (AGB)",
  "stand": "Stand: 4. November 2026",
  "abschnitte": [
    {
      "titel": "§ 1 Anbieter, Geltungsbereich und Vertragspartner",
      "absaetze": [
        "(1) Vermieter ist OES – Otto’s Event Service, Einzelunternehmen des Inhabers Hans-Joachim Louis Otto, Willöperstraße 19, 22047 Hamburg (nachfolgend „OES“). Vertragspartner ist der jeweilige Mieter.",
        "(2) Diese Bedingungen gelten für die zeitweise Vermietung von Fotoboxen, Soundboks-Lautsprechern, Kombinationen und vereinbartem Zubehör einschließlich ausdrücklich gebuchter Zusatzleistungen. Sie gelten im Online-Buchungsprozess und bei sonstigen Buchungen, soweit sie jeweils wirksam einbezogen sind.",
        "(3) Individuelle Vereinbarungen haben Vorrang vor diesen Bedingungen. Zwingende gesetzliche Verbraucherrechte bleiben unberührt."
      ]
    },
    {
      "titel": "§ 2 Buchungsberechtigung, Verbraucher und Unternehmen",
      "absaetze": [
        "(1) Verträge über das Online-Buchungssystem können nur Personen abschließen, die mindestens 18 Jahre alt und geschäftsfähig sind. Bei Buchungen für Unternehmen handelt die bestellende Person im Namen des angegebenen Unternehmens, soweit sie hierzu bevollmächtigt ist.",
        "(2) Verbraucher ist jede natürliche Person, die überwiegend zu privaten Zwecken handelt; Unternehmer ist jede natürliche oder juristische Person oder rechtsfähige Personengesellschaft, die bei Vertragsschluss in Ausübung ihrer gewerblichen oder selbstständigen beruflichen Tätigkeit handelt."
      ]
    },
    {
      "titel": "§ 3 Mietgegenstände, Pakete und Leistungsbeschreibung",
      "absaetze": [
        "(1) Art, Anzahl, genauer Leistungsumfang und Zubehör der vermieteten Gegenstände ergeben sich ausschließlich aus den vor Abgabe der Bestellung angezeigten Produktangaben und der individuellen Buchungsbestätigung.",
        "(2) Die Fotobox-Pakete unterscheiden sich insbesondere in der Anzahl enthaltener Ausdrucke: „Basic“ ohne Ausdrucke (digitale Bilder/Online-Galerie gemäß Angebot), „Classic“ mit 150, „Premium“ mit 300, „Premium Plus“ mit 500 und „Deluxe“ mit 700 Ausdrucken. Maßgeblich bleibt die konkrete Buchungsbestätigung.",
        "(3) Bei Soundboks-Buchungen richten sich Anzahl der Lautsprecher, Akkus, Ladegeräte und sonstiges Zubehör nach der Buchung. Zusätzliche Dekoration oder andere optionale Leistungen sind nur enthalten, wenn sie ausdrücklich gebucht und bestätigt wurden.",
        "(4) Sämtliche Mietgegenstände bleiben Eigentum von OES."
      ]
    },
    {
      "titel": "§ 4 Online-Verfügbarkeit und Buchungsvorgang",
      "absaetze": [
        "(1) Die Präsentation der Mietangebote auf der Website ist kein verbindliches Vertragsangebot von OES. Der Mieter wählt die Mietgegenstände, Mietzeit, Übergabeart und gegebenenfalls Zusatzleistungen aus. Eine unverbindliche Anfrage, etwa zu einer größeren Lieferentfernung, stellt noch keine Buchung dar.",
        "(2) Das Buchungssystem prüft die Verfügbarkeit vor Abschluss der Bestellung. Die endgültige Verfügbarkeit wird bei Vertragsannahme erneut geprüft. Der Mieter kann vor Absenden der Bestellung seine Angaben, insbesondere Veranstaltungstermin, Lieferadresse, Gesamtpreis, Kaution und Zahlungsart prüfen und berichtigen.",
        "(3) Bei Lieferungen außerhalb des online kalkulierbaren Liefergebiets erfolgt eine individuelle Preisabstimmung; bis zu einer übereinstimmenden Festlegung des Gesamtpreises kommt insoweit keine automatische Buchung zustande."
      ]
    },
    {
      "titel": "§ 5 Vertragsschluss und automatische Buchungsbestätigung",
      "absaetze": [
        "(1) Durch Anklicken der eindeutig mit „Zahlungspflichtig bestellen“ bezeichneten Bestellschaltfläche gibt der Kunde ein verbindliches Vertragsangebot ab.",
        "(2) Bei Online-Buchungen kommt der Mietvertrag erst zustande, wenn OES nach bestätigter Zahlung beziehungsweise festgestelltem Eingang einer Banküberweisung die Verfügbarkeit erneut geprüft und eine ausdrückliche Buchungsbestätigung per E-Mail versandt hat. Vor dieser Bestätigung besteht keine verbindliche Geräte- oder Terminreservierung. Bei Buchungen über Kleinanzeigen oder andere Kanäle kann ein Vertrag schon durch übereinstimmende Nachrichten zustande kommen; die jeweils wirksam einbezogenen Mietbedingungen gelten ab Vertragsschluss.",
        "(3) Eine Bestelleingangsbestätigung oder die bloße Zahlungsanweisung ist keine Vertragsannahme. Falls zwischen Bestellung und Zahlungsfeststellung die Geräte anderweitig vergeben wurden oder OES die Buchung nicht annimmt, wird der Kunde darüber informiert; bereits eingegangene Zahlungen werden unverzüglich zurückgezahlt.",
        "(4) Nach Vertragsschluss erhält der Mieter auf einem dauerhaften Datenträger, insbesondere per E-Mail, die individuellen Buchungsdaten und die zum Vertragsschluss geltenden Mietbedingungen. Die Vertragssprache ist Deutsch. Das bei Übergabe vor Ort unterzeichnete Miet- und Übergabedokument bestätigt bei bereits bestehendem Fernabsatzvertrag die vereinbarten Daten und dokumentiert Inventar und Zustand, ohne automatisch neue oder widersprechende Vertragsbedingungen einzuführen. Erfolgt der Vertragsschluss erstmals vor Ort, gilt die dort getroffene Vereinbarung."
      ]
    },
    {
      "titel": "§ 6 Zahlungsarten und Banküberweisung",
      "absaetze": [
        "(1) Im Checkout angebotene Zahlungsarten sind die dort freigeschalteten Verfahren, insbesondere PayPal sowie Zahlung per Banküberweisung und gegebenenfalls weitere über Stripe angebundene Zahlungsmethoden. Die konkreten Zahlungsanbieter und verfügbaren Verfahren werden vor Abgabe der Bestellung genannt. Für die technische Abwicklung gelten ergänzend die einschlägigen Bestimmungen des jeweils gewählten Zahlungsdienstleisters.",
        "(2) Bei Wahl der Banküberweisung erhält der Kunde die Zahlungsinformationen. Mit der Bestellung hält OES den gewünschten Termin unverbindlich bis zum Ablauf der Zahlungsfrist frei. Die Zahlungsfrist beträgt fünf Tage ab Bestellung, bei Veranstaltungen, die weniger als 14 Tage nach der Bestellung beginnen, zwei Tage, und endet spätestens am Tag vor Mietbeginn; das genaue Datum steht in der Eingangsbestätigung. Geht die Zahlung nicht innerhalb der Frist ein, kann OES die Vormerkung ohne Kosten für den Kunden aufheben; der Kunde wird darüber per E-Mail informiert. Nach festgestelltem Zahlungseingang wird die Verfügbarkeit erneut geprüft; nur bei positiver Prüfung versendet OES eine verbindliche Buchungsbestätigung. Anderenfalls erhält der Kunde den gezahlten Betrag unverzüglich zurück.",
        "(3) Bei online abgeschlossenen Buchungen ist der Mietpreis auf die im Checkout gewählte Weise zu zahlen. Eine bei Übergabe fällige Kaution kann dort bar, per PayPal oder per Echtzeitüberweisung hinterlegt werden. Die Übergabe erfolgt erst nach festgestelltem Eingang der vereinbarten Kaution."
      ]
    },
    {
      "titel": "§ 7 Preise, Lieferkosten und Zusatzleistungen",
      "absaetze": [
        "(1) Es gilt der im Buchungsvorgang ausgewiesene und in der Buchungsbestätigung vereinbarte Gesamtmietpreis einschließlich gewählter Lieferleistungen, Sonderleistungen und nach Abzug der ausgewiesenen Rabatte.",
        "(2) Eine rückzahlbare Sicherheitskaution ist kein Bestandteil des Mietpreises und wird separat ausgewiesen.",
        "(3) Solange OES die Kleinunternehmerregelung gemäß § 19 UStG anwendet, wird Umsatzsteuer nicht gesondert ausgewiesen. Zusätzliche Leistungen oder abweichende Lieferkosten nach Vertragsschluss bedürfen einer ausdrücklichen Vereinbarung."
      ]
    },
    {
      "titel": "§ 8 Einheitliche Sicherheitskaution (250 €)",
      "absaetze": [
        "(1) Bei jeder Vermietung erhebt OES unabhängig von Gesamtmietpreis, Geräteanzahl oder Gerätekombination eine einheitliche rückzahlbare Sicherheitskaution von 250,00 €.",
        "(2) Die Kaution wird dem Mietpreis stets gesondert ausgewiesen; sie ist kein Entgelt für die Vermietung. Sie ist spätestens vor der Übergabe in der vereinbarten Weise vollständig zu hinterlegen.",
        "(3) Es gilt für alle angebotenen Einzelgeräte und Gerätekombinationen ausnahmslos derselbe Kautionsbetrag von 250,00 €.",
        "(4) Der Mieter kann die Kaution wahlweise zusammen mit der Buchung online entrichten oder bei Übergabe leisten. Bei Übergabe werden Bargeld, PayPal und Echtzeitüberweisung akzeptiert. Ein nur ausgelöster, aber noch nicht gutgeschriebener Überweisungsauftrag gilt nicht als Zahlung. Der Eingang wird bei Übergabe dokumentiert.",
        "(5) Die Kaution sichert ausschließlich berechtigte Ansprüche von OES wegen vom Mieter zu vertretender Beschädigungen, Verluste, fehlender Gegenstände oder sonstiger fälliger Forderungen aus dem Mietverhältnis. Sie begrenzt eine gesetzlich bestehende Haftung nicht.",
        "(6) Nach vollständiger Rückgabe und angemessener Überprüfung wird die Kaution, soweit keine berechtigten Gegenansprüche bestehen, unverzüglich zurückgezahlt. Die Rückzahlung erfolgt nach Vereinbarung insbesondere per Echtzeitüberweisung auf ein vom Mieter benanntes Konto. Zurückbehaltungen werden nachvollziehbar begründet und abgerechnet. Die Kaution begrenzt die gesetzlichen Haftungsansprüche nicht."
      ],
      "tabelle": {
        "kopf": [
          "Mietgegenstand / Kombination",
          "Kaution je Buchung"
        ],
        "zeilen": [
          [
            "Alle Fotobox- und Soundboks-Mieten, Einzelgeräte und Kombinationen",
            "250,00 €"
          ]
        ]
      },
      "tabelleNach": 3
    },
    {
      "titel": "§ 9 Mietzeitraum, Lieferung und Übergabeart",
      "absaetze": [
        "(1) Mietbeginn, Mietende, Übergabe- und Rückgabeort ergeben sich aus der Buchungsbestätigung. Mehrtägige Vermietungen sind möglich, soweit vereinbart.",
        "(2) Fotoboxen werden ausschließlich durch OES geliefert, auf- und abgebaut sowie abgeholt; eine Selbstabholung der Fotobox ist ausgeschlossen. Für Soundboks-Lautsprecher kann der Mieter bei der Buchung zwischen Selbstabholung und Lieferung durch OES wählen. Bei Selbstabholung erfolgt die Rückgabe grundsätzlich durch den Mieter am vereinbarten Rückgabeort; bei Lieferung holt OES die Geräte zum vereinbarten Zeitpunkt wieder ab. Übergabeart, Ort, Zeit und gegebenenfalls Lieferkosten ergeben sich aus der Buchungsbestätigung. Lieferungen außerhalb des regulären Gebiets bedürfen vorheriger Vereinbarung.",
        "(3) Bei Selbstabholung von Soundboks-Lautsprechern hat der Mieter diese beim Hin- und Rücktransport mit der erforderlichen Sorgfalt zu sichern und zu behandeln. Für vom Mieter zu vertretende Transportschäden gelten die gesetzlichen Vorschriften. Bei einer Lieferung durch OES übernimmt OES die von ihm geschuldeten Transportleistungen. Abweichende Termine, zusätzliche Fahrten oder Änderungen des Übergabeorts bedürfen gesonderter Vereinbarung."
      ]
    },
    {
      "titel": "§ 10 Übergabeprotokoll und Vorschäden",
      "absaetze": [
        "(1) Bei Übergabe werden die Geräte einschließlich Zubehör möglichst gemeinsam auf Vollständigkeit, sichtbare Vorschäden und Funktionsfähigkeit geprüft. Das Ergebnis wird im Übergabe- und Inventarprotokoll festgehalten.",
        "(2) Das Protokoll dokumentiert den tatsächlichen Zustand und stellt keinen neuen Mietvertrag dar. Nicht sofort erkennbare Mängel und gesetzliche Ansprüche des Mieters bleiben unberührt."
      ]
    },
    {
      "titel": "§ 11 Pflichten von OES und Funktionsfähigkeit",
      "absaetze": [
        "(1) OES stellt die vereinbarten Geräte im vertragsgemäßen Zustand zur Verfügung und übernimmt die zugesagten Liefer- und Aufbauleistungen.",
        "(2) Sind gebuchte Geräte nicht verfügbar oder fallen sie aus, wird der Mieter unverzüglich informiert. Eine alternative gleichwertige Leistung wird nur im Einvernehmen vereinbart; gesetzliche Erstattungs-, Minderungs- und Schadensersatzrechte bleiben unberührt."
      ]
    },
    {
      "titel": "§ 12 Allgemeine Nutzung und Obhutspflichten",
      "absaetze": [
        "(1) Der Mieter hat die ihm überlassenen Geräte bestimmungsgemäß und mit der erforderlichen Sorgfalt zu behandeln. Er schützt sie im Rahmen seiner Verantwortung vor vermeidbaren Schäden, Verlust und unbefugtem Zugriff.",
        "(2) Ohne Zustimmung von OES dürfen Gehäuse, Hardware oder Software nicht verändert, zerlegt oder repariert werden, soweit zwingende gesetzliche Rechte nichts anderes erfordern.",
        "(3) Eine Weitervermietung an Dritte ist ohne Zustimmung ausgeschlossen. Die bestimmungsgemäße Benutzung durch Gäste der gebuchten Veranstaltung bleibt zulässig."
      ]
    },
    {
      "titel": "§ 13 Besondere Bedingungen für Fotoboxen",
      "absaetze": [
        "(1) Die Fotobox benötigt einen geeigneten, ebenen, trockenen und tragfähigen Standort sowie – soweit erforderlich – eine betriebsfähige 230-Volt-Stromversorgung.",
        "(2) Die Fotobox darf nicht ungeschützt Regen, Feuchtigkeit, unzulässiger Hitze oder sonstigen schädlichen Umwelteinflüssen ausgesetzt werden. Eine Außenaufstellung ist nur unter ausdrücklich abgestimmten wettergeschützten Bedingungen zulässig.",
        "(3) Für Fotosofortdrucke gelten das gebuchte Kontingent und das im Angebot bezeichnete Format. Weiterer Fotodruck ist nur geschuldet, wenn er gesondert vereinbart wurde."
      ]
    },
    {
      "titel": "§ 14 Besondere Bedingungen für Soundboks-Lautsprecher",
      "absaetze": [
        "(1) Soundboks-Lautsprecher und Akkus sind entsprechend den übergebenen Hersteller- und Sicherheitshinweisen zu verwenden. Nicht vorgesehene Ladevorgänge oder eigenmächtige technische Änderungen sind untersagt.",
        "(2) Der Mieter beachtet im eigenen Verantwortungsbereich Lärmschutzvorgaben und Veranstaltungsauflagen. Akkus, Ladegeräte und Zubehör sind vollständig zurückzugeben."
      ]
    },
    {
      "titel": "§ 15 Sicherer Aufstellort und Veranstaltungen",
      "absaetze": [
        "(1) Der Mieter sorgt in seinem Verantwortungsbereich für einen sicheren Einsatzort und wirkt erkennbaren Gefahren wie Stolperstellen oder unsicherer Aufstellung entgegen.",
        "(2) Soweit OES Aufbau und Installation schuldet, bleiben die eigenen gesetzlichen Sicherheits- und Sorgfaltspflichten von OES uneingeschränkt bestehen."
      ]
    },
    {
      "titel": "§ 16 Störungen, Mängel und Meldungen",
      "absaetze": [
        "(1) Erkennbare Defekte, Störungen und Schäden sind OES nach Möglichkeit unverzüglich mitzuteilen. Der Vermieter wird im Rahmen der bestehenden Vertragspflichten Abhilfe anbieten oder eine Lösung abstimmen.",
        "(2) Die Anzeige- und Mitwirkungspflichten lassen die gesetzlichen Mängelrechte, insbesondere etwaige Rechte auf Mietminderung und Schadensersatz, unberührt."
      ]
    },
    {
      "titel": "§ 17 Haftung des Mieters und gewöhnliche Abnutzung",
      "absaetze": [
        "(1) Der Mieter haftet für Schäden an Mietgegenständen nur, soweit er diese nach den gesetzlichen Vorschriften zu vertreten hat. Das betrifft insbesondere schuldhaft unsachgemäße Nutzung, Transportfehler und Verletzungen der Obhuts- oder Sorgfaltspflichten.",
        "(2) Gäste oder sonstige Dritte, die Geräte von OES rechtswidrig und schuldhaft beschädigen, können persönlich nach den gesetzlichen Vorschriften (insbesondere § 823 BGB) schadensersatzpflichtig sein. Sie werden durch die AGB nicht selbst zu Vertragspartnern. Schäden durch Gäste werden dem Mieter nicht pauschal zugerechnet; seine Haftung setzt eine eigene Pflichtverletzung oder eine gesetzliche Zurechnung (etwa nach § 278 BGB) voraus.",
        "(3) Gewöhnliche, vertragsgemäße Abnutzung ist nicht ersatzpflichtig. Ersatzansprüche bestimmen sich nach dem tatsächlich ersatzfähigen Schaden."
      ]
    },
    {
      "titel": "§ 18 Verlust, Diebstahl und Totalschaden",
      "absaetze": [
        "(1) Verlust, Diebstahl, Einbruchdiebstahl und Raub sind OES unverzüglich nach Kenntniserlangung anzuzeigen. Soweit zumutbar und erforderlich soll eine polizeiliche Anzeige erstattet und der Vorfall dokumentiert werden.",
        "(2) Für Verlust oder Totalschaden haftet der Mieter nur im Rahmen der gesetzlichen Vorschriften. Bei der Schadensbemessung sind unter anderem Wert, Alter, Zustand, mögliche Ersatzbeschaffung und ein etwaiger Restwert zu berücksichtigen. Der ursprüngliche Neupreis ist nicht automatisch geschuldet."
      ]
    },
    {
      "titel": "§ 19 Rückgabe und Rückgabeprotokoll",
      "absaetze": [
        "(1) Die Mietgegenstände sind am vereinbarten Mietende vollständig und in vertragsgemäßem Zustand entweder am vereinbarten Rückgabeort zurückzugeben (Soundboks bei Selbstabholung) oder zur vereinbarten Abholung durch OES bereitzuhalten. Den Abbau der Fotobox übernimmt OES.",
        "(2) Zubehör, Akkus, Kabel, Requisiten und sonstige Bestandteile sind entsprechend dem Inventar zurückzugeben. Die Rückgabe wird nach Möglichkeit in einem Rückgabeprotokoll dokumentiert.",
        "(3) Wird die vereinbarte Rückgabe oder Abholung verzögert, gelten die gesetzlichen Rechte der Parteien."
      ]
    },
    {
      "titel": "§ 20 Verspätete Rückgabe",
      "absaetze": [
        "(1) Gibt der Mieter die Gegenstände nach Beendigung der Mietzeit nicht rechtzeitig zurück, kann OES im Rahmen der gesetzlichen Vorschriften Nutzungsentschädigung sowie einen nachgewiesenen weiteren Schaden verlangen.",
        "(2) Der Mieter hat OES sobald wie möglich zu informieren, wenn sich eine verspätete Rückgabe abzeichnet."
      ]
    },
    {
      "titel": "§ 21 Haftung des Vermieters",
      "absaetze": [
        "(1) OES haftet nach den gesetzlichen Vorschriften. Eine Haftungsbeschränkung gilt nicht für vorsätzlich oder grob fahrlässig verursachte Schäden sowie für Schäden aus der Verletzung von Leben, Körper oder Gesundheit im gesetzlich vorgeschriebenen Umfang.",
        "(2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten kann die Haftung im rechtlich zulässigen Umfang auf den vertragstypischen, vorhersehbaren Schaden beschränkt sein. Zwingende Ansprüche und gesetzliche Mängelrechte bleiben unberührt."
      ]
    },
    {
      "titel": "§ 22 Versicherung",
      "absaetze": [
        "(1) OES unterhält eine Betriebshaftpflicht- und eine Geräteversicherung. Ein bestimmter Leistungsumfang zugunsten des Mieters oder ein Wegfall gesetzlicher Haftungsansprüche wird damit nicht zugesichert.",
        "(2) Der Mieter kann selbst prüfen, ob eine private oder betriebliche Haftpflichtversicherung Schäden an gemieteten Sachen abdeckt. Eine solche Versicherung ist nicht allgemein Voraussetzung der Buchung."
      ]
    },
    {
      "titel": "§ 23 Fotoaufnahmen, Galerie und Datenschutz",
      "absaetze": [
        "(1) Bei Fotobox-Vermietungen werden je nach gebuchter Leistung Fotos aufgenommen, verarbeitet, gegebenenfalls gedruckt und als Online-Galerie bereitgestellt. Technische Anbieter und Verarbeitungsvorgänge werden in der gesonderten Datenschutzerklärung beschrieben.",
        "(2) OES löscht aktive Fotodateien grundsätzlich spätestens 30 Tage nach Ende der Veranstaltung aus der eigenen Fotoverwaltung und der von OES administrierten Online-Galerie, soweit nicht für konkrete Aufnahmen eine andere rechtlich zulässige Verarbeitung vereinbart ist. Technische Backups von Dienstleistern können anderen Löschzyklen unterliegen; Details ergeben sich aus der Datenschutzerklärung. Es besteht kein Anspruch auf dauerhaftes Speichern der Bilder.",
        "(3) Eine Veröffentlichung von Fotos zu Werbezwecken durch OES erfolgt nur bei Vorliegen sämtlicher hierfür erforderlicher Rechte und Einwilligungen. Die bloße Buchung ist keine pauschale Veröffentlichungseinwilligung sämtlicher abgebildeter Personen."
      ]
    },
    {
      "titel": "§ 24 Stornierung vor Mietbeginn",
      "absaetze": [
        "(1) Der Mieter kann vor Mietbeginn in Textform, insbesondere per E-Mail, stornieren. Eine telefonische Mitteilung kann zusätzlich entgegengenommen werden; zur Nachweisbarkeit wird eine schriftliche Bestätigung empfohlen. Maßgeblich für die Frist ist der Zugang der Erklärung bei OES.",
        "(2) Für die vertraglich eingeräumte Stornierung sind die nachfolgenden Pauschalen bezogen auf den vereinbarten Gesamtmietpreis einschließlich Lieferkosten und Sonderleistungen, jedoch ohne die rückzahlbare Kaution, vorgesehen:",
        "(3) Dem Mieter bleibt ausdrücklich der Nachweis gestattet, dass OES kein oder ein wesentlich geringerer Schaden entstanden ist. Ersparte Aufwendungen und Vorteile durch eine anderweitige Vermietung werden nach den gesetzlichen Vorschriften berücksichtigt. Bereits bezahlte Beträge werden mit berechtigten Ansprüchen verrechnet und verbleibende Guthaben erstattet. Zwingende gesetzliche Widerrufs-, Kündigungs- und Mängelrechte bleiben unberührt."
      ],
      "tabelle": {
        "kopf": [
          "Zeitpunkt des Stornozugangs",
          "Vorgesehene Pauschale"
        ],
        "zeilen": [
          [
            "30 oder mehr Kalendertage vor Mietbeginn",
            "0 %"
          ],
          [
            "29 bis 14 Kalendertage vorher",
            "30 %"
          ],
          [
            "13 bis 7 Kalendertage vorher",
            "50 %"
          ],
          [
            "Weniger als 7 Kalendertage vorher",
            "80 %"
          ]
        ]
      },
      "tabelleNach": 2
    },
    {
      "titel": "§ 25 Gesetzliches Widerrufsrecht",
      "absaetze": [
        "(1) Bei Fernabsatzverträgen mit Verbrauchern besteht grundsätzlich ein gesetzliches Widerrufsrecht, sofern keine gesetzliche Ausnahme greift. Die Ausnahme des § 312g Abs. 2 Nr. 9 BGB kann bestimmte termingebundene Dienstleistungen im Zusammenhang mit Freizeitbetätigungen erfassen. Ob sie für eine konkrete Fotobox-, Soundboks- oder Kombibuchung einschlägig ist, richtet sich nach deren tatsächlichem Leistungsinhalt und ist nicht allein durch einen Veranstaltungstermin geklärt.",
        "(2) OES informiert Verbraucher vor Abgabe ihrer Buchung gesondert über das Bestehen oder Nichtbestehen des gesetzlichen Widerrufsrechts. Soweit das Recht besteht, erhalten Verbraucher eine passende Widerrufsbelehrung und ein Muster-Widerrufsformular. Zusätzlich wird während der gesetzlichen Widerrufsfrist eine Widerrufsfunktion nach § 356a BGB über die Website bereitgestellt; der Widerruf kann daneben nach den gesetzlichen Vorschriften etwa per E-Mail oder Brief erklärt werden.",
        "(3) Ein wirksamer gesetzlicher Widerruf ist keine vertragliche Stornierung; die Pauschalen aus § 24 gelten dafür nicht."
      ]
    },
    {
      "titel": "§ 26 Außergewöhnliche Umstände und Vertragsänderungen",
      "absaetze": [
        "(1) Bei nicht vorhersehbaren Leistungshindernissen außerhalb des Einflussbereichs der Beteiligten gelten die gesetzlichen Regelungen; eine pauschale Freistellung von gesetzlichen Pflichten wird nicht vereinbart.",
        "(2) Die Parteien können eine Terminänderung, Ersatzleistung oder Vertragsänderung einvernehmlich vereinbaren. Individuell ausgehandelte Vereinbarungen gehen diesen AGB vor."
      ]
    },
    {
      "titel": "§ 27 Anwendbares Recht und Schlussregeln",
      "absaetze": [
        "(1) Es gilt deutsches Recht unter Wahrung zwingender Verbraucherschutzvorschriften. Gegenüber Verbrauchern gelten die gesetzlichen Gerichtsstände.",
        "(2) Sollte eine einzelne Bestimmung unwirksam sein, treten die gesetzlichen Vorschriften an deren Stelle. Die übrigen Bestimmungen bleiben im gesetzlich vorgesehenen Umfang bestehen.",
        "(3) Hinweise zur außergerichtlichen Verbraucherstreitbeilegung werden entsprechend den gesetzlichen Pflichten auf der Website und gegebenenfalls zusammen mit diesen AGB zur Verfügung gestellt."
      ]
    }
  ]
}
