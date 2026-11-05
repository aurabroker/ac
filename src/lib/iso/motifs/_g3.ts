/**
 * Pomocnicze kształty motywów grupy 3 (maszyna AI, przenośnik, żuraw, stół) — prywatne dla tych plików.
 * Tylko złożenia z prims.ts: bez nowych ról, kolorów i zmian w render.ts.
 */
import { P, STEP0, Sketch, deg, faceRole, faces, lineRole, type Faces, type V2, type V3 } from '../prims.ts';
import type { Role, Seg, Tone } from '../scene.ts';

/**
 * Pionowa linia konstrukcyjna rozstrzelenia (rola 'cl') od wierzchu części dolnej (grupa g) do spodu górnej
 * (grupa g + dg). Należy do grupy dolnej i wchodzi pod część górną o dg·STEP0 (zasłania ją część górna, malowana
 * później) — po rozsunięciu w nagłówku sięga dokładnie do spodu części górnej, w miniaturze jest schowana.
 */
export function guide(s: Sketch, g: number, dg: number, x: number, y: number, z0: number, z1: number) {
  s.line(g, 'cl', [x, y, z0], [x, y, z1 + dg * STEP0]);
}

/** Kilka odcinków jedną pozycją (jedna rola → jedna ścieżka, mniej bajtów niż osobne linie). */
export function segs(s: Sketch, g: number, role: Role, list: [V3, V3][]) {
  const d: Seg[] = [];
  const bb: V2[] = [];
  for (const [a, b] of list) {
    const A = P(a);
    const B = P(b);
    d.push(['M', A[0], A[1]], ['L', B[0], B[1]]);
    bb.push(A, B);
  }
  s.add(g, role, d, bb);
}

export interface SeatOpt {
  /** Strona oparcia. */
  back: '-y' | '+y' | '-x' | '+x';
  /** Bok siedziska, wysokość wierzchu siedziska nad podłogą, wysokość oparcia nad siedziskiem. */
  S?: number;
  sh?: number;
  bh?: number;
  tone?: Tone;
  legs?: boolean;
}

export type Box = readonly [number, number, number, number, number, number];

/**
 * Kilka prostopadłościanów naraz, ściany zebrane wg roli (najpierw wszystkie ściany x, potem y, potem góry):
 * jedna ścieżka na rolę zamiast trzech na bryłę. Tylko dla brył, których rzuty na siebie nie zachodzą.
 */
export function boxes(s: Sketch, g: number, list: readonly Box[], f: Faces = 'ink', o: { top?: boolean } = {}) {
  const rx = faceRole([1, 0, 0], f);
  const ry = faceRole([0, 1, 0], f);
  const rt = faceRole([0, 0, 1], f);
  for (const [x0, y0, z0, w, d, h] of list)
    if (h > 0) s.poly(g, rx, [[x0 + w, y0, z0 + h], [x0 + w, y0 + d, z0 + h], [x0 + w, y0 + d, z0], [x0 + w, y0, z0]]);
  for (const [x0, y0, z0, w, d, h] of list)
    if (h > 0) s.poly(g, ry, [[x0, y0 + d, z0 + h], [x0 + w, y0 + d, z0 + h], [x0 + w, y0 + d, z0], [x0, y0 + d, z0]]);
  if (o.top !== false)
    for (const [x0, y0, z0, w, d, h] of list) s.poly(g, rt, [[x0, y0, z0 + h], [x0 + w, y0, z0 + h], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]]);
}

/**
 * Rząd pustych krzeseł (siedzisko i oparcie jako płytki, cztery nogi) z oparciem po tej samej stronie; środki
 * siedzisk xs × cy, podłoga z. Ściany zebrane wg roli (krzesła w rzędzie nie zachodzą na siebie).
 * Zwraca kotwice każdego krzesła: góra oparcia (prawy skraj) i prawy przedni róg siedziska.
 */
