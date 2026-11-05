/**
 * Datenschutzerklaerung: Text von Louis (OES_Datenschutzerklärung.docx, Stand 18.10.2026), am 04.11.2026 an die
 * gebaute Seite angeglichen. Eine Quelle fuer die Seite /datenschutz und das PDF
 * im Mailanhang (server/utils/rechtstexte-pdf.ts).
 * Angeglichen: Netlify laeuft in den USA (nicht Frankfurt), openrouteservice
 * und lokale Speicherung so beschrieben, wie sie eingebaut sind, Abschnitt
 * Kundenbewertungen und die Formular-Bremse neu, Telefon wie im Impressum,
 * interne Pruefvermerke in eckigen Klammern entfernt.
 * Vor dem Go-live juristisch pruefen lassen.
 */
import type { Rechtstext } from './typ'

export const DATENSCHUTZ: Rechtstext = {
  "titel": "Datenschutzerklärung",
  "stand": "Stand: 5. November 2026",
  "abschnitte": [
    {
      "titel": "1. Verantwortlicher und Kontakt",
      "absaetze": [
        "Verantwortlicher im Sinne der Datenschutz-Grundverordnung ist OES – Otto’s Event Service, Einzelunternehmen, Inhaber Hans-Joachim Louis Otto, Willöperstraße 19, 22047 Hamburg, Deutschland.",
        "E-Mail für Datenschutzanfragen: kontakt@ottos-eventservice.de. Telefon: 0159 06839267. Webadresse: ottos-eventservice.de.",
        "Anfragen zu personenbezogenen Daten können an die vorgenannte Kontaktadresse gerichtet werden. Soweit ein Datenschutzbeauftragter gesetzlich zu benennen ist oder tatsächlich bestellt wird, sind dessen Kontaktdaten zusätzlich hier anzugeben."
      ]
    },
    {
      "titel": "2. Geltungsbereich und Datenkategorien",
      "absaetze": [
        "Die folgenden Informationen betreffen den Besuch unserer Website, die Bearbeitung von Anfragen, die Online-Vermietung von Fotoboxen und Soundboks-Lautsprechern, die Zahlungsabwicklung und gegebenenfalls die Nutzung unserer Fotoboxen und Online-Galerien.",
        "Je nach Kontakt und Buchung können wir unter anderem Namen, Anschrift, vereinbarten Liefer-, Abhol-, Rückgabe- oder Veranstaltungsort, E-Mail-Adresse, Telefonnummer, Buchungsdatum und Mietzeitraum, gebuchte Geräte und Leistungen, Preise, die einheitliche Kaution von 250 €, Zahlungsart und Zahlungsstatus, Vertrags- und Übergabeinformationen sowie im Schadensfall notwendige Informationen zum Hergang und zu beteiligten Personen verarbeiten."
      ]
    },
    {
      "titel": "3. Zugriff auf die Website und technische Protokolle",
      "absaetze": [
        "Bei Aufruf der Website werden technisch erforderliche Verbindungsdaten verarbeitet, etwa IP-Adresse, Zeitpunkt, aufgerufene Ressourcen, Browser-/Geräteinformationen und gegebenenfalls Fehler- oder Sicherheitsprotokolle. Dies ist für die sichere und stabile Bereitstellung sowie die Abwehr von Missbrauch erforderlich. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes Interesse liegt im sicheren Betrieb des Webangebots.",
        "Die Website wird über Netlify, Inc. (USA) betrieben. Die Auslieferung der Seiten erfolgt über ein weltweites Servernetz, die serverseitigen Funktionen (zum Beispiel Buchung, Kontaktformular, Lieferkostenberechnung) laufen in den USA. Dabei können die genannten Verbindungsdaten in den USA verarbeitet werden. Zu den Garantien für diese Übermittlung siehe Nummer 11. Für technische Datenverarbeitung sind insbesondere Hosting, Bereitstellung und Absicherung des Angebots erforderlich (Art. 6 Abs. 1 Buchst. f DSGVO). Zum Schutz vor automatisierten Massenanfragen (zum Beispiel Spam über Formulare) zählt unser Server kurzzeitig, wie viele Anfragen von einer IP-Adresse kommen. Diese Zähler liegen nur im Arbeitsspeicher und verfallen spätestens nach einer Stunde."
      ]
    },
    {
      "titel": "4. Buchung, Kalender und Datenbank",
      "absaetze": [
        "Für Terminauswahl, Verfügbarkeitsprüfung, Vertragsabschluss und Durchführung der Vermietung verarbeiten wir Buchungs- und Kontaktdaten, Mietzeitraum, gewählte Mietgegenstände, gewählte Übergabeart, gegebenenfalls Lieferadresse, Abhol- und Rückgabeort, Mietpreis, etwaige Kaution und Zahlungsstatus. Das System prüft vor Vertragsschluss und nach Eingang der Zahlung die Geräteverfügbarkeit. Vor Zahlungseingang per Banküberweisung wird kein verbindlicher Termin reserviert. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b DSGVO.",
        "Als technische Buchungsdatenbank setzen wir Supabase mit der Projektregion Frankfurt (eu-central-1) ein. Supabase verarbeitet die hierfür erforderlichen Buchungsinformationen als Infrastruktur-Dienstleister in unserem Auftrag. Die Speicherung der Kerndaten am Standort Frankfurt bedeutet laut Supabase nicht, dass sämtliche Betriebs- und Supportdaten ausschließlich dort verarbeitet werden.",
        "Die automatische Verfügbarkeitsprüfung und Buchungsbestätigung betreffen die technische Abwicklung der vertraglich gewählten Termine und Leistungen. Es ist keine automatisierte Bonitätsentscheidung oder kundenbezogene Werbeprofilbildung vorgesehen. Eine rechtlich relevante automatisierte Einzelentscheidung im Sinne des Art. 22 DSGVO wird nach dem beschriebenen Prozess nicht eingesetzt."
      ]
    },
    {
      "titel": "5. Kontaktanfragen, Vertragskommunikation und E-Mail",
      "absaetze": [
        "Bei Anfragen über E-Mail, Kontaktformular oder Telefon verarbeiten wir die freiwillig übermittelten Angaben zur Beantwortung und gegebenenfalls Vorbereitung eines Vertrags. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b DSGVO bei Vertragsbezug, ansonsten Art. 6 Abs. 1 Buchst. f DSGVO (Bearbeitung geschäftlicher Anfragen).",
        "Der Versand und Empfang geschäftlicher E-Mails erfolgt über das STRATO-E-Mail-Konto. Für Buchungsbestätigungen, Rückfragen und die Bereitstellung vereinbarter Vertragsunterlagen verarbeiten wir die hierfür nötigen Kommunikations- und Vertragsdaten."
      ]
    },
    {
      "titel": "6. Kundenbewertungen",
      "absaetze": [
        "Auf unserer Website können Sie eine Bewertung abgeben. Dabei verarbeiten wir den von Ihnen angegebenen Namen (auch ein Kürzel wie „Anna M.“ ist möglich), die Sternebewertung, Ihren Text, das bewertete Produkt sowie den Zeitpunkt. Eine E-Mail-Adresse wird nicht abgefragt.",
        "Bewertungen werden erst nach unserer Prüfung veröffentlicht, und zwar mit dem angegebenen Namen. Rechtsgrundlage ist Ihre Einwilligung, die Sie beim Absenden erteilen (Art. 6 Abs. 1 Buchst. a DSGVO). Sie können sie jederzeit mit Wirkung für die Zukunft widerrufen, eine kurze Nachricht an die unter Nummer 1 genannte Adresse genügt. Wir löschen die Bewertung dann.",
        "Freiwillig können Sie bis zu drei Fotos hinzufügen. Ihr Browser verkleinert die Fotos vor dem Hochladen und entfernt dabei die in Fotos gespeicherten Zusatzdaten wie Aufnahmeort, Aufnahmezeit und Kameramodell. Die Fotos werden zusammen mit der Bewertung veröffentlicht; bitte laden Sie nur Fotos hoch, an denen Sie die Rechte haben und auf denen erkennbare Personen mit der Veröffentlichung einverstanden sind. Mit der Bewertung löschen wir auch die Fotos.",
        "Über neue Bewertungen werden wir per E-Mail benachrichtigt. Gespeichert werden Bewertungen und Fotos bei dem unter Nummer 4 genannten Anbieter (Datenbank und Dateispeicher)."
      ]
    },
    {
      "titel": "7. Lieferkostenberechnung über OpenRouteService",
      "absaetze": [
        "Zur Berechnung der Entfernung und der entfernungsabhängigen Lieferkosten nutzen wir den Routingdienst openrouteservice der HeiGIT gGmbH, Heidelberg. Die Abfrage erfolgt ausschließlich über unseren Server, nicht direkt aus Ihrem Browser. Übermittelt werden nur Straße mit Hausnummer, Postleitzahl und Ort der Lieferanschrift, kein Name und keine Kontaktdaten. Der Dienst liefert daraus Koordinaten und die Fahrstrecke zurück.",
        "Die Verarbeitung erfolgt zur Ermittlung des Lieferpreises im Rahmen der Buchung auf Grundlage von Art. 6 Abs. 1 Buchst. b DSGVO. Die berechnete Entfernung speichern wir mit der Buchung als Nachweis für die Fahrtkosten."
      ]
    },
    {
      "titel": "8. Zahlungsabwicklung, Sicherheitskaution und Rückerstattung",
      "absaetze": [
        "Zur Zahlungsabwicklung verarbeiten wir, soweit erforderlich, Buchungsnummer, Mietpreis, eine einheitliche rückzahlbare Sicherheitskaution in Höhe von 250,00 €, gewählte Zahlungsmethode, Transaktionskennung, Zahlungsstatus sowie gegebenenfalls Bankverbindungsdaten für Kautionsrückzahlungen. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b DSGVO; gesetzlich notwendige Zahlungsbelege werden auf Art. 6 Abs. 1 Buchst. c DSGVO gestützt. Je nach Checkout-Auswahl werden Zahlungen über Stripe, PayPal oder per Banküberweisung abgewickelt.",
        "Bei Nutzung von PayPal werden erforderliche Transaktionsdaten an den Zahlungsdienst PayPal übermittelt. Soweit PayPal als Zahlart über Stripe eingebunden ist, kann zusätzlich Stripe an der technischen Zahlungsabwicklung beteiligt sein. Die Datenverarbeitung durch Zahlungsdienstleister kann in eigener datenschutzrechtlicher Verantwortung erfolgen. Informationen zu den jeweiligen Vorgängen erhalten Nutzer auch in den Datenschutzhinweisen der eingesetzten Anbieter.",
        "Bei Banküberweisung übermitteln die beteiligten Banken die erforderlichen Zahlungsdaten, darunter Kontoinhaber, IBAN, Betrag, Buchungstag und Verwendungszweck. Zur Rückzahlung einer Kaution kann die hierfür angegebene IBAN verarbeitet werden. Die Bankverbindung wird nicht für fremde Zwecke verwendet.",
        "Bei über Stripe abgewickelten Zahlungen können erforderliche Kontakt-, Rechnungs- und Transaktionsinformationen an Stripe sowie nach gewählter Methode weitere Zahlungsdienstleister übermittelt werden. Dazu gehören gegebenenfalls Karten- oder Wallet-Zahlungen. Stripe kann für Sicherheit und Betrugsprävention Cookies und ähnliche Techniken einsetzen. Welche Verfahren tatsächlich im Checkout verfügbar sind, ist bei der Buchung ersichtlich."
      ]
    },
    {
      "titel": "9. Fotobox-Aufnahmen und Fotogalerie (LumaBooth / fotoShare)",
      "absaetze": [
        "Für die Fotobox wird LumaBooth von Lumasoft LLC (USA) verwendet. Aufnahmen werden bei Herstellung und gegebenenfalls Druck lokal verarbeitet. Wenn Online-Galerie und/oder Fotoversand genutzt werden, können Fotos und erforderliche technische Daten an die fotoShare-Cloud sowie beteiligte Dienstleister übertragen werden. Auch wenn allein OES die administrative Galerie verwaltet, bedeutet dies nicht, dass die Dateien ausschließlich auf OES-Geräten gespeichert sind.",
        "Je nach genutzten Funktionen können Fotos, freiwillig zum Fotoversand eingegebene E-Mail-Adressen sowie technische Galerie- und Abrufdaten verarbeitet werden. Die Galerie wird nur über die vorgesehenen Zugangswege verfügbar gemacht. Eine eigenständige Veröffentlichung der Bilder durch OES zu Werbezwecken erfolgt nicht ohne die hierfür erforderlichen Rechte beziehungsweise Einwilligungen.",
        "Rechtsgrundlagen können Art. 6 Abs. 1 Buchst. b DSGVO im Verhältnis zum buchenden Kunden, Art. 6 Abs. 1 Buchst. f DSGVO nach Interessenabwägung für die bestimmungsgemäße Durchführung des gebuchten Fotobox-Angebots oder – soweit im Einzelfall erforderlich – eine Einwilligung nach Art. 6 Abs. 1 Buchst. a DSGVO sein. Bei Veranstaltungsfotos und Gästedaten ist die genaue Rollenverteilung zwischen OES und Veranstalter nach dem konkreten Ablauf zu prüfen; soweit eine Auftragsverarbeitung vorliegt, ist eine Vereinbarung gemäß Art. 28 DSGVO erforderlich.",
        "Der Zugang zur Galerie wird auf berechtigte Personen begrenzt und entsprechend den gewählten Zugangs-/Freigabeeinstellungen gestaltet. Bei Freigabe eines Links können Personen, die den Link erhalten, im Rahmen der Einstellungen auf die Galerie zugreifen. Deshalb sollten Veranstalter Links nicht unkontrolliert veröffentlichen.",
        "OES löscht die eigenen aktiven Veranstaltungsfotos und die administrierten Inhalte der Online-Galerie spätestens 30 Tage nach Veranstaltungsende, soweit keine zulässige abweichende Verarbeitung vorliegt. Für Datenkopien und Sicherungen bei Lumasoft oder deren technischen Dienstleistern können zusätzliche, vom Anbieter bestimmte Lösch- und Backupzyklen gelten. Eine frühere Löschung wird auf berechtigte Anfrage geprüft und, soweit technisch und rechtlich möglich, durchgeführt."
      ]
    },
    {
      "titel": "10. Cookies, lokale Speicherung und Analyse",
      "absaetze": [
        "Wir setzen keine Marketing-, Webanalyse- oder Werbe-Trackingdienste ein und setzen auf unserer Website keine Cookies für solche Zwecke. Im Speicher Ihres Browsers legen wir nur ab, was für den von Ihnen gewünschten Dienst unbedingt erforderlich ist: den Inhalt des Warenkorbs und die gewählte Art der Kautionszahlung (lokaler Speicher) sowie während des Bestellvorgangs kurzzeitig Ihre Eingaben in der Kasse (Sitzungsspeicher), damit sie bei einem Abbruch der Online-Zahlung nicht verloren gehen. Diese Daten verlassen Ihr Gerät erst, wenn Sie eine Buchung absenden.",
        "Rechtsgrundlage für diese Speicherung ist § 25 Abs. 2 Nr. 2 TDDDG, da sie für den ausdrücklich gewünschten Dienst unbedingt erforderlich ist. Bei einer Online-Zahlung werden Sie auf die Bezahlseite von Stripe weitergeleitet. Stripe setzt dort nach seiner eigenen Cookie-Richtlinie Cookies und ähnliche Technologien für Sicherheit und Betrugsprävention ein."
      ]
    },
    {
      "titel": "11. Empfänger und Drittlandverarbeitung",
      "absaetze": [
        "Personenbezogene Daten können im jeweils erforderlichen Umfang an Hosting- und Infrastrukturunternehmen, Buchungsdatenbankanbieter, E-Mail-Dienstleister, Zahlungsdienstleister sowie Foto-/Galeriedienstleister übermittelt werden. Eine Weitergabe an Dritte zu deren eigenen Werbezwecken findet ohne entsprechende Rechtsgrundlage nicht statt.",
        "Bei internationalen Datenübermittlungen können die eingesetzten Dienstleister je nach konkretem Empfänger auf einen Angemessenheitsbeschluss – gegebenenfalls das EU-US Data Privacy Framework bei wirksamer Zertifizierung – oder auf EU-Standardvertragsklauseln und ergänzende Maßnahmen zurückgreifen. Frankfurt als Serverregion bedeutet nicht, dass eine Verarbeitung im Drittland grundsätzlich ausgeschlossen ist. Welche Garantien jeweils greifen, hängt von Anbieter und Vertrag ab."
      ]
    },
    {
      "titel": "12. Speicherdauer und Löschung",
      "absaetze": [
        "Wir speichern personenbezogene Daten grundsätzlich nur solange, wie dies für ihren jeweiligen Zweck erforderlich ist und keine gesetzliche Aufbewahrungspflicht oder ein berechtigter Grund zur weiteren Speicherung besteht.",
        "Geschäftliche Unterlagen werden entsprechend den jeweils anwendbaren gesetzlichen Aufbewahrungsfristen gespeichert, je nach Dokumentart insbesondere sechs, acht oder zehn Jahre nach § 147 AO. Unverbindliche Anfragen werden gelöscht, wenn sie nicht mehr benötigt werden. Zur Dokumentation und Abwicklung konkreter Schadensfälle werden gegebenenfalls beteiligte Personen und der Schadenshergang erfasst (Art. 6 Abs. 1 Buchst. f DSGVO: Geltendmachung, Ausübung und Verteidigung rechtlicher Ansprüche); eine Löschung erfolgt nach Wegfall des Zwecks vorbehaltlich gesetzlicher Aufbewahrungsgründe.",
        "Eigene aktive Veranstaltungsfotos werden spätestens 30 Tage nach Veranstaltungsende gelöscht; Backups von Lumasoft oder weiteren Betreibern können hiervon abweichende Löschzyklen haben. Protokoll- und Sicherheitsdaten werden nach Erforderlichkeit beziehungsweise den technischen Aufbewahrungsregeln des eingesetzten Anbieters gelöscht. Die konkrete Dauer von Providerlogs und Backups ist in den Anbieterbedingungen beziehungsweise der eingesetzten Konfiguration nachzuvollziehen."
      ]
    },
    {
      "titel": "13. Ihre Datenschutzrechte",
      "absaetze": [
        "Betroffene Personen haben bei Vorliegen der gesetzlichen Voraussetzungen die Rechte auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO).",
        "Eine wirksam erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden (Art. 7 Abs. 3 DSGVO). Eine Löschung kann eingeschränkt sein, wenn gesetzliche Aufbewahrungspflichten oder überwiegende gesetzlich zulässige Gründe entgegenstehen. Zur Ausübung Ihrer Rechte wenden Sie sich bitte an die unter Nummer 1 genannte Kontaktadresse."
      ]
    },
    {
      "titel": "14. Beschwerderecht",
      "absaetze": [
        "Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren (Art. 77 DSGVO), insbesondere beim Hamburgischen Beauftragten für Datenschutz und Informationsfreiheit oder bei einer anderen zuständigen Aufsichtsbehörde."
      ]
    },
    {
      "titel": "15. Bereitstellungspflicht und Folgen der Nichtbereitstellung",
      "absaetze": [
        "Angaben, die zur Bearbeitung einer Buchung und Durchführung des Mietvertrags erforderlich sind (insbesondere Kontaktdaten, Termin, Mietgegenstand, Lieferadresse bei Lieferung oder vereinbarter Übergabe-/Rückgabeort bei Selbstabholung und Zahlungsdaten), müssen für diesen Zweck bereitgestellt werden. Ohne diese Angaben kann ein Vertrag gegebenenfalls nicht abgeschlossen oder durchgeführt werden. Die Angabe von E-Mail-Adressen einzelner Veranstaltungsgäste für einen optionalen Foto-E-Mail-Versand ist dagegen freiwillig."
      ]
    },
    {
      "titel": "16. Datensicherheit und Aktualisierung",
      "absaetze": [
        "Wir treffen angemessene technische und organisatorische Maßnahmen zum Schutz personenbezogener Daten, insbesondere gegen unbefugten Zugriff, Verlust und Veränderung. Die konkrete Ausgestaltung umfasst nach technischer Umsetzung unter anderem gesicherte Zugriffsrechte, verschlüsselte Übertragungen, getrennte Rollen und eine geregelte Löschung.",
        "Stand: 18. Oktober 2026. Diese Fassung wurde an die einheitliche Kaution und die Dokumentation möglicher Schäden angepasst. Änderungen tatsächlicher Dienste oder Datenflüsse erfordern eine erneute Prüfung."
      ]
    }
  ]
}
