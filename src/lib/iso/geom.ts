/**
 * Rzut izometryczny i drobne narzędzia rysunków „układ scalony” (src/lib/iso/*).
 * Układ sceny: oś x w prawo-w dół, oś y w lewo-w dół, z w górę (jednostki sceny ≈ px przy skali 1).
 * Wszystko liczone w buildzie — w przeglądarce nie ma JS do rysowania.
 */

export type V2 = readonly [number, number];
export type V3 = readonly [number, number, number];

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;

/** Punkt sceny 3D → płaszczyzna rysunku (przed skalowaniem kadru). */
export const iso = (x: number, y: number, z: number): V2 => [(x - y) * C30, (x + y) * S30 - z];

/** Półosie elipsy, w którą rzutuje się okrąg o promieniu r leżący w płaszczyźnie XY. */
export const isoCircle = (r: number) => ({ rx: r * C30 * Math.SQRT2, ry: r * S30 * Math.SQRT2 });

/** Wektor jednostkowy osi x i y sceny na rysunku (do macierzy napisów „wygrawerowanych” na górnej ścianie). */
export const AXIS_X: V2 = [C30, S30];
export const AXIS_Y: V2 = [-C30, S30];

/**
 * Odstęp poziomów warstw (jednostki z). Wszystkie grupy „rozstrzelenia” leżą na wielokrotnościach G0,
 * więc linie konstrukcyjne między grupami skalują się o ten sam współczynnik (CSS: --iso-cl).
 */
export const G0 = 44;
/** Dodatkowe rozsunięcie grupy przy wejściu w widok (jednostki z na indeks grupy). */
export const STEP0 = 5;

/** Zaokrąglenie do 0,1 — krótki zapis, ostre linie. */
export const fx = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
};

/** FNV-1a (32 bit) — ziarno z adresu strony. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministyczny generator (mulberry32). */
export function rng(seed: string) {
  let a = hash(seed) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Liczba całkowita z [min, max]. */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}
export type Rng = ReturnType<typeof rng>;
