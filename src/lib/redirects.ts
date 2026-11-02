/**
 * Przekierowania zależne od publikacji (301 do opublikowanej strony, 302 do celu zastępczego) (dopisywane do `_redirects` w buildzie przez
 * src/integrations/aura.ts). Cel `to` trafia do pliku tylko wtedy, gdy strona istnieje w tym
 * buildzie; inaczej używamy `fallback`. Dzięki temu stare adresy kierują do artykułu od dnia
 * jego publikacji, bez ręcznej zmiany `public/_redirects`.
 *
 * Reguły stałe (niezależne od publikacji) są w `public/_redirects`.
 */
export interface ConditionalRedirect {
  from: string[];
  /** Docelowa strona (ścieżka z „/” na końcu). */
  to: string;
  /** Cel zastępczy, gdy `to` nie ma w buildzie (np. artykuł jest szkicem). */
  fallback: string;
}

export const CONDITIONAL_REDIRECTS: ConditionalRedirect[] = [
  {
    // stary wpis „Ransomware 2.0” (blog GitHub Pages / Jekyll) → arkusz B2-06
    from: [
      '/blog-ransomware.html',
      '/blog-ransomware',
      '/blog-ransomware/',
      '/cyber/2026/03/03/ransomware-2-0.html',
      '/cyber/2026/03/03/ransomware-2-0',
      '/cyber/2026/03/03/ransomware-2-0/',
      '/_posts/2026-03-03-ransomware-2-0.md',
      '/_posts/2026-03-03-ransomware-2-0',
    ],
    to: '/wiedza/ransomware-2-0/',
    fallback: '/wiedza/',
  },
];
