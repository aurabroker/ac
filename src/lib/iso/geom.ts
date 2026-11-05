/**
 * Rzut izometryczny, wektory i okręgi w dowolnej płaszczyźnie — podstawa rysunków
 * izometrycznych (src/lib/iso/*). Układ sceny: oś x w prawo-w dół, oś y w lewo-w dół, z w górę
 * (jednostki sceny ≈ px przy skali 1); widz patrzy z kierunku (1, 1, 1).
 * Wszystko liczone w buildzie, deterministycznie — w przeglądarce nie ma JS do rysowania.
 */

export type V2 = readonly [number, number];
export type V3 = readonly [number, number, number];

export const C30 = Math.cos(Math.PI / 6);
export const S30 = 0.5;
export const TAU = Math.PI * 2;
/** Stopnie → radiany. */
export const deg = (d: number) => (d * Math.PI) / 180;

/** Punkt sceny 3D → płaszczyzna rysunku (przed skalowaniem kadru). */
export const iso = (x: number, y: number, z: number): V2 => [(x - y) * C30, (x + y) * S30 - z];
/** To samo dla punktu jako krotki. */
export const P = (p: V3): V2 => iso(p[0], p[1], p[2]);

/**
 * Odstęp poziomów warstw (jednostki z). Grupy „rozstrzelenia” leżą na wielokrotnościach G0,
 * więc linie konstrukcyjne między grupami skalują się o ten sam współczynnik (CSS: --iso-cl = 1 + STEP0/G0).
 */
export const G0 = 44;
/** Dodatkowe rozsunięcie grupy przy wejściu w widok (jednostki sceny na indeks grupy). */
export const STEP0 = 5;
/** Przesunięcie części „poza ochroną” (Item.out) przy wejściu w widok (jednostki sceny). */
export const OUT0 = 10;
/** Kierunek patrzenia (do odrzucania ścian tylnych i kolejności malowania). */
export const VIEW: V3 = [1, 1, 1];

/** Zaokrąglenie do 0,1 — krótki zapis, ostre linie. */
export const fx = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
};

/* ---------- wektory 3D ---------- */

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: V3): V3 => mul(a, 1 / len(a));
/** Iloczyn wektorowy 2D (znak orientacji na rysunku). */
export const cr2 = (a: V2, b: V2) => a[0] * b[1] - a[1] * b[0];
/** Rzut wektora (kierunku) 3D na rysunek — bez przesunięcia. */
export const dirP = (w: V3): V2 => [(w[0] - w[1]) * C30, (w[0] + w[1]) * S30 - w[2]];

export type AxisName = 'x' | 'y' | 'z';
export const AX: Record<AxisName, V3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
/**
 * Baza płaszczyzny prostopadłej do osi (u, v) — parametr kąta t liczony od u w stronę v:
 * oś z: u = +x, v = +y; oś x: u = +y, v = +z; oś y: u = +x, v = +z.
 */
export const BASIS: Record<AxisName, readonly [V3, V3]> = {
  x: [[0, 1, 0], [0, 0, 1]],
  y: [[1, 0, 0], [0, 0, 1]],
  z: [[1, 0, 0], [0, 1, 0]],
};

/** Oś jako nazwa albo wektor → wektor jednostkowy i baza (u, v). */
export function axisBasis(axis: AxisName | V3): { a: V3; u: V3; v: V3 } {
  if (typeof axis === 'string') return { a: AX[axis], u: BASIS[axis][0], v: BASIS[axis][1] };
  const a = unit(axis);
  const [x, y, z] = a.map(Math.abs);
  if (z > 0.999) return { a, u: [1, 0, 0], v: [0, 1, 0] };
  if (x > 0.999) return { a, u: [0, 1, 0], v: [0, 0, 1] };
  if (y > 0.999) return { a, u: [1, 0, 0], v: [0, 0, 1] };
  const u = unit(cross(a, [0, 0, 1]));
  return { a, u, v: cross(a, u) };
}

/* ---------- okrąg w dowolnej płaszczyźnie → elipsa na rysunku ---------- */

export interface Circ {
  /** Środek 3D i na rysunku. */
  c: V3;
  C: V2;
  /** Obraz wektorów bazy (·r) na rysunku. */
  U: V2;
  V: V2;
  rx: number;
  ry: number;
  /** Obrót półosi rx (stopnie, jak w SVG). */
  phi: number;
  /** Czy rosnące t biegnie przeciwnie do wskazówek na rysunku (oś y w dół). */
  ccw: boolean;
  /** Punkt na rysunku dla kąta t. */
  at: (t: number) => V2;
  /** Punkt 3D dla kąta t. */
  at3: (t: number) => V3;
}

/** Okrąg 3D o środku c, w płaszczyźnie (u, v), promienie r (wzdłuż u) i r2 (wzdłuż v; domyślnie r). */
export function circ(c: V3, u: V3, v: V3, r: number, r2 = r): Circ {
  const C = P(c);
  const pu = dirP(u);
  const pv = dirP(v);
  const U: V2 = [pu[0] * r, pu[1] * r];
  const V: V2 = [pv[0] * r2, pv[1] * r2];
  const a = U[0] * U[0] + V[0] * V[0];
  const b = U[0] * U[1] + V[0] * V[1];
  const d = U[1] * U[1] + V[1] * V[1];
  const m = (a + d) / 2;
  const q = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  return {
    c,
    C,
    U,
    V,
    rx: Math.sqrt(m + q),
    ry: Math.sqrt(Math.max(0, m - q)),
    phi: (0.5 * Math.atan2(2 * b, a - d) * 180) / Math.PI,
    ccw: cr2(U, V) > 0,
    at: (t) => [C[0] + U[0] * Math.cos(t) + V[0] * Math.sin(t), C[1] + U[1] * Math.cos(t) + V[1] * Math.sin(t)],
    at3: (t) => add(c, add(mul(u, r * Math.cos(t)), mul(v, r2 * Math.sin(t)))),
  };
}
