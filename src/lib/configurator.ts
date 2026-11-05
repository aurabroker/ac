/**
 * Konfigurator programu (orientacyjny) — dane i reguły.
 *
 * Jedno źródło dla: (1) statycznej tabeli „Zasady doboru” renderowanej w HTML (bez JS i w bliźniaku .md)
 * oraz (2) wierszy zestawienia, które skrypt tylko pokazuje, ukrywa i porządkuje (src/scripts/configurator.ts).
 * Skrypt importuje wyłącznie `evaluate()` i `STATUS_LABEL` — teksty zostają w HTML (polska typografia z buildu).
 *
 * Teksty: WYŁĄCZNIE twierdzenia, które już są na stronach serwisu (filary, karty, słownik), w wersji warunkowej.
 * Wynik nie jest ofertą ani poradą; odpowiedzi nie opuszczają przeglądarki.
 */

export type QId = 'branza' | 'klienci' | 'dane' | 'ai' | 'umowy' | 'produkt';
export type Answers = Partial<Record<QId, string>>;

export interface Question {
  id: QId;
  legend: string;
  /** Krótka etykieta do podsumowania (formularz, schowek). */
  short: string;
  options: { value: string; label: string }[];
}

const YES_NO = [
  { value: 'tak', label: 'Tak' },
  { value: 'nie', label: 'Nie' },
];

export const QUESTIONS: Question[] = [
  {
    id: 'branza',
    legend: 'Czym zajmuje się firma?',
    short: 'Działalność',
    options: [
      { value: 'software-house', label: 'Software house' },
      { value: 'saas', label: 'SaaS, platforma' },
      { value: 'ai', label: 'AI, ML, LLM' },
      { value: 'msp', label: 'MSP, cyberbezpieczeństwo' },
      { value: 'uslugi', label: 'Doradztwo, usługi' },
      { value: 'inna', label: 'Inna' },
    ],
  },
  {
    id: 'klienci',
    legend: 'Gdzie są Twoi klienci?',
    short: 'Klienci',
    options: [
      { value: 'pl', label: 'Polska' },
      { value: 'ue', label: 'Polska i UE' },
      { value: 'usa', label: 'Także USA lub Kanada' },
    ],
  },
  { id: 'dane', legend: 'Przetwarzasz dane osobowe lub dane klientów?', short: 'Dane osobowe lub dane klientów', options: YES_NO },
  { id: 'ai', legend: 'Czy AI jest częścią produktu lub usług?', short: 'AI w produkcie lub usługach', options: YES_NO },
  {
    id: 'umowy',
    legend: 'Czy umowy z klientami wymagają OC?',
    short: 'Umowy wymagają OC',
    options: [...YES_NO, { value: 'nie-wiem', label: 'Nie wiem' }],
  },
  {
    id: 'produkt',
    legend: 'Sprzedajesz oprogramowanie lub urządzenie jako produkt?',
    short: 'Oprogramowanie lub urządzenie jako produkt',
    options: YES_NO,
  },
];

export type ModuleId = 'oc' | 'cyber' | 'crime' | 'ocd' | 'produkt' | 'dno';
export type Status = 'core' | 'rec' | 'opt';

export const STATUS_LABEL: Record<Status, string> = {
  core: 'Rdzeń programu',
  rec: 'Zalecany',
  opt: 'Do rozważenia',
};

export interface ModuleVariant {
  name: string;
  text: string;
  href: string;
  link: string;
}
export interface ModuleDef {
  id: ModuleId;
  icon: string;
  variants: Record<string, ModuleVariant>;
}

const IT_HREF = '/oc-cyber-dla-it/';
const CRIME = { name: 'Cyberprzestępstwa (crime)', href: '/ubezpieczenia/ubezpieczenie-crime/', link: 'Ubezpieczenie crime' };
const OCD = { name: 'OC działalności', href: '/ubezpieczenia/oc-dzialalnosci/', link: 'OC działalności' };

