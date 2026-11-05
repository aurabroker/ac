/**
 * Zestaw ikon „rysunek techniczny” (src/icons/*.svg) i reguły ich doboru.
 * Siatka 24×24, linia obiektu 1,5, szczegóły i kreskowanie 1, narożniki ostre (miter), końce kwadratowe,
 * kolor = currentColor, wypełnienia tylko w drobnych akcentach. Komponent: src/components/Icon.astro.
 * Ikony wspierają skanowanie strony — nie dekorują. Lista nazw: docs/CONVENTIONS.md §6.
 */
import type { CoverageKey } from './coverage.ts';

export const ICON_NAMES = [
  // ochrona, umowy, prawo
  'shield-section',
  'contract-seal',
  'document',
  'document-md',
  'scales',
  'column',
  // technologia
  'code-brackets',
  'server-rack',
  'cloud',
  'neural-node',
  'chip',
  'network',
  'padlock',
  'key',
  'bug',
  'browser',
  'blocks',
  // świat, branże
  'globe',
  'globe-pin',
  'bank',
  'building',
  'house',
  'factory',
  'medical-cross',
  'cart',
  'megaphone',
  'team',
  'compass',
  'wrench',
  'camera',
  'suitcase',
  'car',
  'truck',
  'gamepad',
  'book',
  'chart',
  // pieniądze, limity, czas
  'coins',
  'calculator',
  'percent',
  'gauge',
  'calendar',
  'clock',
  // incydenty
  'warning-triangle',
  'lightning',
  // interfejs
  'phone',
  'form',
  'copy',
  'download',
  'arrow-right',
  'search',
  'magnifier',
  'layers',
  'check-badge',
  'x-badge',
  'plus-badge',
  'info',
  'question',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const RAW = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true });
const INNER = new Map<string, string>();
for (const [file, svg] of Object.entries(RAW)) {
  const name = file.replace(/^.*\/|\.svg$/g, '');
  const m = /<svg\b[^>]*>([\s\S]*)<\/svg>/.exec(svg);
  if (!m) throw new Error(`Ikona ${file}: brak elementu <svg>`);
  INNER.set(name, m[1].replace(/\s*\n\s*/g, ''));
}
for (const n of ICON_NAMES) if (!INNER.has(n)) throw new Error(`Ikona „${n}”: brak pliku src/icons/${n}.svg`);
for (const n of INNER.keys())
  if (!(ICON_NAMES as readonly string[]).includes(n)) throw new Error(`Plik src/icons/${n}.svg: dopisz nazwę do ICON_NAMES`);

export function isIconName(name: string): name is IconName {
  return INNER.has(name);
}

/** Wnętrze <svg> (bez elementu głównego). Nieznana nazwa = błąd buildu. */
export function iconInner(name: string): string {
  const inner = INNER.get(name);
  if (inner === undefined) throw new Error(`Nieznana ikona „${name}” (lista: src/lib/icons.ts)`);
  return inner;
}

const PAGE_ICONS = new WeakMap<object, Set<string>>();
/**
 * Czy to pierwsze użycie ikony na stronie? Klucz `page` = obiekt jednego renderu strony (Astro.locals).
 * Pierwsze użycie zawiera <symbol>, kolejne tylko <use> (komponent Icon.astro).
 */
export function firstUseOnPage(page: object, name: string): boolean {
  let used = PAGE_ICONS.get(page);
  if (!used) PAGE_ICONS.set(page, (used = new Set()));
  if (used.has(name)) return false;
  used.add(name);
  return true;
}

