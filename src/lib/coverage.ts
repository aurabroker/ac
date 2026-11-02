/**
 * Etykiety zakresu (PLAN §5.3). Zawsze w wersji warunkowej.
 * W treści używaj kluczy (`typical`, `optional`, `underwriting`, `excluded`).
 */
export const COVERAGE_LABELS = {
  typical: 'ZWYKLE W ZAKRESIE – ZALEŻY OD POLISY',
  optional: 'ROZSZERZENIE OPCJONALNE',
  underwriting: 'ZALEŻY OD OCENY RYZYKA',
  excluded: 'ZWYKLE WYŁĄCZONE – ZALEŻY OD POLISY',
} as const;

export type CoverageKey = keyof typeof COVERAGE_LABELS;
export const COVERAGE_KEYS = Object.keys(COVERAGE_LABELS) as [CoverageKey, ...CoverageKey[]];

export interface CoverageRow {
  /** Zdarzenie / element mechanizmu (np. „Roszczenie klienta za błąd w kodzie”). */
  event: string;
  /** Moduł / sekcja polisy (własna nazwa, nie z wordingu). */
  module?: string;
  label: CoverageKey;
  /** Warunki stojące obok etykiety. */
  conditions?: string;
  /** Podstawa (np. „OWU rynkowe, ≥ 3 wordingi”, akt prawny). */
  basis?: string;
}
