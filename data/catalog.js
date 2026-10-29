export const STICKER_MOTIFS = [
  {
    id: 'aux-0821-classic',
    name: 'AUX 0821 – Rot-Grün-Weiß',
    category: 'Kurve & Stadt',
    format: '9,5 × 9,5 cm (Quadrat, Outdoor-Vinyl)',
    finish: 'UV-Schutzlack glänzend (wetterfest)',
    badgeText: '0821 AUX',
    subText: 'FUGGERSTADT • SEIT 1907',
    style: 'stripes',
    guidePrice: 5,
    packSize: 25,
    negotiable: true,
    inStock: true,
    description:
      'Klassisches Rot-Grün-Weiß Motiv mit klarer 0821-Vorwahl und Zirbelnuss-Emblem. Stark haftend und witterungsbeständig.'
  },
  {
    id: 'fca-flutlicht',
    name: 'Flutlicht am Lech',
    category: 'Spieltag',
    format: '10,5 × 7,4 cm (DIN A7 Quer, gestanzt)',
    finish: 'Matt-Laminat kratzfest',
    badgeText: 'FLUTLICHT',
    subText: 'ARENA AUGSBURG • HEIMSPIEL',
    style: 'ticket',
    guidePrice: 6,
    packSize: 25,
    negotiable: true,
    inStock: true,
    description:
      'Eintrittskarten-Optik im Flutlicht-Stil für Abendspiele in Augsburg. Edles mattes Finish ohne Ausbleichen.'
  },
  {
    id: 'zirbelnuss-crest',
    name: 'Zirbelnuss Wappen Edition',
    category: 'Tradition',
    format: '9,0 cm Rund-Aufkleber',
    finish: 'Chrom- & Glanzfolie',
    badgeText: 'FUGGERSTADT',
    subText: 'ROT • GRÜN • WEISS',
    style: 'round',
    guidePrice: 7,
    packSize: 25,
    negotiable: true,
    inStock: true,
    description:
      'Runder Traditions-Sticker mit stilisierter Augsburger Zirbelnuss und umlaufendem Schriftzug in Vereinsfarben.'
  },
  {
    id: 'nordwand-support',
    name: 'Nordwand & Kurven-Echo',
    category: 'Kurve & Stadt',
    format: '14,8 × 5,2 cm (Streifen-Sticker)',
    finish: 'Outdoor-Vinyl (90µ) geschlitzt',
    badgeText: 'NORDWAND AUX',
    subText: '90 MINUTEN VOLLGAS FÜR ROT-GRÜN-WEISS',
    style: 'banner',
    guidePrice: 6,
    packSize: 25,
    negotiable: true,
    inStock: true,
    description:
      'Breiter Schal-Streifen-Sticker mit geschlitzter Rückseite zum schnellen Abziehen – perfekt für Stadionbesuche und Auswärtsfahrten.'
  },
  {
    id: 'auswaerts-schwaben',
    name: 'Auswärts-Express Schwaben',
    category: 'Auswärtsfahrt',
    format: '10,5 × 7,4 cm (DIN A7 Hoch)',
    finish: 'Hochglanz UV-beständig',
    badgeText: 'ALLEZ FCA',
    subText: 'AUSWÄRTS DABEI • KILOMETERFRESSER',
    style: 'shield',
    guidePrice: 5,
    packSize: 25,
    negotiable: true,
    inStock: true,
    description:
      'Gewidmet allen Auswärtsfahrern aus Augsburg und ganz Bayerisch-Schwaben. Kräftige Farben und abgerundete Ecken.'
  },
  {
    id: 'kasperl-street-aux',
    name: 'AUX Street-Tag Holo',
    category: 'Sonderedition',
    format: '8,5 × 5,5 cm (Scheckkarten-Format)',
    finish: 'Holografischer Regenbogen-Effekt',
    badgeText: 'NUR DER FCA',
    subText: 'AUX STREET EDITION • LIMITIERT',
    style: 'holo',
    guidePrice: 8,
    packSize: 20,
    negotiable: true,
    inStock: true,
    description:
      'Limitierte Holo-Sonderauflage mit schimmerndem Lichteffekt bei Sonneneinstrahlung und Flutlicht.'
  }
];

export const BUNDLE_DEALS = [
  {
    id: 'bundle-50',
    title: '50er Einsteiger-Mix',
    count: 50,
    guidePrice: '8 € VB',
    numericGuide: 8,
    badge: 'Beliebt zum Testen',
    details: 'Bunter Mix aus allen aktuellen Augsburg- & FCA-Motiven (je ca. 8–10 Stück pro Design).'
  },
  {
    id: 'bundle-100',
    title: '100er Kurven-Paket',
    count: 100,
    guidePrice: '14 € VB',
    numericGuide: 14,
    badge: 'Preis-Leistungs-Tipp',
    details: '100 wetterfeste Vinyl-Sticker gemischt inklusive Sondereditionen. Preis verhandelbar!'
  },
  {
    id: 'bundle-250',
    title: '250er Szene- & Auswärts-Box',
    count: 250,
    guidePrice: '29 € VB',
    numericGuide: 29,
    badge: 'Mengenrabatt (VB)',
    details: 'Großpaket für Freundeskreise, Fanclubs und Auswärtsfahrten. Starker Mengenrabatt auf Verhandlungsbasis.'
  }
];

export const PICKUP_DEPOTS = [
  {
    id: 'arena',
    name: 'Arena Augsburg (Heimspieltag)',
    area: 'Bürgermeister-Ulrich-Straße / Vorplatz',
    timing: 'Ab 2 Stunden vor Anpfiff bei jedem FCA-Heimspiel',
    shippingCost: '0 € (Direktübergabe)'
  },
  {
    id: 'koenigsplatz',
    name: 'Augsburg Königsplatz / Innenstadt',
    area: 'Zentrum (86150 Augsburg)',
    timing: 'Werktags & am Wochenende flexibel nach kurzer Absprache',
    shippingCost: '0 € (Abholung)'
  },
  {
    id: 'hbf',
    name: 'Augsburg Hauptbahnhof',
    area: 'Vorplatz / Gleiszugang',
    timing: 'Ideal vor Zug-Auswärtsfahrten oder für Pendler aus dem Umland',
    shippingCost: '0 € (Treffpunkt)'
  },
  {
    id: 'versand',
    name: 'Postversand (Deutschlandweit)',
    area: 'Knicksicherer Brief- oder Großbrief-Umschlag',
    timing: 'Versand innerhalb von 24h nach Einigung',
    shippingCost: 'ab 1,60 € (oder inklusive bei größeren VB-Paketen)'
  }
];