/** Ikony stron (nawigacja, karty w indeksach, „Powiązane arkusze”). Klucz = ścieżka. */
const PATH_ICONS: Record<string, IconName> = {
  '/': 'compass',
  '/oc-cyber-dla-it/': 'code-brackets',
  '/ubezpieczenie-ai/': 'neural-node',
  '/ubezpieczenie-ai/ai-w-firmie/': 'team',
  '/ubezpieczenie-cyber/': 'shield-section',
  '/oc-zawodowe/': 'compass',
  '/ubezpieczenia/': 'layers',
  '/ubezpieczenia/oc-czlonkow-zarzadu-d-o/': 'building',
  '/ubezpieczenia/ubezpieczenie-crime/': 'padlock',
  '/ubezpieczenia/instytucje-finansowe-i-fintech/': 'bank',
  '/ubezpieczenia/oc-mediow/': 'megaphone',
  '/ubezpieczenia/oc-ochrona-zdrowia/': 'medical-cross',
  '/ubezpieczenia/oc-produktu-i-wycofanie/': 'factory',
  '/ubezpieczenia/ochrona-prawna-ip/': 'scales',
  '/ubezpieczenia/gwarancje-ubezpieczeniowe/': 'contract-seal',
  '/ubezpieczenia/mienie-i-sprzet-elektroniczny/': 'server-rack',
  '/ubezpieczenia/oc-dzialalnosci/': 'warning-triangle',
  '/ubezpieczenia/ryzyka-nietypowe/': 'search',
  '/ubezpieczenia/ubezpieczenia-transakcyjne/': 'coins',
  '/rynek-lloyds/': 'column',
  '/wiedza/': 'document',
  '/wiedza/ransomware-2-0/': 'lightning',
  '/wiedza/pld-a-oc-software-house/': 'factory',
  '/wiedza/ai-act-a-ubezpieczenie/': 'neural-node',
  '/wiedza/oc-programisty-b2b/': 'code-brackets',
  '/wiedza/tech-eo-a-oc-zawodowe/': 'contract-seal',
  '/wiedza/klient-wymaga-oc-od-kontraktora/': 'contract-seal',
  '/wiedza/usa-kanada-w-polisie/': 'globe-pin',
  '/wiedza/llmjacking/': 'key',
  '/regulacje/ai-act/': 'scales',
  '/regulacje/pld/': 'scales',
  '/slownik/': 'book',
  '/kontakt/': 'form',
  '/o-nas/': 'building',
  '/informacje-o-brokerze/': 'info',
  '/reklamacje/': 'document',
  '/polityka-prywatnosci/': 'padlock',
};

/** Ikona strony po ścieżce; dla nieznanych — wg sekcji adresu (lub brak). */
export function iconForPath(path: string): IconName | undefined {
  const p = path.split(/[?#]/)[0];
  if (PATH_ICONS[p]) return PATH_ICONS[p];
  if (p.startsWith('/wiedza/')) return 'document';
  if (p.startsWith('/regulacje/')) return 'scales';
  if (p.startsWith('/ubezpieczenia/')) return 'layers';
  return undefined;
}

/**
 * Ikona nadetykiety sekcji (<SectionView label>). Etykiety są ujednolicone w treści („Oś czasu”,
 * „Mapa luk”…), więc wystarczy słowo kluczowe. Pierwsza pasująca reguła wygrywa; ogólne etykiety
 * („Szczegół A”, „Przekrój B–B”, „Rzut główny”) zostają bez ikony.
 */
const SECTION_RULES: [RegExp, IconName][] = [
  [/usa|kanad/i, 'globe-pin'],
  [/sztuczna inteligencja|podzespół ai/i, 'neural-node'],
  [/mapa luk/i, 'x-badge'],
  [/oś czasu|harmonogram/i, 'calendar'],
  [/wykres obciążenia/i, 'chart'],
  [/przypadki/i, 'lightning'],
  [/wymiar|tabela czynników|parametry oceny|tolerancje/i, 'gauge'],
  [/warun(ki|ek) (brzegow|eksploatacji)/i, 'contract-seal'],
  [/procedura obrony/i, 'scales'],
  [/procedura awaryjna|instrukcja postępowania/i, 'warning-triangle'],
  [/procedura|proces/i, 'arrow-right'],
  [/zespół uzupełniający|katalog|zestawienie kategorii/i, 'layers'],
  [/zestawienie sektorów/i, 'building'],
  [/zestawienie (profesji|użytkowników|stanowisk|odbiorców)|rzut ról/i, 'team'],
  [/rejestr|definicja/i, 'book'],
  [/rynki/i, 'globe'],
  [/lista kontrolna/i, 'check-badge'],
  [/normy i przepisy|obowiązki|sankcje|nadzór|klasyfikacja/i, 'scales'],
  [/zabezpieczenia/i, 'padlock'],
  [/źródła wymagań|dowody|karta wniosku/i, 'document'],
  [/założenia/i, 'compass'],
  [/schemat ideowy/i, 'network'],
  [/kryteria|klucz doboru/i, 'magnifier'],
];

export function sectionIcon(label: string): IconName | undefined {
  for (const [re, icon] of SECTION_RULES) if (re.test(label)) return icon;
  return undefined;
}

/** Ikony etykiet zakresu — ten sam kod co styl ramki (ciągła / kreskowa / pomiar / kreskowanie). */
export const COVERAGE_ICONS: Record<CoverageKey, IconName> = {
  typical: 'check-badge',
  optional: 'plus-badge',
  underwriting: 'gauge',
  excluded: 'x-badge',
};

/** Ikony wariantów <NoteBlock>. */
export const NOTE_ICONS = {
  note: 'info',
  scenario: 'lightning',
  legal: 'scales',
  warning: 'warning-triangle',
  exclusion: 'x-badge',
} as const satisfies Record<string, IconName>;