export const MODULES: ModuleDef[] = [
  {
    id: 'oc',
    icon: 'compass',
    variants: {
      it: {
        name: 'OC zawodowe (Technology Errors & Omissions, Tech E&O)',
        text: 'Roszczenia klientów za błędy w usługach IT i nienależyte wykonanie umowy: odszkodowania i koszty obrony, zgodnie z warunkami polisy.',
        href: `${IT_HREF}#co-obejmuje-oc-zawodowe-firmy-it`,
        link: 'OC i cyber dla firm IT',
      },
      pi: {
        name: 'OC zawodowe',
        text: 'Roszczenia klientów za błędy w usługach, poradach lub projektach: odszkodowania i koszty obrony, zgodnie z warunkami polisy.',
        href: '/oc-zawodowe/',
        link: 'OC zawodowe',
      },
      gen: {
        name: 'OC zawodowe',
        text: 'Potrzebne, jeśli świadczysz usługi lub doradzasz: chroni przed roszczeniami klientów za błędy w pracy.',
        href: '/oc-zawodowe/',
        link: 'OC zawodowe',
      },
    },
  },
  {
    id: 'cyber',
    icon: 'shield-section',
    variants: {
      it: {
        name: 'Ubezpieczenie cyber',
        text: 'Reakcja na incydent, odtworzenie danych, przerwa w działalności i roszczenia po wycieku — w limitach i po franszyzach z polisy.',
        href: `${IT_HREF}#co-obejmuje-ubezpieczenie-cyber-dla-firmy-it`,
        link: 'Cyber dla firm IT',
      },
      dane: {
        name: 'Ubezpieczenie cyber',
        text: 'Przy danych osobowych liczą się koszty po incydencie i roszczenia osób, których dane wyciekły — zgodnie z warunkami polisy.',
        href: '/ubezpieczenie-cyber/',
        link: 'Ubezpieczenie cyber',
      },
      gen: {
        name: 'Ubezpieczenie cyber',
        text: 'Ransomware i przestój systemów dotykają także firm spoza IT. Polisa finansuje m.in. reakcję na incydent i przerwę w działalności.',
        href: '/ubezpieczenie-cyber/',
        link: 'Ubezpieczenie cyber',
      },
    },
  },
  {
    id: 'crime',
    icon: 'padlock',
    variants: {
      ai: {
        ...CRIME,
        text: 'Nadużycie kluczy API do modeli i przelew wyłudzony „głosem prezesa” to zwykle moduł cyberprzestępstw, wybierany osobno.',
      },
      gen: {
        ...CRIME,
        text: 'Wyłudzony przelew, fałszywa faktura, oszustwo „na prezesa”: zwykle opcja w polisie cyber albo osobne ubezpieczenie crime.',
      },
    },
  },
  {
    id: 'ocd',
    icon: 'warning-triangle',
    variants: {
      msp: {
        ...OCD,
        text: 'Szkody osobowe i rzeczowe u klientów, np. sprzęt uszkodzony w serwerowni klienta. OC zawodowe zwykle ich nie obejmuje.',
      },
      umowy: {
        ...OCD,
        text: 'Klienci często wymagają kilku polis naraz: obok OC zawodowego także OC działalności na szkody osobowe i rzeczowe.',
      },
      gen: {
        ...OCD,
        text: 'Szkody osobowe i rzeczowe wyrządzone innym przy prowadzeniu firmy, np. wypadek gościa w biurze.',
      },
    },
  },
  {
    id: 'produkt',
    icon: 'factory',
    variants: {
      gen: {
        name: 'OC za produkt',
        text: 'Nowa dyrektywa o produktach wadliwych (PLD) obejmuje oprogramowanie, także systemy AI. OC zawodowe jest zwykle zbudowane wokół usług.',
        href: '/ubezpieczenia/oc-produktu-i-wycofanie/',
        link: 'OC za produkt',
      },
    },
  },
  {
    id: 'dno',
    icon: 'building',
    variants: {
      gen: {
        name: 'OC członków zarządu (D&O)',
        text: 'Osobista odpowiedzialność członków zarządu, np. wobec inwestorów lub po decyzjach o finansach spółki.',
        href: '/ubezpieczenia/oc-czlonkow-zarzadu-d-o/',
        link: 'D&O',
      },
    },
  },
];

export interface NoteDef {
  id: string;
  icon: string;
  title: string;
  text: string;
  href: string;
  link: string;
}

const CONTRACT_TEXT =
  'Sprawdzamy rodzaj wymaganej polisy, limit i walutę, terytorium, status klienta w polisie (additional insured, waiver of subrogation) i to, jak długo ochrona ma trwać po zakończeniu projektu.';

