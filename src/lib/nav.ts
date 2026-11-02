/** Nawigacja główna i stopka (współdzielone — zmiany przez build-notes). */
export interface NavLink {
  label: string;
  href: string;
}

export const MAIN_NAV: NavLink[] = [
  { label: 'OC i Cyber dla IT', href: '/oc-cyber-dla-it/' },
  { label: 'Ubezpieczenie AI', href: '/ubezpieczenie-ai/' },
  { label: 'Cyber', href: '/ubezpieczenie-cyber/' },
  { label: 'OC zawodowe', href: '/oc-zawodowe/' },
  { label: 'Ubezpieczenia', href: '/ubezpieczenia/' },
  { label: 'Wiedza', href: '/wiedza/' },
  { label: 'Słownik', href: '/slownik/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: 'Rozwiązania',
    links: [
      { label: 'OC i cyber dla firm IT', href: '/oc-cyber-dla-it/' },
      { label: 'Ubezpieczenie AI', href: '/ubezpieczenie-ai/' },
      { label: 'AI w firmie', href: '/ubezpieczenie-ai/ai-w-firmie/' },
      { label: 'Ubezpieczenie cyber', href: '/ubezpieczenie-cyber/' },
      { label: 'OC zawodowe', href: '/oc-zawodowe/' },
      { label: 'Katalog ubezpieczeń', href: '/ubezpieczenia/' },
    ],
  },
  {
    title: 'Wiedza',
    links: [
      { label: 'Rejestr arkuszy', href: '/wiedza/' },
      { label: 'Słownik', href: '/slownik/' },
      { label: 'Rynek Lloyd’s', href: '/rynek-lloyds/' },
    ],
  },
  {
    title: 'Firma',
    links: [
      { label: 'O nas', href: '/o-nas/' },
      { label: 'Autor: Marek Cieśla', href: '/zespol/marek-ciesla/' },
      { label: 'Informacje o brokerze', href: '/informacje-o-brokerze/' },
      { label: 'Reklamacje', href: '/reklamacje/' },
      { label: 'Polityka prywatności', href: '/polityka-prywatnosci/' },
      { label: 'Kontakt', href: '/kontakt/' },
    ],
  },
];

/** Etykiety sekcji w okruszkach. */
export const SECTION_LABELS: Record<string, NavLink> = {
  solutions: { label: 'Ubezpieczenia', href: '/ubezpieczenia/' },
  wiedza: { label: 'Wiedza', href: '/wiedza/' },
  regulations: { label: 'Wiedza', href: '/wiedza/' },
};
