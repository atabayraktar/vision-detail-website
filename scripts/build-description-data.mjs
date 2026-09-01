// Re-runnable: reads the real ÜRÜN AÇIKLAMASI column (J) from .claude/product-list.xlsx
// and pairs it with hand-translated EN/DE text (grouped by identical TR source — many SKUs
// across size/color variants share one paragraph) into scripts/description-data.json, which
// build-products.mjs reads for each product's description. Re-run this whenever the Excel's
// column J text changes; if a NEW unique paragraph shows up, add its translation to
// TRANSLATIONS below (the script will error out naming exactly which SKU is missing one).
import xlsx from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const wb = xlsx.readFile(path.join(ROOT, '.claude', 'product-list.xlsx'));
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// column C = ÜRÜN KODU, column J = ÜRÜN AÇIKLAMASI (0-indexed: 2 and 9).
const descsTr = {};
for (let r = 1; r < rows.length; r++) {
  const sku = String(rows[r][2] || '').trim();
  if (!sku) continue;
  descsTr[sku] = String(rows[r][9] || '').replace(/\r\n/g, '\n').trim();
}

// Keyed by one representative SKU per unique TR paragraph.
const TRANSLATIONS = {
  'cw-mag': {
    en: 'Clean hard-to-reach areas instantly! Our air gun delivers outstanding results with a powerful airflow and ergonomic design — fast, effective and flexible.',
    de: 'Reinigen Sie schwer zugängliche Stellen im Handumdrehen! Unsere Luftpistole liefert dank starkem Luftstrom und ergonomischem Design hervorragende Ergebnisse – schnell, effektiv und flexibel.',
  },
  'cw-evo-mini': {
    en: 'The EVO Mini offers effective, controlled work across different applications with a choice of 3 mm or 12 mm throw.\n\nWith 30 mm, 38 mm and 50 mm backing plates, you can comfortably work tight, hard-to-reach areas on the paint surface. Despite its compact build and high power, it delivers low-vibration, balanced operation across a 2,000–5,000 RPM range.\n\nThe machine’s power level can be adjusted across 6 stages via the control unit, with the selected stage easy to track on the LED display.',
    de: 'Der EVO Mini bietet dank wählbarem Hub von 3 mm oder 12 mm effektives, kontrolliertes Arbeiten bei unterschiedlichsten Anwendungen.\n\nMit Stütztellern in 30 mm, 38 mm und 50 mm erreichen Sie mühelos enge und schwer zugängliche Bereiche auf der Lackoberfläche. Trotz kompakter Bauweise und hoher Leistung sorgt er im Drehzahlbereich von 2.000–5.000 U/min für vibrationsarmes, ausgewogenes Arbeiten.\n\nDie Leistungsstufe der Maschine lässt sich über die Bedieneinheit in 6 Stufen einstellen; die gewählte Stufe ist bequem am LED-Display ablesbar.',
  },
  'cw-evo-mini-pro': {
    en: 'Maximum control for precise work in tight spaces.\n\nThe EVO Mini Pro combines 3 mm and 12 mm throw options, a rotation function, a quick-connect system, LED-illuminated adapters and a central display in one compact unit — a professional solution built for detailed, precision polishing work.',
    de: 'Maximale Kontrolle für präzises Arbeiten auf engstem Raum.\n\nDer EVO Mini Pro vereint wählbaren Hub von 3 mm und 12 mm, eine Rotationsfunktion, ein Schnellverschlusssystem, LED-beleuchtete Adapter und ein zentrales Display in einem kompakten Gerät – eine professionelle Lösung für detaillierte, präzise Polierarbeiten.',
  },
  'cw-pp-125-heavy': {
    en: 'A professional polishing pad with high cutting power, developed for the first stage of paint correction.\n\nIts firm foam structure and strong cutting performance deliver effective results on deep scratches and heavy surface defects. The optimized material structure maintains balanced polishing performance and efficient heat distribution even under heavy use.',
    de: 'Ein professionelles Polierpad mit hoher Schnittleistung, entwickelt für die erste Stufe der Lackkorrektur.\n\nDie feste Schaumstruktur und die starke Schnittleistung sorgen für wirksame Ergebnisse bei tiefen Kratzern und starken Oberflächenfehlern. Die optimierte Materialstruktur gewährleistet auch bei intensivem Einsatz eine ausgewogene Polierleistung und effiziente Wärmeverteilung.',
  },
  'cw-pp-125-medium': {
    en: 'A professional polishing pad developed for the second stage of polishing, or to refine surface quality after working with firmer pads.\n\nIts medium-density foam structure delivers a balanced performance between cutting power and surface finish. The optimized structure distributes heat evenly across the surface, keeping working temperature stable even during extended use.',
    de: 'Ein professionelles Polierpad für die zweite Polierstufe oder zur Verbesserung der Oberflächenqualität nach der Anwendung härterer Pads.\n\nDie mittelfeste Schaumstruktur bietet eine ausgewogene Balance zwischen Schnittleistung und Oberflächenfinish. Die optimierte Struktur verteilt die Wärme gleichmäßig über die Fläche und hält die Arbeitstemperatur auch bei längerem Einsatz stabil.',
  },
  'cw-pp-125-mf': {
    en: 'A professional microfiber polishing pad with high cutting power, developed for removing heavy surface defects.\n\nIts advanced microfiber structure and optimized foam base deliver effective performance on deep scratches, heavy swirl marks and serious paint defects. Compatible with 125 mm backing plate orbital polishers, it provides balanced results and high control throughout the application.',
    de: 'Ein professionelles Mikrofaser-Polierpad mit hoher Schnittleistung, entwickelt zur Beseitigung starker Oberflächenfehler.\n\nDie fortschrittliche Mikrofaserstruktur und der optimierte Schaumstoffkern sorgen für wirksame Ergebnisse bei tiefen Kratzern, starken Hologrammen und schweren Lackfehlern. Kompatibel mit Exzenterpoliermaschinen mit 125-mm-Stützteller, liefert es während der gesamten Anwendung ausgewogene Ergebnisse und hohe Kontrolle.',
  },
  'cw-pp-125-os': {
    en: 'A professional polishing pad developed to combine cutting and finishing in a single step.\n\nIts specially designed foam structure helps remove light to medium paint defects while delivering a glossy, smooth surface finish. It offers efficient, balanced performance for one-step polishing applications.',
    de: 'Ein professionelles Polierpad, entwickelt um Schnitt und Finish in einem Arbeitsschritt zu vereinen.\n\nDie speziell konzipierte Schaumstruktur hilft, leichte bis mittlere Lackfehler zu beseitigen und sorgt gleichzeitig für ein glänzendes, glattes Oberflächenfinish. Es bietet effiziente, ausgewogene Leistung für einstufige Polituranwendungen.',
  },
  'cw-pp-125-soft': {
    en: 'A professional finishing pad developed for the final stage of polishing.\n\nIts soft, fine-pored foam structure helps remove even the finest polishing marks left on the surface, delivering a deep, vibrant, high-gloss finish. The optimized material structure distributes heat evenly, keeping surface temperature stable even during extended use.',
    de: 'Ein professionelles Finish-Pad für die letzte Polierstufe.\n\nDie weiche, feinporige Schaumstruktur hilft, selbst feinste Polierspuren auf der Oberfläche zu entfernen, und sorgt für ein tiefes, lebendiges Hochglanzfinish. Die optimierte Materialstruktur verteilt die Wärme gleichmäßig und hält die Oberflächentemperatur auch bei längerem Einsatz stabil.',
  },
  'cw-pp-125-wool': {
    en: 'The ChemicalWorkz Natural Wool Pad is a natural wool polishing pad developed for high-precision defect removal on painted surfaces.\n\nIts natural wool structure with high cutting power delivers effective performance on scratches, swirl marks and other paint defects, providing strong, controlled cutting for heavy paint correction work.',
    de: 'Das ChemicalWorkz Natural-Wollpad ist ein Polierpad aus Naturwolle für die hochpräzise Fehlerbeseitigung auf lackierten Oberflächen.\n\nDie Naturwollstruktur mit hoher Schnittleistung sorgt für wirksame Ergebnisse bei Kratzern, Hologrammen und anderen Lackfehlern und bietet starken, kontrollierten Schnitt bei intensiver Lackkorrektur.',
  },
  'cw-pp-75-mf': {
    en: 'A professional microfiber polishing pad with high cutting power, developed for removing heavy paint defects.\n\nIts advanced microfiber technology and optimized foam base deliver strong performance on deep scratches, heavy swirl marks and serious paint defects. Compatible with 125 mm backing plate orbital polishers, it provides balanced results and high control throughout the application.',
    de: 'Ein professionelles Mikrofaser-Polierpad mit hoher Schnittleistung, entwickelt zur Beseitigung starker Lackfehler.\n\nDie fortschrittliche Mikrofasertechnologie und der optimierte Schaumstoffkern sorgen für starke Ergebnisse bei tiefen Kratzern, starken Hologrammen und schweren Lackfehlern. Kompatibel mit Exzenterpoliermaschinen mit 125-mm-Stützteller, liefert es während der gesamten Anwendung ausgewogene Ergebnisse und hohe Kontrolle.',
  },
  'cw-pp-75-gp': {
    en: 'A high-quality felt polishing pad developed for removing defects on glass surfaces.\n\nIts abrasive felt structure delivers effective performance on scratches, swirl marks and other surface defects on glass, enabling controlled, efficient work in glass polishing and surface correction applications.',
    de: 'Ein hochwertiges Filz-Polierpad zur Beseitigung von Fehlern auf Glasoberflächen.\n\nDie abrasive Filzstruktur sorgt für wirksame Ergebnisse bei Kratzern, Hologrammen und anderen Oberflächenfehlern auf Glas und ermöglicht kontrolliertes, effizientes Arbeiten bei der Glaspolitur und Oberflächenkorrektur.',
  },
  'cw-pbk': {
    en: 'The ChemicalWorkz Pad Brush & Knife is a dual-function accessory designed for practical, precise work during polishing.\n\nThe brush end effectively cleans polishing pads, while the knife end helps remove pads from the backing plate in a controlled, easy way — a handy solution that makes the polishing process faster and more efficient.',
    de: 'Die ChemicalWorkz Pad-Bürste & Messer ist ein zweifunktionales Zubehörteil für praktisches, präzises Arbeiten beim Polieren.\n\nDas Bürstenende reinigt Polierpads effektiv, während das Messerende hilft, Pads kontrolliert und einfach vom Stützteller zu lösen – eine praktische Lösung, die den Polierprozess schneller und effizienter macht.',
  },
  'cw-fe': {
    en: 'Developed to remove foil and adhesive residue quickly, precisely and effectively without damaging the paint surface.\n\nIts soft rubber material and toothed surface structure remove residue with strong yet paint-safe action. The included adapter lets it be used easily with a drill or angle grinder.',
    de: 'Entwickelt, um Folien- und Kleberückstände schnell, präzise und wirksam zu entfernen, ohne die Lackoberfläche zu beschädigen.\n\nDas weiche Gummimaterial und die gezahnte Oberflächenstruktur lösen Rückstände kraftvoll, aber lackschonend. Der mitgelieferte Adapter ermöglicht den einfachen Einsatz mit einer Bohrmaschine oder einem Winkelschleifer.',
  },
  'cw-dss-10': {
    en: 'A 10-piece detailing cleaning set with 5 different tip designs, developed for the precise cleaning of tight, hard-to-reach areas.\n\nIt effectively cleans dust and dirt from air vents, emblems and other hard-to-access points. The variety of tip shapes offers practical, controlled use for both interior and exterior detailing work.',
    de: 'Ein 10-teiliges Detailing-Reinigungsset mit 5 verschiedenen Aufsatzformen für die präzise Reinigung enger, schwer zugänglicher Stellen.\n\nEs entfernt effektiv Staub und Schmutz aus Lüftungsschlitzen, Emblemen und anderen schwer erreichbaren Bereichen. Die unterschiedlichen Aufsatzformen ermöglichen praktisches, kontrolliertes Arbeiten sowohl bei der Innen- als auch der Außenreinigung.',
  },
  'cw-icpe-1': {
    en: 'The ChemicalWorkz Interior Cleaning Pad is a two-sided cleaning pad developed for effective, deep cleaning of interior surfaces.\n\nIts special scrub texture on both sides delivers effective cleaning performance across different interior surfaces. Being washable and reusable, it offers long-lasting, practical use.',
    de: 'Das ChemicalWorkz Innenraum-Reinigungspad ist ein zweiseitiges Reinigungspad für die wirksame Tiefenreinigung von Innenraumoberflächen.\n\nDie spezielle Scrub-Struktur auf beiden Seiten sorgt für effektive Reinigungsleistung auf unterschiedlichen Innenraumoberflächen. Waschbar und wiederverwendbar, bietet es eine langlebige, praktische Nutzung.',
  },
  'cw-ga': {
    en: 'An applicator developed for easy, controlled polishing of glass surfaces.\n\nIts felt surface spreads the glass polish evenly, helping achieve a smooth, even result. Its compact design offers precise, controlled use — suitable for both professional detailing work and personal use.',
    de: 'Ein Applikator für einfaches, kontrolliertes Polieren von Glasoberflächen.\n\nDie Filzoberfläche verteilt das Glaspoliermittel gleichmäßig und sorgt so für ein homogenes, glattes Ergebnis. Die kompakte Bauform ermöglicht präzises, kontrolliertes Arbeiten – geeignet sowohl für professionelle Detailing-Anwendungen als auch für den privaten Gebrauch.',
  },
  'cw-db-ws-16': {
    en: 'A soft-bristled detailing brush developed for the gentle, safe cleaning of delicate surfaces.\n\nAvailable in 16 mm, 20 mm and 24 mm sizes, the brush provides controlled, effective cleaning on scratch-sensitive surfaces. It’s especially ideal for detailing work that calls for extra care.',
    de: 'Eine weichborstige Detailing-Bürste für die schonende, sichere Reinigung empfindlicher Oberflächen.\n\nErhältlich in den Größen 16 mm, 20 mm und 24 mm, ermöglicht die Bürste kontrollierte, wirksame Reinigung auf kratzempfindlichen Oberflächen. Besonders ideal für Detailing-Arbeiten, die besondere Sorgfalt erfordern.',
  },
  'cw-db-us': {
    en: 'An ultra-soft-bristled detailing brush developed for the safe, gentle cleaning of extremely delicate surfaces.\n\nIts 20 mm size provides controlled cleaning on sensitive surfaces and fine details. Delivering effective cleaning with minimal contact pressure, it’s an ideal solution for detailing work that demands extra care.',
    de: 'Eine ultra-weichborstige Detailing-Bürste für die sichere, schonende Reinigung äußerst empfindlicher Oberflächen.\n\nDie 20-mm-Größe ermöglicht kontrolliertes Reinigen empfindlicher Oberflächen und feiner Details. Mit minimalem Anpressdruck sorgt sie für wirksame Reinigung und ist damit ideal für Detailing-Arbeiten, die besondere Sorgfalt erfordern.',
  },
  'cw-db-bb-16': {
    en: 'The ChemicalWorkz Detailing Brush is developed for the precise cleaning of wheels, engine bays, emblems, trim and other hard-to-reach areas.\n\nIts ergonomic design offers comfortable use, while the soft, controlled bristle structure delivers effective cleaning performance on exterior surfaces. An ideal solution for detailed, careful exterior maintenance work.',
    de: 'Die ChemicalWorkz Detailing-Bürste wurde für die präzise Reinigung von Felgen, Motorräumen, Emblemen, Zierleisten und anderen schwer zugänglichen Bereichen entwickelt.\n\nDas ergonomische Design sorgt für komfortable Handhabung, während die weiche, kontrollierte Borstenstruktur eine wirksame Reinigungsleistung auf Außenflächen bietet. Eine ideale Lösung für detaillierte, sorgfältige Außenpflege.',
  },
  'cw-usd-purple': {
    en: 'The ChemicalWorkz Ultra Soft Duo Brush Set is a two-piece brush set developed for precise, gentle cleaning across different detailing tasks.\n\nThe ultra-soft bristles of both differently sized brushes allow delicate surfaces and fine details to be cleaned safely and with control. Adaptable to a wide range of uses, it’s a versatile solution for detailed cleaning work.',
    de: 'Das ChemicalWorkz Ultra-Weiche Duo-Bürstenset ist ein zweiteiliges Bürstenset für die präzise, schonende Reinigung bei verschiedenen Detailing-Aufgaben.\n\nDie ultra-weichen Borsten der beiden unterschiedlich großen Bürsten ermöglichen die sichere, kontrollierte Reinigung empfindlicher Oberflächen und feiner Details. Vielseitig einsetzbar, ist es eine flexible Lösung für detaillierte Reinigungsarbeiten.',
  },
  'cw-tdb': {
    en: 'Developed for the precise care and treatment of tire and plastic surfaces.\n\nIts ultra-soft nylon bristles reach even the smallest grooves and details, ensuring care products are applied evenly and with control. An ideal solution for achieving a clean, even surface finish.',
    de: 'Entwickelt für die präzise Pflege und Behandlung von Reifen- und Kunststoffoberflächen.\n\nDie ultraweichen Nylonborsten erreichen selbst kleinste Rillen und Details und sorgen für eine gleichmäßige, kontrollierte Auftragung von Pflegeprodukten. Eine ideale Lösung für ein homogenes, sauberes Oberflächenfinish.',
  },
  'cw-cfgt-1pc': {
    en: 'A microfiber cloth developed for effective, streak-free cleaning of glass surfaces.\n\nWith a 360 GSM density and a special carbon fiber weave, it effectively removes dirt and residue from glass surfaces. It leaves a clear, clean, flawless finish with no streaks or smudges.',
    de: 'Ein Mikrofasertuch für die wirksame, schlierenfreie Reinigung von Glasoberflächen.\n\nMit einer Dichte von 360 g/m² und einer speziellen Karbonfaser-Webung entfernt es Schmutz und Rückstände von Glasflächen zuverlässig. Es hinterlässt ein klares, sauberes, makelloses Ergebnis ohne Schlieren oder Streifen.',
  },
  'cw-ms': {
    en: 'ChemicalWorkz Magnetic Stripes are magnetic drying strips developed to make vehicle drying more practical and controlled.\n\nTheir integrated magnets hold securely to the vehicle’s surface while offering high absorbency for effective water removal. They provide a practical, effortless way to handle detailed drying work.',
    de: 'Die ChemicalWorkz Magnetic Stripes sind magnetische Trockenstreifen, die das Trocknen des Fahrzeugs praktischer und kontrollierter machen.\n\nIhre integrierten Magnete halten sicher an der Fahrzeugoberfläche, während die hohe Saugfähigkeit Wasser effektiv aufnimmt. Sie ermöglichen ein praktisches, müheloses Arbeiten bei detaillierten Trocknungsvorgängen.',
  },
  'cw-sb-L-b': {
    en: 'The ChemicalWorkz Spray Bottle is a professional spray bottle developed for the practical, controlled and even application of cleaning and care products.\n\nWith a 750 ml capacity, a durable HDPE body and a high-quality trigger mechanism, it sprays product onto the surface precisely and evenly. An ideal solution for the easy use of cleaning and care products during detailing work.',
    de: 'Die ChemicalWorkz Sprühflasche ist eine professionelle Sprühflasche für die praktische, kontrollierte und gleichmäßige Anwendung von Reinigungs- und Pflegeprodukten.\n\nMit 750 ml Fassungsvermögen, einem robusten HDPE-Gehäuse und einem hochwertigen Sprühmechanismus verteilt sie das Produkt präzise und gleichmäßig auf der Oberfläche. Eine ideale Lösung für die einfache Anwendung von Reinigungs- und Pflegeprodukten bei Detailing-Arbeiten.',
  },
  'cw-rps': {
    en: 'A refillable pressure sprayer developed for the controlled application of cleaning and care products on both delicate and large surfaces.\n\nWith two different nozzles, the spray pattern can be adjusted to suit the application. Durable Viton seals and a safety valve ensure safe, clean and efficient operation even under heavy use.',
    de: 'Ein nachfüllbarer Drucksprüher für die kontrollierte Anwendung von Reinigungs- und Pflegeprodukten auf empfindlichen wie auch großen Flächen.\n\nZwei unterschiedliche Düsen ermöglichen eine an die jeweilige Anwendung angepasste Sprühform. Robuste Viton-Dichtungen und ein Sicherheitsventil sorgen auch bei intensivem Einsatz für sicheres, sauberes und effizientes Arbeiten.',
  },
  'cw-cs': {
    en: 'A surface cleaning sponge developed for the effective removal of stubborn dirt and contamination from paint surfaces.\n\nIts special polymer technology easily lifts embedded dirt and residue from the surface. With practical, controlled handling, it’s an ideal solution for prepping the paint surface ahead of further detailing work.',
    de: 'Ein Oberflächenreinigungsschwamm zur wirksamen Entfernung hartnäckigen Schmutzes und Verunreinigungen von Lackoberflächen.\n\nDie spezielle Polymertechnologie löst anhaftenden Schmutz und Rückstände mühelos von der Oberfläche. Praktisch und kontrolliert in der Handhabung, ist er eine ideale Lösung, um die Lackoberfläche für weitere Detailing-Arbeiten vorzubereiten.',
  },
  'cw-amm-gray': {
    en: 'Microfiber cleaning mitts developed for versatile, effective use in vehicle cleaning.\n\nTheir extremely soft, flexible microfiber structure makes gentle contact with surfaces while providing detailed, controlled cleaning on wheel spokes, door handles and other hard-to-reach areas.',
    de: 'Mikrofaser-Reinigungshandschuhe für vielseitigen, wirksamen Einsatz bei der Fahrzeugreinigung.\n\nDie äußerst weiche, flexible Mikrofaserstruktur sorgt für schonenden Oberflächenkontakt und ermöglicht gleichzeitig eine detaillierte, kontrollierte Reinigung von Felgenspeichen, Türgriffen und anderen schwer zugänglichen Bereichen.',
  },
  'cw-pc-s': {
    en: 'Developed for controlled polishing work in tight, hard-to-reach and delicate areas.\n\nAvailable in round or conical tip shapes depending on the model, these polishing cones enable precise, effective work on edges, narrow gaps, grilles, emblems and other detailed areas.',
    de: 'Entwickelt für kontrollierte Polierarbeiten in engen, schwer zugänglichen und empfindlichen Bereichen.\n\nJe nach Modell in runder oder konischer Form erhältlich, ermöglichen diese Polierkegel präzises, wirksames Arbeiten an Kanten, engen Spalten, Gittern, Emblemen und anderen detaillierten Bereichen.',
  },
  'cw-pss': {
    en: 'Detail sticks with fine microfiber tips, developed for precise, spot-specific applications on the vehicle.\n\nTheir fine tip design provides high control and precision for touching up stone chips, cleaning polishing dust and applying protective products to hard-to-reach areas.',
    de: 'Detailstäbchen mit feiner Mikrofaserspitze für präzise, punktuelle Anwendungen am Fahrzeug.\n\nDie feine Spitzenform sorgt für hohe Kontrolle und Präzision beim Ausbessern von Steinschlägen, beim Entfernen von Polierstaub und beim Auftragen von Pflegeprodukten in schwer zugänglichen Bereichen.',
  },
  'cw-hg': {
    en: 'A practical accessory developed to prevent hoses and cables from catching or tangling during application.\n\nIt lets hoses and cables glide more smoothly over surfaces and corners, helping protect them from wear and abrasion — for a tidier work area and an uninterrupted workflow.',
    de: 'Ein praktisches Zubehörteil, das verhindert, dass Schläuche und Kabel bei der Anwendung hängen bleiben oder sich verheddern.\n\nEs lässt Schläuche und Kabel geschmeidiger über Flächen und Kanten gleiten und schützt sie so vor Abrieb und Verschleiß – für einen aufgeräumteren Arbeitsbereich und einen ungestörten Arbeitsablauf.',
  },
  'cw-mw': {
    en: 'A 12-piece professional set developed for the precise, controlled removal and refitting of interior trim, panels and clips without damaging the surface.\n\nIt comes with 11 different plastic pry tools, a clip-removal plier and a practical roll-up carrying case, offering safe, practical use for workshop, restoration and interior trim work.',
    de: 'Ein 12-teiliges Profi-Set für das präzise, kontrollierte Lösen und Wiederanbringen von Innenraumverkleidungen, Blenden und Clips, ohne die Oberfläche zu beschädigen.\n\nEs enthält 11 verschiedene Kunststoff-Hebelwerkzeuge, eine Clip-Löse-Zange und eine praktische Roll-Tragetasche und ermöglicht sicheres, praktisches Arbeiten in Werkstatt, Restaurierung und Innenraumverkleidung.',
  },
};

