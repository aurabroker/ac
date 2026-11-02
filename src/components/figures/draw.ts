/**
 * Geometria rysunków technicznych (agent „figures”). Czyste funkcje zwracające dane ścieżek SVG —
 * rysunki liczą współrzędne w buildzie, więc linie są dokładne, a pliki .astro zostają czytelne.
 *
 * Układ: oś y w dół (jak w SVG). Kąty w stopniach. Elipsa rzutu (widok z góry pod kątem):
 *   P(θ) = (cx + rx·cos θ, cy + ry·sin θ) — θ = 0 prawo, 90 przód (bliżej widza), 180 lewo, 270 tył.
 */

export type Pt = readonly [number, number];

/** Zaokrąglenie do 0,01 — krótszy HTML, bez utraty ostrości. */
export const f = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
export const p = (x: number, y: number): string => `${f(x)} ${f(y)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Punkt na elipsie. */
export function ep(cx: number, cy: number, rx: number, ry: number, deg: number): Pt {
  return [cx + rx * Math.cos(rad(deg)), cy + ry * Math.sin(rad(deg))];
}

/** Łuk elipsy od a0 do a1 (a1 > a0, zgodnie z ruchem wskazówek na ekranie). `move` = zacznij od M. */
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, move = true): string {
  const [x0, y0] = ep(cx, cy, rx, ry, a0);
  const out: string[] = move ? [`M${p(x0, y0)}`] : [];
  // dzielimy na kawałki ≤ 180°, żeby flaga large-arc była jednoznaczna
  let a = a0;
  while (a1 - a > 1e-6) {
    const b = Math.min(a1, a + 179.9);
    const [x, y] = ep(cx, cy, rx, ry, b);
    out.push(`A${f(rx)} ${f(ry)} 0 0 1 ${p(x, y)}`);
    a = b;
  }
  return out.join('');
}

/** Pełna elipsa jako ścieżka. */
export const ellipse = (cx: number, cy: number, rx: number, ry: number): string => arc(cx, cy, rx, ry, 0, 360) + 'Z';

/** Okrąg jako ścieżka (np. kilka balonów w jednym <path>). */
export const circle = (cx: number, cy: number, r: number): string =>
  `M${p(cx - r, cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/** Łamana. */
export const poly = (pts: readonly Pt[], close = false): string =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${p(x, y)}`).join('') + (close ? 'Z' : '');

/** Odcinek. */
export const seg = (a: Pt, b: Pt): string => `M${p(a[0], a[1])}L${p(b[0], b[1])}`;

/**
 * Grot strzałki (wypełniony trójkąt, smukły 1:3 wg ISO 129) z ostrzem w (x, y),
 * skierowany pod kątem `deg` (0 = w prawo, 90 = w dół).
 */
export function head(x: number, y: number, deg: number, len = 7, half = 1.25): string {
  const a = rad(deg);
  const bx = x - len * Math.cos(a);
  const by = y - len * Math.sin(a);
  const nx = -Math.sin(a) * half;
  const ny = Math.cos(a) * half;
  return `M${p(x, y)}L${p(bx + nx, by + ny)}L${p(bx - nx, by - ny)}Z`;
}

/** Ukośna kreska wymiarowa (architektoniczna) w punkcie (x, y). */
export const tick = (x: number, y: number, s = 3.5): string => `M${p(x - s, y + s)}L${p(x + s, y - s)}`;

/** Wymiar poziomy: linia z grotami między x1 a x2 na wysokości y. Zwraca linię i groty. */
export function dimH(x1: number, x2: number, y: number, len = 7) {
  return { line: `M${p(x1, y)}H${f(x2)}`, heads: head(x1, y, 180, len) + head(x2, y, 0, len) };
}

/** Wymiar pionowy: linia z grotami między y1 (góra) a y2 (dół). */
export function dimV(x: number, y1: number, y2: number, len = 7) {
  return { line: `M${p(x, y1)}V${f(y2)}`, heads: head(x, y1, 270, len) + head(x, y2, 90, len) };
}

/**
 * Kreskowanie przekroju: linie pod kątem `deg` co `gap`, przycięte do wielokąta (reguła even-odd).
 * Zwraca jedną ścieżkę (dla klasy .x — kreskowania nie animujemy).
 */
export function hatch(polygon: readonly Pt[], gap = 5, deg = 45, inset = 0): string {
  const a = rad(deg);
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  // współrzędna „wzdłuż normalnej” — kolejne linie kreskowania
  const nx = -uy;
  const ny = ux;
  const proj = polygon.map(([x, y]) => x * nx + y * ny);
  const min = Math.min(...proj);
  const max = Math.max(...proj);
  const out: string[] = [];
  const start = Math.ceil(min / gap) * gap;
  for (let d = start; d <= max; d += gap) {
    // przecięcia linii {P: P·n = d} z krawędziami
    const ts: number[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[(i + 1) % polygon.length];
      const d1 = x1 * nx + y1 * ny - d;
      const d2 = x2 * nx + y2 * ny - d;
      if ((d1 < 0 && d2 >= 0) || (d1 >= 0 && d2 < 0)) {
        const t = d1 / (d1 - d2);
        const ix = x1 + t * (x2 - x1);
        const iy = y1 + t * (y2 - y1);
        ts.push(ix * ux + iy * uy);
      }
    }
    ts.sort((m, n) => m - n);
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const s0 = ts[i] + inset;
      const s1 = ts[i + 1] - inset;
      if (s1 - s0 < 1) continue;
      const bx = d * nx;
      const by = d * ny;
      out.push(`M${p(bx + s0 * ux, by + s0 * uy)}L${p(bx + s1 * ux, by + s1 * uy)}`);
    }
  }
  return out.join('');
}

/** Wielokąt przybliżający łuk elipsy (do kreskowania obszarów z krzywymi). */
export function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(ep(cx, cy, rx, ry, a0 + ((a1 - a0) * i) / n));
  return pts;
}

/**
 * Walec (tarcza) w rzucie: górna elipsa w (cx, cy), wysokość h.
 * fill — sylwetka do zasłaniania (klasa .f), edges — krawędzie widoczne (klasa .o).
 */
export function cylinder(cx: number, cy: number, rx: number, ry: number, h: number) {
  const fill = `M${p(cx - rx, cy)}${arc(cx, cy, rx, ry, 180, 360, false)}V${f(cy + h)}${arc(cx, cy + h, rx, ry, 0, 180, false)}Z`;
  const edges = ellipse(cx, cy, rx, ry) + `M${p(cx - rx, cy)}V${f(cy + h)}M${p(cx + rx, cy)}V${f(cy + h)}` + arc(cx, cy + h, rx, ry, 0, 180);
  return { fill, edges };
}

/** Linia śrubowa (sprężyna) — część przednia i tylna osobno. */
export function helix(cx: number, yBottom: number, r: number, k: number, turns: number, pitch: number, step = 6) {
  const front: string[] = [];
  const back: string[] = [];
  let cur: string[] = [];
  let curFront: boolean | null = null;
  const total = turns * 360;
  for (let t = 0; t <= total + 1e-6; t += step) {
    const x = cx + r * Math.cos(rad(t + 180));
    const y = yBottom - (pitch * t) / 360 + r * k * Math.sin(rad(t + 180));
    const isFront = Math.sin(rad(t + 180)) >= 0;
    if (curFront === null) curFront = isFront;
    if (isFront !== curFront) {
      cur.push(p(x, y));
      (curFront ? front : back).push('M' + cur.join('L'));
      cur = [];
      curFront = isFront;
    }
    cur.push(p(x, y));
  }
  if (cur.length > 1) (curFront ? front : back).push('M' + cur.join('L'));
  return { front: front.join(''), back: back.join('') };
}

/** Szerokość etykiety Plex Mono (0,6 em + odstęp liter) — do rozmieszczania tekstu. */
export const textW = (s: string, size = 11, tracking = 0.06): number => s.length * size * (0.6 + tracking);

/** Chmurka rewizyjna (redline) wokół punktu: N łuków na okręgu o promieniu r. */
export function cloud(cx: number, cy: number, r: number, n = 9): string {
  const pts = Array.from({ length: n }, (_, i) => ep(cx, cy, r, r, (360 * i) / n - 90));
  const chord = 2 * r * Math.sin(Math.PI / n);
  const br = chord * 0.62;
  return `M${p(pts[0][0], pts[0][1])}` + pts.map((_, i) => {
    const [x, y] = pts[(i + 1) % n];
    return `A${f(br)} ${f(br)} 0 0 1 ${p(x, y)}`;
  }).join('') + 'Z';
}