export const NOTES: NoteDef[] = [
  {
    id: 'usa',
    icon: 'globe-pin',
    title: 'USA i Kanada',
    text: 'Polscy ubezpieczyciele mogą odmówić ochrony w USA i Kanadzie, objąć ją podlimitem albo zaproponować bardzo wysoką składkę — w dużej mierze zależnie od branży. Sprawdzamy terytorium powództw, jurysdykcję, limit i walutę.',
    href: `${IT_HREF}#jak-dziala-ochrona-przy-pozwach-w-usa-i-kanadzie`,
    link: 'Pozwy w USA i Kanadzie',
  },
  {
    id: 'teryt',
    icon: 'globe',
    title: 'Terytorium',
    text: 'Zakres terytorialny bywa ograniczony do Polski, UE lub Europy. Sprawdzamy, czy obejmuje kraje Twoich klientów i sądy wskazane w umowach.',
    href: '/slownik/#terytorium-i-jurysdykcja',
    link: 'Terytorium i jurysdykcja',
  },
  {
    id: 'ai',
    icon: 'neural-node',
    title: 'Klauzula AI',
    text: 'Polisa może potwierdzać AI wprost, milczeć o niej albo ją ograniczać. Sprawdzamy brzmienie warunków; klauzula AI nie tworzy osobnego limitu i nie usuwa wyłączeń.',
    href: '/ubezpieczenie-ai/#czy-ai-da-sie-ubezpieczyc',
    link: 'Ubezpieczenie AI',
  },
  {
    id: 'umowy-it',
    icon: 'contract-seal',
    title: 'Wymogi umów',
    text: CONTRACT_TEXT,
    href: `${IT_HREF}#klient-wymaga-oc-w-umowie-co-sprawdzic`,
    link: 'Klient wymaga OC w umowie',
  },
  {
    id: 'umowy-pi',
    icon: 'contract-seal',
    title: 'Wymogi umów',
    text: CONTRACT_TEXT,
    href: '/oc-zawodowe/#umowa-z-klientem-wymaga-oc-na-co-zwrocic-uwage',
    link: 'Umowa wymaga OC',
  },
  {
    id: 'umowy-nw',
    icon: 'contract-seal',
    title: 'Wymogi umów',
    text: 'Najpierw sprawdź, czego wymaga klient, a dopiero potem kupuj polisę. Prześlij nam fragment umowy — przeczytamy zapisy o ubezpieczeniu.',
    href: `${IT_HREF}#klient-wymaga-oc-w-umowie-co-sprawdzic`,
    link: 'Co sprawdzić w umowie',
  },
  {
    id: 'dane',
    icon: 'padlock',
    title: 'Dane osobowe',
    text: 'Po wycieku polisa cyber zwykle pokrywa poradę prawną, powiadomienia, obronę w postępowaniu i roszczenia osób, których dane wyciekły. Kary — tylko tam, gdzie prawo pozwala je ubezpieczyć.',
    href: '/ubezpieczenie-cyber/#wyciek-danych-i-rodo-co-pokryje-polisa',
    link: 'Wyciek danych i RODO',
  },
  {
    id: 'msp',
    icon: 'network',
    title: 'Jeden błąd, wielu klientów',
    text: 'Roszczenia z jednej przyczyny to zwykle jedno roszczenie, w granicach jednego limitu. Limit dobieramy pod najgorszy realny scenariusz, a nie pod średni kontrakt.',
    href: `${IT_HREF}#jak-to-wyglada-w-praktyce`,
    link: 'Scenariusze',
  },
  {
    id: 'saas',
    icon: 'cloud',
    title: 'Service credits',
    text: 'Service credits są zwykle wyłączone; przestój u dostawcy chmury bywa dostępny jako rozszerzenie.',
    href: `${IT_HREF}#dla-jakich-firm-it-sektory-i-ocena-ryzyka`,
    link: 'Sektory i ocena ryzyka',
  },
  {
    id: 'kary',
    icon: 'scales',
    title: 'Kary umowne',
    text: 'Kary umowne za opóźnienie są zwykle poza zakresem. Porównaj sumę gwarancyjną z ograniczeniem odpowiedzialności w umowie.',
    href: `${IT_HREF}#czego-polisa-oc-i-cyber-dla-it-zwykle-nie-obejmuje`,
    link: 'Czego polisa nie obejmuje',
  },
  {
    id: 'nadwyzka',
    icon: 'layers',
    title: 'Obowiązkowe OC',
    text: 'Jeśli Twój zawód wymaga OC z ustawy, polisa dobrowolna może działać jako nadwyżka ponad ustawowe minimum — nie zastępuje polisy obowiązkowej.',
    href: '/oc-zawodowe/#obowiazkowe-oc-i-polisa-nadwyzkowa-jak-to-dziala',
    link: 'Obowiązkowe OC i nadwyżka',
  },
];

