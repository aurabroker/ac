/**
 * Formuły standardowe (PLAN §9, BUILD-SPEC). Jedyne miejsce, w którym te teksty
 * istnieją — komponent <Disclosure> i serializer .md biorą je stąd.
 * Zmiana treści formuł wymaga akceptacji właściciela / prawnika.
 */

/** (c) Materiał informacyjny — na każdej stronie z treścią o ubezpieczeniach i w stopce każdego .md. */
export const FORMULA_C =
  'Materiał informacyjny i marketingowy brokera. Nie stanowi oferty w rozumieniu art. 66 Kodeksu cywilnego ani porady prawnej lub podatkowej. Zakres ochrony, wyłączenia, limity i udziały własne określają wyłącznie dokumenty ubezpieczenia.';

/** (d) Podstawa porady i wynagrodzenie — na filarach i kartach. */
export const FORMULA_D_TEXT =
  'Analizujemy oferty z rynku krajowego i zagranicznego, w tym londyńskiego. Na jakiej podstawie doradzamy i jak jesteśmy wynagradzani:';
export const FORMULA_D_LINK = { href: '/informacje-o-brokerze/', label: 'informacje o brokerze' } as const;

/** (b) Ubezpieczyciel — wariant zależny od danych linii (`securityConfirmed`, `lloydsShare`). */
export const FORMULA_B_UNCONFIRMED = 'Ubezpieczyciel jest wskazany w ofercie i polisie.';
export const FORMULA_B_LLOYDS_FULL =
  "Ochrona plasowana na rynku Lloyd's. Ubezpieczycielem jest Lloyd's Insurance Company S.A. oraz inni ubezpieczyciele wskazani w ofercie i polisie.";
export const FORMULA_B_LLOYDS_PARTIAL =
  "Część ryzyka może być plasowana na rynku Lloyd's. Ubezpieczycielami są Lloyd's Insurance Company S.A. oraz inni ubezpieczyciele wskazani w ofercie i polisie.";
export const FORMULA_B_BROKER_STATUS =
  "Aura Consulting sp. z o.o. jest brokerem ubezpieczeniowym. Nie jest ubezpieczycielem ani członkiem, przedstawicielem lub agentem Lloyd's.";

export function formulaB(opts: { securityConfirmed?: boolean; lloydsShare?: 'full' | 'partial' }): string[] {
  if (!opts.securityConfirmed || !opts.lloydsShare) return [FORMULA_B_UNCONFIRMED];
  return [opts.lloydsShare === 'full' ? FORMULA_B_LLOYDS_FULL : FORMULA_B_LLOYDS_PARTIAL, FORMULA_B_BROKER_STATUS];
}

/** Nota „Jak powstał ten tekst” (dobrowolna informacja o pomocy AI — PLAN §4.5). */
export const NOTE_AI_ASSISTANCE =
  'Tekst przygotowano z pomocą narzędzi AI na podstawie wskazanych źródeł. Treść sprawdził i zatwierdził autor, który odpowiada za nią redakcyjnie.';

export const NOTE_EDITORIAL =
  'Tekst opracował i sprawdził autor. Twierdzenia o zakresie ochrony mają charakter ogólny i zależą od warunków konkretnej polisy.';