// Maps every SKU sharing an identical TR paragraph to its representative translation key.
const ALIASES = {
  'cw-pp-30-heavy': 'cw-pp-125-heavy', 'cw-pp-50-heavy': 'cw-pp-125-heavy', 'cw-pp-75-heavy': 'cw-pp-125-heavy',
  'cw-pp-30-medium': 'cw-pp-125-medium', 'cw-pp-50-medium': 'cw-pp-125-medium', 'cw-pp-75-medium': 'cw-pp-125-medium',
  'cw-pp-30-soft': 'cw-pp-125-soft', 'cw-pp-50-soft': 'cw-pp-125-soft', 'cw-pp-75-soft': 'cw-pp-125-soft',
  'cw-pp-50-wool': 'cw-pp-125-wool', 'cw-pp-75-wool': 'cw-pp-125-wool',
  'cw-db-ws-20': 'cw-db-ws-16', 'cw-db-ws-24': 'cw-db-ws-16',
  'cw-db-bb-20': 'cw-db-bb-16', 'cw-db-bb-24': 'cw-db-bb-16',
  'cw-usd-turquoise': 'cw-usd-purple',
  'cw-sb-L-bL': 'cw-sb-L-b', 'cw-sb-L-gr': 'cw-sb-L-b', 'cw-sb-L-re': 'cw-sb-L-b', 'cw-sb-L-ye': 'cw-sb-L-b',
};

const out = {};
let missing = 0;
for (const [id, tr] of Object.entries(descsTr)) {
  if (!tr) continue; // cw-da9-pro-max, cw-da12, cw-hwa: no Excel copy — build-products.mjs falls back to its own template for these.
  const key = ALIASES[id] || id;
  const translated = TRANSLATIONS[key];
  if (!translated) {
    console.error(`MISSING translation for ${id} (key ${key}) — add it to TRANSLATIONS in this script.`);
    missing++;
    continue;
  }
  out[id] = { tr, en: translated.en, de: translated.de };
}

fs.writeFileSync(path.join(ROOT, 'scripts', 'description-data.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${Object.keys(out).length} product descriptions to scripts/description-data.json`);
if (missing) {
  console.error(`${missing} SKU(s) missing a translation — see errors above.`);
  process.exit(1);
}