/** Statyczna tabela zasad (bez JS i w .md). */
export const RULES_TABLE: { module: ModuleId; when: string }[] = [
  { module: 'oc', when: 'Świadczysz usługi IT, doradzasz lub realizujesz projekty dla klientów. W IT i w usługach to rdzeń programu.' },
  { module: 'cyber', when: 'Przetwarzasz dane osobowe lub dane klientów albo działalność zależy od systemów IT.' },
  { module: 'crime', when: 'Firma wykonuje przelewy albo korzysta z kluczy API do modeli AI.' },
  { module: 'ocd', when: 'Pracujesz u klientów (np. jako MSP) albo umowy wymagają kilku polis naraz.' },
  { module: 'produkt', when: 'Sprzedajesz oprogramowanie lub urządzenie jako produkt.' },
  { module: 'dno', when: 'Spółka ma zarząd, inwestorów lub wierzycieli.' },
];

export interface Pick {
  id: ModuleId;
  status: Status;
  variant: string;
}

const IT = ['software-house', 'saas', 'ai', 'msp'];
const RANK: Record<Status, number> = { core: 0, rec: 1, opt: 2 };
const ORDER: ModuleId[] = ['oc', 'cyber', 'crime', 'ocd', 'produkt', 'dno'];

/** Reguły doboru. Bez odpowiedzi — sensowny punkt wyjścia (OC zawodowe i cyber jako zalecane). */
export function evaluate(a: Answers): { modules: Pick[]; notes: string[] } {
  const b = a.branza;
  const it = !!b && IT.includes(b);
  const m: Pick[] = [];

  if (it) m.push({ id: 'oc', status: 'core', variant: 'it' });
  else if (b === 'uslugi') m.push({ id: 'oc', status: 'core', variant: 'pi' });
  else m.push({ id: 'oc', status: !b || a.umowy === 'tak' ? 'rec' : 'opt', variant: 'gen' });

  if (it) m.push({ id: 'cyber', status: 'core', variant: 'it' });
  else if (a.dane === 'tak') m.push({ id: 'cyber', status: 'rec', variant: 'dane' });
  else m.push({ id: 'cyber', status: b || a.dane ? 'opt' : 'rec', variant: 'gen' });

  m.push(a.ai === 'tak' ? { id: 'crime', status: 'rec', variant: 'ai' } : { id: 'crime', status: 'opt', variant: 'gen' });

  if (b === 'msp') m.push({ id: 'ocd', status: 'rec', variant: 'msp' });
  else if (a.umowy === 'tak') m.push({ id: 'ocd', status: 'rec', variant: 'umowy' });
  else m.push({ id: 'ocd', status: 'opt', variant: 'gen' });

  if (a.produkt === 'tak') m.push({ id: 'produkt', status: 'rec', variant: 'gen' });
  m.push({ id: 'dno', status: 'opt', variant: 'gen' });

  m.sort((x, y) => RANK[x.status] - RANK[y.status] || ORDER.indexOf(x.id) - ORDER.indexOf(y.id));

  const n: string[] = [];
  if (a.klienci === 'usa') n.push('usa');
  else if (a.klienci === 'ue') n.push('teryt');
  if (a.ai === 'tak') n.push('ai');
  if (a.umowy === 'tak') n.push(it || !b ? 'umowy-it' : 'umowy-pi');
  else if (a.umowy === 'nie-wiem') n.push('umowy-nw');
  if (a.dane === 'tak') n.push('dane');
  if (b === 'msp') n.push('msp');
  if (b === 'saas') n.push('saas');
  if (b === 'software-house') n.push('kary');
  if (b === 'uslugi') n.push('nadwyzka');
  return { modules: m, notes: n };
}
