import { LucideIcon } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface IndustryFeature {
    icon: string // Changed from LucideIcon to string
    title: string
    desc: string
}

export interface IndustryTestimonial {
    name: string
    role: string
    text: string
}

export interface IndustryPainPoint {
    title: string
    desc: string
}

export interface DashboardStat {
    label: string
    value: string
}

export interface DashboardProject {
    name: string
    status: string
    color: string
}

export interface IndustryConfig {
    slug: string
    name: string
    heroTag: string
    heroTitle: string
    heroHighlight: string
    heroDesc: string
    painPoints: IndustryPainPoint[]
    features: IndustryFeature[]
    dashboardStats: DashboardStat[]
    dashboardProjects: DashboardProject[]
    testimonial: IndustryTestimonial
    metaTitle: string
    metaDescription: string
}


// ============================================================================
// Umzugsunternehmen (Moving Companies)
// ============================================================================

export const umzugsunternehmen: IndustryConfig = {
    slug: 'fuer-umzugsunternehmen',
    name: 'Umzugsunternehmen',
    heroTag: 'Für Umzugsunternehmen',
    heroTitle: 'Umzüge planen.',
    heroHighlight: 'Nicht improvisieren.',
    heroDesc: 'Abnahmeprotokolle, Fahrzeugplanung und Zeiterfassung — alles in einem System. Damit Ihr Team weiß, wo es hinmuss, bevor der LKW losfährt.',
    painPoints: [
        { title: 'Zettelwirtschaft bei Abnahmen', desc: 'Kundenunterschriften auf Papier, fehlende Fotos, verlorene Protokolle — Reklamationen sind vorprogrammiert.' },
        { title: 'Chaotische Morgenplanung', desc: 'Wer fährt welchen LKW? Welches Team übernimmt welchen Auftrag? Jeden Morgen das gleiche Chaos.' },
        { title: 'Zeiterfassung auf Vertrauensbasis', desc: 'Ohne digitale Stempeluhr weiß niemand genau, wann Arbeitszeiten angefangen und aufgehört haben.' },
    ],
    features: [
        { icon: 'ClipboardCheck', title: 'Digitale Abnahmen', desc: 'Kundenunterschrift, Fotos und Schadensdokumentation direkt auf dem Tablet.' },
        { icon: 'Truck', title: 'Fahrzeugplanung', desc: 'TÜV-Termine, Kilometerstand und Verfügbarkeit Ihrer LKW-Flotte im Blick.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'GPS-basierte Stempeluhr. Arbeitszeiten, Pausen und Fahrzeiten lückenlos erfasst.' },
        { icon: 'Users', title: 'Teamplanung', desc: 'Morgenplanung mit Drag-and-Drop: Teams, Fahrzeuge und Aufträge zuweisen.' },
        { icon: 'MapPin', title: 'Routenplanung', desc: 'Auftragsadressen im Überblick. Optimierte Reihenfolge für weniger Leerfahrten.' },
        { icon: 'BarChart3', title: 'Nachkalkulation', desc: 'Soll vs. Ist pro Umzug: Stunden, Material und Fahrzeugkosten transparent.' },
    ],
    dashboardStats: [
        { label: 'Umzüge diese Woche', value: '12' },
        { label: 'Teams unterwegs', value: '5' },
        { label: 'Auslastung', value: '91%' },
    ],
    dashboardProjects: [
        { name: 'Umzug Müller — Charlottenburg → Mitte', status: 'In Bearbeitung', color: 'bg-orange-500' },
        { name: 'Firmenumzug TechStartup GmbH', status: 'Morgen geplant', color: 'bg-blue-400' },
        { name: 'Umzug Schmidt — Büro-Entrümpelung', status: 'Abnahme offen', color: 'bg-amber-500' },
    ],
    testimonial: {
        name: 'Thomas M.',
        role: 'Geschäftsführer, Umzüge Berlin',
        text: 'Seit wir Ars Mechanica nutzen, haben wir 40% weniger Verwaltungsaufwand. Die Morgenplanung allein spart uns jeden Tag eine Stunde.',
    },
    metaTitle: 'Umzugssoftware — Planung, Abnahmen & Zeiterfassung | Ars Mechanica',
    metaDescription: 'Die All-in-One Software für Umzugsunternehmen. Digitale Abnahmen, Fahrzeugplanung, Zeiterfassung und Nachkalkulation. Jetzt 7 Tage kostenlos testen.',
}


// ============================================================================
// Maler (Painters)
// ============================================================================

export const maler: IndustryConfig = {
    slug: 'fuer-maler',
    name: 'Malerbetriebe',
    heroTag: 'Für Malerbetriebe',
    heroTitle: 'Projekte streichen.',
    heroHighlight: 'Nicht Ihre Nerven.',
    heroDesc: 'Materialverbrauch kalkulieren, Aufmaße dokumentieren und Ihre Marge im Blick behalten — in einer Software, die Maler verstehen.',
    painPoints: [
        { title: 'Materialverschwendung', desc: 'Ohne genaue Kalkulation wird zu viel bestellt. Reste stapeln sich im Lager und kosten bares Geld.' },
        { title: 'Kalkulation per Bauchgefühl', desc: 'Angebote werden nach Erfahrung geschätzt. Ob ein Projekt profitabel war, zeigt sich erst Monate später.' },
        { title: 'Zeitnachweise fehlen', desc: 'Auftraggeber fragen nach Stundenaufstellungen — die von Hand zusammengesucht werden müssen.' },
    ],
    features: [
        { icon: 'PaintBucket', title: 'Materialverwaltung', desc: 'Farben, Spachtelmasse und Zubehör. Verbrauch direkt auf Projekte buchen.' },
        { icon: 'Calculator', title: 'Nachkalkulation', desc: 'Soll- vs. Ist-Kosten pro Projekt. Materialverbrauch, Stunden und Fahrtkosten.' },
        { icon: 'Camera', title: 'Fotodokumentation', desc: 'Vorher-Nachher-Fotos direkt im Projekt. Dokumentation für Auftraggeber und Versicherung.' },
        { icon: 'FileText', title: 'Digitale Protokolle', desc: 'Abnahmen mit Kundenunterschrift. Mängelberichte per PDF versenden.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Digitale Stempeluhr pro Projekt. Arbeitszeitnachweise auf Knopfdruck.' },
        { icon: 'BarChart3', title: 'Auswertungen', desc: 'Welche Projekte sind profitabel? Wo verlieren Sie Geld? Daten statt Bauchgefühl.' },
    ],
    dashboardStats: [
        { label: 'Laufende Projekte', value: '8' },
        { label: 'Stunden diese Woche', value: '186h' },
        { label: 'Ø-Marge', value: '24%' },
    ],
    dashboardProjects: [
        { name: 'Fassade Mehrfamilienhaus — Steglitz', status: 'In Bearbeitung', color: 'bg-orange-500' },
        { name: 'Innenanstrich Büro — Friedrichshain', status: 'Material bestellt', color: 'bg-blue-400' },
        { name: 'Tapezierarbeiten Villa — Zehlendorf', status: 'Abnahme heute', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Andreas L.',
        role: 'Inhaber, Malerbetrieb Lenz',
        text: 'Die Nachkalkulation hat mir die Augen geöffnet. Wir haben unsere Marge um 18% verbessert, weil wir endlich sehen, wo die Kosten entstehen.',
    },
    metaTitle: 'Maler-Software — Kalkulation, Material & Zeiterfassung | Ars Mechanica',
    metaDescription: 'Software speziell für Malerbetriebe. Materialverwaltung, Nachkalkulation und digitale Abnahmen. Steigern Sie Ihre Marge. 7 Tage kostenlos testen.',
}


// ============================================================================
// Gerüstbauer (Scaffolders)
// ============================================================================

export const geruestbauer: IndustryConfig = {
    slug: 'fuer-geruestbauer',
    name: 'Gerüstbauunternehmen',
    heroTag: 'Für Gerüstbauer',
    heroTitle: 'Sicher bauen.',
    heroHighlight: 'Digital planen.',
    heroDesc: 'Prüfprotokolle, Standzeiten und Personalplanung für Gerüstbauunternehmen — damit Sie sich auf die Baustelle konzentrieren können, nicht auf den Papierkram.',
    painPoints: [
        { title: 'Prüfpflichten im Griff?', desc: 'Gerüste müssen regelmäßig geprüft werden. Ohne System gehen Fristen unter — mit rechtlichen Konsequenzen.' },
        { title: 'Standzeiten nicht transparent', desc: 'Wie lange steht das Gerüst schon? Welche Kosten laufen auf? Mietberechnungen werden zum Ratespiel.' },
        { title: 'Mannstärke schwer planbar', desc: 'Für jeden Aufbau brauchen Sie das richtige Team mit der richtigen Qualifikation. Planung auf Zuruf funktioniert nicht.' },
    ],
    features: [
        { icon: 'Shield', title: 'Prüfprotokolle', desc: 'Digitale Sicherheitsprüfungen nach TRBS. Fristen, Ergebnisse und Fotos dokumentiert.' },
        { icon: 'Ruler', title: 'Standzeit-Tracking', desc: 'Auf- und Abbaudatum pro Gerüst. Automatische Berechnung der Standzeit und Mietkosten.' },
        { icon: 'HardHat', title: 'Personalplanung', desc: 'Qualifikationen, Verfügbarkeiten und Einsatzplanung für Ihre Kolonne.' },
        { icon: 'CalendarDays', title: 'Morgenplanung', desc: 'Tagesplan für alle Teams: Welche Baustelle, welches Material, welcher LKW.' },
        { icon: 'AlertTriangle', title: 'Mängelmanagement', desc: 'Festgestellte Mängel dokumentieren, zuweisen und nachverfolgen — bis zur Behebung.' },
        { icon: 'Wrench', title: 'Fahrzeuge & Geräte', desc: 'TÜV, Prüffristen und Wartung für Fahrzeuge, Anhänger und Materialcontainer.' },
    ],
    dashboardStats: [
        { label: 'Aktive Baustellen', value: '15' },
        { label: 'Gerüste aufgebaut', value: '23' },
        { label: 'Prüfungen fällig', value: '3' },
    ],
    dashboardProjects: [
        { name: 'Fassadengerüst Neubau — Prenzlauer Berg', status: 'Aufbau morgen', color: 'bg-blue-400' },
        { name: 'Dachfanggerüst Altbau — Kreuzberg', status: 'Prüfung fällig', color: 'bg-amber-500' },
        { name: 'Innengerüst Kirche — Spandau', status: 'Abbau geplant', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Frank B.',
        role: 'Geschäftsführer, Gerüstbau Berlin-Süd',
        text: 'Die Prüfprotokolle und Standzeit-Berechnung sparen uns jede Woche mehrere Stunden Büroarbeit. Endlich haben wir den Überblick.',
    },
    metaTitle: 'Gerüstbau-Software — Prüfprotokolle, Standzeiten & Planung | Ars Mechanica',
    metaDescription: 'Software für Gerüstbauunternehmen. Digitale Prüfprotokolle, Standzeit-Tracking und Personalplanung. TRBS-konform. 7 Tage kostenlos testen.',
}


// ============================================================================
// Sanitär & Heizung (Plumbing & Heating)
// ============================================================================

export const sanitaerHeizung: IndustryConfig = {
    slug: 'fuer-sanitaer-heizung',
    name: 'Sanitär- & Heizungsbetriebe',
    heroTag: 'Für Sanitär & Heizung',
    heroTitle: 'Aufträge im Fluss.',
    heroHighlight: 'Nicht im Chaos.',
    heroDesc: 'Wartungspläne, Materialverbrauch und Kundentermine — damit Ihre Monteure wissen, was sie erwartet, bevor sie losfahren.',
    painPoints: [
        { title: 'Wartungstermine vergessen', desc: 'Heizungswartungen, Prüffristen und Rückrufe gehen ohne System im Alltag unter. Kunden beschweren sich.' },
        { title: 'Material fehlt auf der Baustelle', desc: 'Der Monteur steht beim Kunden und das richtige Fitting ist nicht dabei. Zweite Anfahrt kostet Zeit und Geld.' },
        { title: 'Stundenzettel im Handschuhfach', desc: 'Arbeitszeiten werden am Ende der Woche aus dem Gedächtnis rekonstruiert. Abrechnungen sind ungenau.' },
    ],
    features: [
        { icon: 'Droplets', title: 'Auftragsmanagement', desc: 'Störungsmeldungen, Wartungen und Neuinstallationen in einem System verwalten.' },
        { icon: 'Thermometer', title: 'Wartungsplanung', desc: 'Wiederkehrende Wartungstermine automatisch planen. Kunden rechtzeitig erinnern.' },
        { icon: 'Package', title: 'Materialverwaltung', desc: 'Fittings, Rohre und Ersatzteile. Verbrauch pro Auftrag erfassen und nachbestellen.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Digitale Stempeluhr mit Projektzuordnung. Fahrzeiten und Arbeitszeiten getrennt.' },
        { icon: 'Camera', title: 'Fotodokumentation', desc: 'Vorher-Nachher-Fotos, Rohrleitungspläne und Mängelbilder direkt im Auftrag.' },
        { icon: 'BarChart3', title: 'Nachkalkulation', desc: 'Was hat der Auftrag wirklich gekostet? Material, Stunden und Fahrtkosten im Vergleich.' },
    ],
    dashboardStats: [
        { label: 'Offene Aufträge', value: '17' },
        { label: 'Wartungen fällig', value: '6' },
        { label: 'Monteure aktiv', value: '8' },
    ],
    dashboardProjects: [
        { name: 'Heizungswartung Wohnanlage — Schöneberg', status: 'Heute geplant', color: 'bg-orange-500' },
        { name: 'Rohrbruch Notdienst — Neukölln', status: 'In Bearbeitung', color: 'bg-red-500' },
        { name: 'Bad-Sanierung Familie Weber — Mitte', status: 'Material bestellt', color: 'bg-blue-400' },
    ],
    testimonial: {
        name: 'Sandra K.',
        role: 'Büroleiterin, Sanitär Schmidt',
        text: 'Endlich eine Software, die für Handwerker gemacht ist. Unsere Monteure kamen sofort damit klar — und vergessen keine Wartungstermine mehr.',
    },
    metaTitle: 'Sanitär-Software — Wartung, Aufträge & Zeiterfassung | Ars Mechanica',
    metaDescription: 'Software für Sanitär- und Heizungsbetriebe. Wartungsplanung, Materialverwaltung und digitale Zeiterfassung. 7 Tage kostenlos testen.',
}


// ============================================================================
// Elektrobetriebe (Electrical Contractors)
// ============================================================================

export const elektrobetriebe: IndustryConfig = {
    slug: 'fuer-elektrobetriebe',
    name: 'Elektrobetriebe',
    heroTag: 'Für Elektrobetriebe',
    heroTitle: 'Spannung im Griff.',
    heroHighlight: 'Ordnung im Büro.',
    heroDesc: 'E-Checks, Prüfprotokolle und Materialverwaltung für Elektrobetriebe — digital, rechtssicher und ohne Papierstapel.',
    painPoints: [
        { title: 'Prüfprotokolle auf Papier', desc: 'E-Checks und VDE-Prüfungen werden handschriftlich dokumentiert. Ablage, Suche und Nachweise kosten Zeit.' },
        { title: 'Fehlende Materialübersicht', desc: 'Kabel, Sicherungen und Schalter liegen im Lager — aber welche Bestände sind aktuell? Keiner weiß es genau.' },
        { title: 'Angebotskalkulation zu aufwendig', desc: 'Jedes Angebot wird manuell kalkuliert. Erfahrungswerte aus alten Projekten sind nicht greifbar.' },
    ],
    features: [
        { icon: 'Zap', title: 'E-Check Protokolle', desc: 'Digitale Prüfberichte nach VDE. Messwerte, Fotos und Ergebnisse strukturiert erfasst.' },
        { icon: 'CircuitBoard', title: 'Prüffristen', desc: 'DGUV V3, E-Checks und Wiederholungsprüfungen im Blick. Automatische Fristüberwachung.' },
        { icon: 'Package', title: 'Materialverwaltung', desc: 'Kabel, Dosen, Sicherungen — Bestände führen und Verbrauch auf Projekte buchen.' },
        { icon: 'Calculator', title: 'Nachkalkulation', desc: 'Projekt-Profitabilität auswerten. Material, Stunden und Fahrtkosten im Überblick.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Digitale Stempeluhr pro Auftrag. Arbeitszeitnachweise per Knopfdruck exportieren.' },
        { icon: 'FileText', title: 'Dokumentation', desc: 'Schaltpläne, Messprotokolle und Abnahmen zentral ablegen und wiederfinden.' },
    ],
    dashboardStats: [
        { label: 'Aktive Projekte', value: '11' },
        { label: 'Prüfungen diese Woche', value: '9' },
        { label: 'Ø-Auslastung', value: '87%' },
    ],
    dashboardProjects: [
        { name: 'E-Check Bürogebäude — Mitte', status: 'In Bearbeitung', color: 'bg-orange-500' },
        { name: 'Neuinstallation Kita — Tempelhof', status: 'Material bestellt', color: 'bg-blue-400' },
        { name: 'DGUV V3 Prüfung — Industriepark', status: 'Morgen geplant', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Michael R.',
        role: 'Inhaber, Elektro Richter',
        text: 'Die Auswertungen zeigen mir genau, welche Projekte profitabel sind. Das hat unsere Marge um 15% verbessert.',
    },
    metaTitle: 'Elektro-Software — E-Check, Prüfprotokolle & Material | Ars Mechanica',
    metaDescription: 'Software für Elektrobetriebe. Digitale E-Checks, VDE-Prüfprotokolle und Materialverwaltung. Rechtssicher dokumentieren. 7 Tage kostenlos testen.',
}


// ============================================================================
// Krankentransport (Medical Transport)
// ============================================================================

export const krankentransport: IndustryConfig = {
    slug: 'fuer-krankentransport',
    name: 'Krankentransportunternehmen',
    heroTag: 'Für Krankentransport',
    heroTitle: 'Menschen bewegen.',
    heroHighlight: 'Sicher disponieren.',
    heroDesc: 'Fahrzeugdisposition, Personalplanung und lückenlose Dokumentation — damit Ihre Einsätze reibungslos laufen.',
    painPoints: [
        { title: 'Disposition ist Kopfsache', desc: 'Wer fährt welches Fahrzeug? Welcher Sanitäter hat welche Qualifikation? Ohne System wird disponiert nach Gefühl.' },
        { title: 'Dokumentation unter Zeitdruck', desc: 'Transportprotokolle müssen vollständig sein — aber im Einsatzalltag bleibt kaum Zeit für saubere Dokumentation.' },
        { title: 'Fahrzeugverfügbarkeit unklar', desc: 'TÜV, Desinfektion, Wartung — ohne Übersicht stehen Fahrzeuge still, wenn sie gebraucht werden.' },
    ],
    features: [
        { icon: 'Stethoscope', title: 'Einsatzplanung', desc: 'Transporte disponieren, Personal zuweisen und Fahrzeuge koordinieren — alles in einem System.' },
        { icon: 'Users', title: 'Personalplanung', desc: 'Qualifikationen (RS, RA, NotSan), Verfügbarkeiten und Schichtpläne verwalten.' },
        { icon: 'Truck', title: 'Fuhrparkmanagement', desc: 'TÜV, Desinfektion, MPG-Prüfungen und Wartung. Alle Fristen im Blick.' },
        { icon: 'Navigation', title: 'Tourenplanung', desc: 'Optimierte Reihenfolge für Transportfahrten. Weniger Leerkilometer, mehr Effizienz.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Schichtzeiten, Bereitschaftsdienste und Pausen lückenlos und rechtssicher erfassen.' },
        { icon: 'FileText', title: 'Transportprotokolle', desc: 'Digitale Dokumentation jedes Transports. Patientendaten, Übergaben und Besonderheiten.' },
    ],
    dashboardStats: [
        { label: 'Transporte heute', value: '34' },
        { label: 'Fahrzeuge aktiv', value: '12' },
        { label: 'Personal im Dienst', value: '28' },
    ],
    dashboardProjects: [
        { name: 'Dialysefahrt Meier — Charité → Zuhause', status: 'Unterwegs', color: 'bg-orange-500' },
        { name: 'Verlegung Station 4 — Vivantes', status: 'Heute 14:00', color: 'bg-blue-400' },
        { name: 'Entlassung Weber — Klinikum Mitte', status: 'Disponiert', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Markus H.',
        role: 'Dispositionsleiter, MedTrans Berlin',
        text: 'Die Einsatzplanung hat unsere Disposition komplett verändert. Wir disponieren jetzt in Minuten statt in Stunden — und machen deutlich weniger Fehler.',
    },
    metaTitle: 'Krankentransport-Software — Disposition, Fuhrpark & Personal | Ars Mechanica',
    metaDescription: 'Software für Krankentransportunternehmen. Einsatzplanung, Fuhrparkmanagement und Personalplanung. Lückenlose Dokumentation. 7 Tage kostenlos testen.',
}


// ============================================================================
// Reinigungsunternehmen (Cleaning Companies)
// ============================================================================

export const reinigungsunternehmen: IndustryConfig = {
    slug: 'fuer-reinigungsunternehmen',
    name: 'Reinigungsunternehmen',
    heroTag: 'Für Reinigungsunternehmen',
    heroTitle: 'Sauber organisiert.',
    heroHighlight: 'Nicht nur sauber geputzt.',
    heroDesc: 'Objektplanung, Personalsteuerung und Qualitätskontrolle — damit Ihre Teams immer wissen, was wo zu tun ist.',
    painPoints: [
        { title: 'Objektpläne im Kopf', desc: 'Welches Team reinigt welches Objekt? Wie oft? Mit welchen Mitteln? Ohne System weiß das nur der Disponent.' },
        { title: 'Qualität schwer kontrollierbar', desc: 'Reklamationen von Auftraggebern, aber kein Nachweis, wann und wie gereinigt wurde.' },
        { title: 'Hohe Personalfluktuation', desc: 'Neue Mitarbeiter einarbeiten kostet Zeit. Ohne Checklisten und Standards geht Qualität verloren.' },
    ],
    features: [
        { icon: 'Building2', title: 'Objektverwaltung', desc: 'Alle Reinigungsobjekte mit Plänen, Intervallen und Sonderanforderungen zentral verwalten.' },
        { icon: 'ListChecks', title: 'Checklisten', desc: 'Standardisierte Reinigungspläne pro Objekt. Teams arbeiten strukturiert und dokumentiert.' },
        { icon: 'SprayCan', title: 'Materialplanung', desc: 'Reinigungsmittel und Verbrauchsmaterial pro Objekt planen und nachbestellen.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Digitale Stempeluhr pro Objekt. Nachweisbare Anwesenheitszeiten für Auftraggeber.' },
        { icon: 'Camera', title: 'Qualitätskontrolle', desc: 'Foto-Dokumentation vor und nach der Reinigung. Mängel erfassen und nachverfolgen.' },
        { icon: 'Users', title: 'Personalplanung', desc: 'Schichtpläne, Vertretungen und Einarbeitung neuer Mitarbeiter strukturiert organisieren.' },
    ],
    dashboardStats: [
        { label: 'Aktive Objekte', value: '42' },
        { label: 'Teams im Einsatz', value: '15' },
        { label: 'Reinigungen heute', value: '38' },
    ],
    dashboardProjects: [
        { name: 'Büroreinigung TechPark — Adlershof', status: 'Im Einsatz', color: 'bg-orange-500' },
        { name: 'Grundreinigung Schule — Pankow', status: 'Morgen geplant', color: 'bg-blue-400' },
        { name: 'Fensterreinigung Ärztehaus — Mitte', status: 'Abgeschlossen', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Elif Y.',
        role: 'Geschäftsführerin, CleanPro Berlin',
        text: 'Seit wir Ars Mechanica einsetzen, haben wir 60% weniger Reklamationen. Die Checklisten und Foto-Doku geben unseren Kunden Sicherheit.',
    },
    metaTitle: 'Reinigungssoftware — Objektplanung, Personal & Qualität | Ars Mechanica',
    metaDescription: 'Software für Reinigungsunternehmen. Objektverwaltung, Checklisten und Qualitätskontrolle. Weniger Reklamationen, mehr Effizienz. 7 Tage kostenlos testen.',
}


// ============================================================================
// Gas & Wasser (Gas & Water Installers)
// ============================================================================

export const gasWasser: IndustryConfig = {
    slug: 'fuer-gas-wasser',
    name: 'Gas- & Wasserinstallationsbetriebe',
    heroTag: 'Für Gas & Wasser',
    heroTitle: 'Leitungen legen.',
    heroHighlight: 'Prozesse lenken.',
    heroDesc: 'Prüfprotokolle, Materialverwaltung und Kundentermine für Gas- und Wasserinstallateure — damit nichts mehr durchs Raster fällt.',
    painPoints: [
        { title: 'Prüfpflichten ohne System', desc: 'Gasgeräteprüfungen, Dichtheitsprüfungen und Wartungsfristen werden auf handschriftlichen Listen geführt — bis etwas vergessen wird.' },
        { title: 'Material auf Zuruf bestellt', desc: 'Rohre, Fittings und Armaturen fehlen regelmäßig. Nachbestellungen kosten doppelte Anfahrten.' },
        { title: 'Dokumentation kostet Feierabend', desc: 'Prüfberichte und Arbeitszeiten werden abends im Büro nachgetragen — auf Kosten der Freizeit.' },
    ],
    features: [
        { icon: 'Flame', title: 'Gasprüfprotokolle', desc: 'Digitale Dichtheitsprüfungen und Gasgeräteprüfungen. Rechtssicher dokumentiert mit Messwerten und Fotos.' },
        { icon: 'Droplets', title: 'Wassertechnik', desc: 'Trinkwasserproben, Legionellenprüfungen und Rohrnetzpläne zentral verwalten.' },
        { icon: 'Package', title: 'Materialverwaltung', desc: 'Rohre, Armaturen und Fittings. Bestände führen und Verbrauch pro Auftrag buchen.' },
        { icon: 'Thermometer', title: 'Wartungsplanung', desc: 'Wiederkehrende Prüffristen automatisch planen. Kunden rechtzeitig erinnern.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Digitale Stempeluhr mit Auftragszuordnung. Fahrzeiten und Arbeitszeiten sauber getrennt.' },
        { icon: 'BarChart3', title: 'Nachkalkulation', desc: 'Auftragskosten auswerten: Material, Stunden, Fahrtkosten. Profitabilität auf einen Blick.' },
    ],
    dashboardStats: [
        { label: 'Offene Aufträge', value: '13' },
        { label: 'Prüfungen fällig', value: '5' },
        { label: 'Monteure aktiv', value: '7' },
    ],
    dashboardProjects: [
        { name: 'Gasgeräteprüfung Wohnanlage — Tempelhof', status: 'Heute geplant', color: 'bg-orange-500' },
        { name: 'Trinkwasserinstallation Neubau — Marzahn', status: 'In Bearbeitung', color: 'bg-blue-400' },
        { name: 'Dichtheitsprüfung Gewerbe — Spandau', status: 'Abgeschlossen', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Jürgen S.',
        role: 'Inhaber, Gas & Wasser Schröder',
        text: 'Prüfprotokolle direkt beim Kunden ausfüllen, unterschreiben lassen und als PDF versenden — das hat unseren Alltag komplett verändert.',
    },
    metaTitle: 'Gas-Wasser-Software — Prüfprotokolle, Material & Zeiterfassung | Ars Mechanica',
    metaDescription: 'Software für Gas- und Wasserinstallateure. Digitale Gasprüfprotokolle, Materialverwaltung und Wartungsplanung. 7 Tage kostenlos testen.',
}


// ============================================================================
// Weitere Gewerke (Other Trades — General)
// ============================================================================

export const weitereGewerke: IndustryConfig = {
    slug: 'fuer-handwerksbetriebe',
    name: 'Handwerksbetriebe',
    heroTag: 'Für alle Gewerke',
    heroTitle: 'Ihr Gewerk.',
    heroHighlight: 'Unsere Software.',
    heroDesc: 'Egal ob Dachdecker, Schreiner, Gartenbauer oder Fliesenleger — Ars Mechanica passt sich flexibel an Ihren Betrieb an.',
    painPoints: [
        { title: 'Keine branchenspezifische Software', desc: 'Die meisten Tools sind zu generisch oder zu teuer. Am Ende landen doch alle wieder bei Excel und Papier.' },
        { title: 'Insellösungen überall', desc: 'Zeiterfassung hier, Materialverwaltung da, Projektplanung woanders. Nichts ist verbunden.' },
        { title: 'Digitalisierung fühlt sich kompliziert an', desc: 'Zu viele Funktionen, zu wenig Relevanz für den Alltag. Mitarbeiter nutzen das Tool nicht.' },
    ],
    features: [
        { icon: 'FileText', title: 'Projektmanagement', desc: 'Alle Kundenprojekte verwalten. Status, Termine und Dokumente an einem Ort.' },
        { icon: 'Clock', title: 'Zeiterfassung', desc: 'Digitale Stempeluhr mit Projektzuordnung. Arbeitszeiten und Pausen erfassen.' },
        { icon: 'CalendarDays', title: 'Morgenplanung', desc: 'Tagesplanung für Teams, Fahrzeuge und Aufträge. Per Drag-and-Drop.' },
        { icon: 'Package', title: 'Materialverwaltung', desc: 'Bestände führen, Verbrauch auf Projekte buchen, Nachbestellungen planen.' },
        { icon: 'CheckSquare', title: 'Abnahmen & Protokolle', desc: 'Digitale Abnahmen mit Foto, Checkliste und Kundenunterschrift.' },
        { icon: 'BarChart3', title: 'Auswertungen', desc: 'Nachkalkulation, Produktivitätsanalysen und Berichte auf Knopfdruck.' },
    ],
    dashboardStats: [
        { label: 'Laufende Projekte', value: '14' },
        { label: 'Mitarbeiter aktiv', value: '9' },
        { label: 'Stunden diese Woche', value: '312h' },
    ],
    dashboardProjects: [
        { name: 'Terrassenbelag Familie Schulz — Dahlem', status: 'In Bearbeitung', color: 'bg-orange-500' },
        { name: 'Dachsanierung Altbau — Charlottenburg', status: 'Material bestellt', color: 'bg-blue-400' },
        { name: 'Gartengestaltung Neubau — Potsdam', status: 'Abnahme morgen', color: 'bg-emerald-500' },
    ],
    testimonial: {
        name: 'Petra W.',
        role: 'Planerin, Tischlerei Weber',
        text: 'Materialverwaltung und Zeiterfassung in einer App — nie wieder Excel-Listen. Unsere Werkstatt ist endlich digital.',
    },
    metaTitle: 'Handwerker-Software — Projekte, Zeit & Material | Ars Mechanica',
    metaDescription: 'Die All-in-One Software für Handwerksbetriebe. Projektmanagement, Zeiterfassung und Materialverwaltung. Für jedes Gewerk. 7 Tage kostenlos testen.',
}


// ============================================================================
// All industries (for iteration / lookup)
// ============================================================================

export const allIndustries: IndustryConfig[] = [
    umzugsunternehmen,
    maler,
    geruestbauer,
    sanitaerHeizung,
    elektrobetriebe,
    krankentransport,
    reinigungsunternehmen,
    gasWasser,
    weitereGewerke,
]

export function getIndustryBySlug(slug: string): IndustryConfig | undefined {
    return allIndustries.find(i => i.slug === slug)
}
