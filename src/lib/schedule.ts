/**
 * Harmonogram publikacji artykułów (`/wiedza/*`) i arkuszy regulacji (`/regulacje/*`).
 * Reguła: wpis jest opublikowany, gdy nie jest szkicem i jego dzień `published` (Europe/Warsaw) już nadszedł.
 * Używają jej build (`src/lib/routes.ts` → `isLive`) i codzienna publikacja (`scripts/publish-today.mjs`).
 * Bez importów Astro: plik czyta też sam Node (type stripping) w GitHub Actions.
 */
export const PUBLISH_TZ = 'Europe/Warsaw';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Dzień kalendarzowy w strefie Europe/Warsaw: RRRR-MM-DD. */
export function dayInWarsaw(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PUBLISH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * „Dziś” w chwili builda (Europe/Warsaw). `AURA_TODAY=RRRR-MM-DD` nadpisuje datę — tylko do testów harmonogramu.
 */
export function publishToday(env: Record<string, string | undefined> = process.env, at: Date = new Date()): string {
  const fake = env.AURA_TODAY?.trim();
  if (!fake) return dayInWarsaw(at);
  if (!DAY_RE.test(fake) || Number.isNaN(Date.parse(fake))) {
    throw new Error(`AURA_TODAY: oczekiwano daty RRRR-MM-DD, jest „${fake}”`);
  }
  return fake;
}

export interface Schedulable {
  draft: boolean;
  published: Date;
}

/** Opublikowany w produkcji: zatwierdzony (`draft: false`) i `published` ≤ dziś. */
export function isPublished(p: Schedulable, today: string): boolean {
  return !p.draft && dayInWarsaw(p.published) <= today;
}

/** Dzień publikacji jeszcze nie nadszedł. */
export function isScheduled(p: Pick<Schedulable, 'published'>, today: string): boolean {
  return dayInWarsaw(p.published) > today;
}
