/** Formatowanie dat (strefa Europe/Warsaw, polskie nazwy miesięcy). */
const TZ = 'Europe/Warsaw';

/** 02.11.2026 */
export function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('pl-PL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

/** 2 listopada 2026 */
export function fmtDateLong(d: Date): string {
  return new Intl.DateTimeFormat('pl-PL', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** 2026-11-02 (atrybut datetime) */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
