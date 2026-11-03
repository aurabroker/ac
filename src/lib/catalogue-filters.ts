/**
 * Filtry indeksu katalogu (/ubezpieczenia/): branże, dla których karta jest typowym punktem wyjścia.
 * Przypisania wynikają z sekcji „Kto zwykle…” na kartach i z treści filarów. `*` = karta dla każdej branży
 * (pokazywana przy każdym filtrze branżowym). Nowa karta bez wpisu = każda branża.
 */
export const CATALOGUE_INDUSTRIES = [
  { id: 'it', label: 'IT i software' },
  { id: 'ai', label: 'AI' },
  { id: 'fin', label: 'Finanse i fintech' },
  { id: 'zdrowie', label: 'Zdrowie i e-zdrowie' },
  { id: 'media', label: 'Media i marketing' },
  { id: 'produkcja', label: 'Produkcja i e-commerce' },
  { id: 'uslugi', label: 'Usługi i doradztwo' },
] as const;

const MAP: Record<string, string[]> = {
  '/oc-cyber-dla-it/': ['it'],
  '/ubezpieczenie-ai/': ['ai'],
  '/ubezpieczenie-cyber/': ['*'],
  '/oc-zawodowe/': ['uslugi'],
  '/ubezpieczenia/oc-czlonkow-zarzadu-d-o/': ['*'],
  '/ubezpieczenia/ubezpieczenie-crime/': ['*'],
  '/ubezpieczenia/instytucje-finansowe-i-fintech/': ['fin'],
  '/ubezpieczenia/oc-mediow/': ['media'],
  '/ubezpieczenia/oc-ochrona-zdrowia/': ['zdrowie'],
  '/ubezpieczenia/oc-produktu-i-wycofanie/': ['produkcja', 'it'],
  '/ubezpieczenia/oc-dzialalnosci/': ['*'],
  '/ubezpieczenia/ochrona-prawna-ip/': ['it', 'ai', 'produkcja'],
  '/ubezpieczenia/gwarancje-ubezpieczeniowe/': ['*'],
  '/ubezpieczenia/mienie-i-sprzet-elektroniczny/': ['*'],
  '/ubezpieczenia/ubezpieczenia-transakcyjne/': ['*'],
  '/ubezpieczenia/ryzyka-nietypowe/': ['*'],
};

/** Krótkie etykiety grup (przyciski filtra „Ryzyko”); brak wpisu = nazwa grupy do dwukropka. */
const GROUP_SHORT: Record<string, string> = {
  'Zarząd, pieniądze i nadużycia': 'Zarząd i nadużycia',
  'Transakcje, kontrakty i własność intelektualna': 'Transakcje i IP',
  'Mienie, przestoje i ryzyka nietypowe': 'Mienie i ryzyka nietypowe',
};
export function groupShort(name: string): string {
  return GROUP_SHORT[name] ?? name.split(':')[0];
}

export function industriesFor(path: string): string[] {
  return MAP[path] ?? ['*'];
}
