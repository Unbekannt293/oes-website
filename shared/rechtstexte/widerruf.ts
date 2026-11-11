/**
 * Widerrufsbelehrung mit Muster-Widerrufsformular: Text von Louis
 * (wiederrufsbelehrung.pdf, 11.11.2026). Eine Quelle fuer die Seite
 * /widerruf und das PDF im Mailanhang der Buchungsbestaetigung.
 * Angeglichen: Kontakt aus shared/firma.ts, im Formular "(*)" wieder
 * eingesetzt (ging beim PDF verloren) samt Fussnote, und "Fotobox" zu
 * "Fotobox bzw. Soundbox", weil auch Soundboxen gebucht werden.
 * Zeilenumbrueche (\n) stehen in Seite und PDF als neue Zeile.
 */
import { FIRMA } from '../firma'
import type { Rechtstext } from './typ'

export const WIDERRUF: Rechtstext = {
  titel: 'Widerrufsbelehrung',
  stand: 'Stand: 11. November 2026',
  abschnitte: [
    {
      titel: 'Widerrufsrecht',
      absaetze: [
        'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.',
        'Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.',
        'Um Ihr Widerrufsrecht auszuüben, müssen Sie uns',
        `${FIRMA.inhaber}\n${FIRMA.name}\n${FIRMA.strasse}\n${FIRMA.plz} ${FIRMA.ort}\nE-Mail: ${FIRMA.email}\nTelefon: ${FIRMA.telefon}`,
        'mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.',
        'Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.',
      ],
    },
    {
      titel: 'Folgen des Widerrufs',
      absaetze: [
        'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.',
        'Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.',
      ],
    },
    {
      titel: 'Vorzeitiges Erlöschen des Widerrufsrechts',
      absaetze: [
        'Das Widerrufsrecht erlischt vorzeitig, wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung der Dienstleistung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben haben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung durch uns verlieren.',
      ],
    },
    {
      titel: 'Muster-Widerrufsformular',
      absaetze: [
        '(Wenn Sie den Vertrag per E-Mail widerrufen wollen, kopieren Sie bitte diesen Text, füllen Sie ihn aus und senden Sie ihn an uns zurück.)',
        `An: ${FIRMA.name}, ${FIRMA.strasse}, ${FIRMA.plz} ${FIRMA.ort}, ${FIRMA.email}`,
        'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Buchung einer Fotobox bzw. Soundbox für den [Datum des Events].',
        '• Gebucht am:\n• Name des Kunden:\n• Anschrift des Kunden:\n• Datum von heute:\n• Unterschrift (nur bei Mitteilung auf Papier):',
        '(*) Unzutreffendes streichen.',
      ],
    },
  ],
}
