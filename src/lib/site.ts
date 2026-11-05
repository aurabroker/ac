/**
 * Jedno źródło danych spółki (NAP, KSH, KNF). Używane w stopce, JSON-LD,
 * bliźniakach .md, llms.txt i OG. Nie duplikuj tych danych w treści.
 */
export const SITE = {
  url: 'https://www.auraconsulting.pl',
  host: 'www.auraconsulting.pl',
  name: 'Aura Consulting',
  legalName: 'Aura Consulting sp. z o.o.',
  wordmark: 'AURA CONSULTING',
  tagline: 'Broker ubezpieczeniowy',
  description:
    'Aura Consulting sp. z o.o. — broker ubezpieczeniowy. OC zawodowe i cyber dla firm IT, ubezpieczenie AI, ubezpieczenie cyber i OC zawodowe dla firm usługowych.',
  lang: 'pl',
  locale: 'pl_PL',
  phone: '+48 500 502 702',
  phoneE164: '+48500502702',
  /** Godziny rozmów telefonicznych (jak w JSON-LD contactPoint.hoursAvailable). */
  phoneHours: 'pn–pt, 9:00–17:00',
  /** Formularz kontaktowy (Pages Function /api/kontakt). Kontakt publiczny = telefon albo formularz (decyzja 4.11.2026). */
  formPath: '/kontakt/#formularz',
  formUrl: 'https://www.auraconsulting.pl/kontakt/#formularz',
  /**
   * Skrzynka, na którą trafiają wiadomości z formularza (domyślne CONTACT_TO). Nie pokazujemy jej w serwisie,
   * w .md, llms.txt ani JSON-LD — kontakt publiczny to telefon i formularz.
   */
  email: 'cyber@auraconsulting.pl',
  address: {
    street: 'ul. Bolkowska 2A/28',
    postalCode: '01-466',
    city: 'Warszawa',
    country: 'PL',
    countryName: 'Polska',
  },
  krs: '0000426835',
  nip: '9562300574',
  regon: '341302033',
  knfPermit: '1972/13',
  brokerRegister: '00001851/U',
  /** KSH art. 206 — sąd rejestrowy i kapitał zakładowy (dane właściciela, 2.11.2026). */
  registryCourt: 'Sąd Rejonowy dla m.st. Warszawy w Warszawie, XII Wydział Gospodarczy Krajowego Rejestru Sądowego',
  /** Wartość bez etykiety (stopka ma etykietę „Kapitał zakładowy”). */
  shareCapital: '34\u00a0000\u00a0zł',
  /** Profile zewnętrzne (sameAs) — uzupełnić po założeniu (LinkedIn, GBP). */
  sameAs: [] as string[],
} as const;

export const ADDRESS_LINE = `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`;

/** Jednowierszowe dane rejestrowe (stopka, .md, llms.txt). */
export const REGISTRY_LINE =
  `${SITE.legalName}, ${ADDRESS_LINE} · KRS ${SITE.krs} · NIP ${SITE.nip} · REGON ${SITE.regon} · ` +
  `zezwolenie KNF nr ${SITE.knfPermit} · rejestr brokerów ${SITE.brokerRegister} · ` +
  `sąd rejestrowy: ${SITE.registryCourt} · kapitał zakładowy ${SITE.shareCapital}`;

/** Wydawca w bliźniakach .md i JSON-LD. */
export const PUBLISHER_LINE =
  `${SITE.legalName} — broker ubezpieczeniowy (zezwolenie KNF ${SITE.knfPermit}, rejestr brokerów ${SITE.brokerRegister}, KRS ${SITE.krs})`;

/** Absolutny URL z ścieżki (z ukośnikiem na końcu dla stron). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return SITE.url + (path.startsWith('/') ? path : `/${path}`);
}

/** Ścieżka bliźniaka .md dla ścieżki strony HTML: `/` → `/index.md`, `/a/b/` → `/a/b.md`. */
export function mdPathFor(pagePath: string): string {
  if (pagePath === '/' || pagePath === '') return '/index.md';
  return pagePath.replace(/\/$/, '') + '.md';
}

/** Odwrotność mdPathFor: `/index.md` → `/`, `/a/b.md` → `/a/b/`. */
export function pagePathForMd(mdPath: string): string {
  if (mdPath === '/index.md') return '/';
  return mdPath.replace(/\.md$/, '/');
}

/** Klucz obrazu OG: `/` → `index`, `/wiedza/x/` → `wiedza/x`. */
export function ogKeyFor(pagePath: string): string {
  const key = pagePath.replace(/^\/|\/$/g, '');
  return key === '' ? 'index' : key;
}