export function seats(s: Sketch, g: number, cs: readonly (readonly [number, number])[], z: number, o: SeatOpt) {
  const S = o.S ?? 18;
  const zS = z + (o.sh ?? 16);
  const bh = o.bh ?? 16;
  const f = faces(o.tone ?? 'ink');
  const near = o.back === '+y' || o.back === '+x';
  const legs: [V3, V3][] = [];
  const backs: Box[] = [];
  const pans: Box[] = [];
  const out: { top: V3; front: V3 }[] = [];
  for (const [cx, cy] of cs) {
    const x0 = cx - S / 2;
    const y0 = cy - S / 2;
    for (const [x, y] of [[x0 + 2, y0 + 2], [x0 + S - 2, y0 + 2], [x0 + S - 2, y0 + S - 2], [x0 + 2, y0 + S - 2]]) legs.push([[x, y, z], [x, y, zS - 3]]);
    backs.push(
      o.back === '-y'
        ? [x0, y0 - 3, zS - 3, S, 3, bh + 3]
        : o.back === '+y'
          ? [x0, y0 + S, zS - 3, S, 3, bh + 3]
          : o.back === '+x'
            ? [x0 + S, y0, zS - 3, 3, S, bh + 3]
            : [x0 - 3, y0, zS - 3, 3, S, bh + 3],
    );
    pans.push([x0, y0, zS - 3, S, S, 3]);
    out.push({
      top:
        o.back === '-y'
          ? [x0 + S, y0 - 1.5, zS + bh - 3]
          : o.back === '+y'
            ? [x0 + S, y0 + S + 3, zS + bh * 0.6]
            : o.back === '+x'
              ? [x0 + S + 3, y0 + S * 0.5, zS + bh * 0.6]
              : [x0 - 1.5, y0 + S, zS + bh - 3],
      front: [x0 + S, y0 + S, zS - 1.5],
    });
  }
  if (o.legs !== false) segs(s, g, o.tone === 'sig' ? lineRole('sig') : 'edge', legs);
  if (!near) boxes(s, g, backs, f);
  boxes(s, g, pans, f);
  if (near) boxes(s, g, backs, f);
  return out;
}

/**
 * Koło zębate o osi y (w płaszczyźnie xz) — ten sam zarys zęba co gear() z prims.ts (stopa rp − 1,2m, wierzchołek rp + m),
 * grubość thk w +y od c. Lekko: tylna ściana (przesunięta, szara) + przednia z zębami, bez ścian bocznych zębów.
 * phase — kąt (°) zęba 0 od osi +x w stronę +z.
 */
export function vgear(s: Sketch, g: number, c: V3, o: { teeth: number; m: number; thk: number; tone?: Tone; phase?: number; hub?: number; bore?: number }) {
  const N = o.teeth;
  const rp = (o.m * N) / 2;
  const ra = rp + o.m;
  const rr = rp - 1.2 * o.m;
  const st = (2 * Math.PI) / N;
  const ph = deg(o.phase ?? 0);
  const f = faces(o.tone ?? 'ink');
  const outline = (y: number): V3[] => {
    const pts: V3[] = [];
    const at = (r: number, a: number): V3 => [c[0] + r * Math.cos(a), y, c[2] + r * Math.sin(a)];
    for (let i = 0; i < N; i++) {
      const a = ph + i * st;
      pts.push(at(rr, a - 0.28 * st), at(ra, a - 0.15 * st), at(ra, a + 0.15 * st), at(rr, a + 0.28 * st));
    }
    return pts;
  };
  s.poly(g, f.x, outline(c[1]));
  s.poly(g, f.top, outline(c[1] + o.thk));
  const yf = c[1] + o.thk;
  if (o.hub) s.ell(g, 'fine', [c[0], yf, c[2]], 'y', o.hub);
  if (o.bore) s.ell(g, 'bore', [c[0], yf, c[2]], 'y', o.bore);
  return { rp, ra, rr, front: yf, phase: o.phase ?? 0, teeth: N, m: o.m };
}
