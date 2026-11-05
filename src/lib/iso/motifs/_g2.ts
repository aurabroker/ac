/**
 * Pomocnicze kształty motywów grupy 2 (przekładnia, zamek, pompa, kaseta) — lżejsze od wersji z prims.ts
 * tam, gdzie miniatura musi zmieścić się w ~4 KB gz. Tylko prymitywy Sketch, role i tony z fundamentu.
 */
import { P, Sketch, arcSegs, circ, deg, type V2, type V3 } from '../prims.ts';
import type { MotifInput, Role, Seg, Tone } from '../scene.ts';

const TOP: Record<Tone, Role> = { ink: 'top', hi: 'top-hi', sig: 'top-sig' };
const SIDE: Record<Tone, Role> = { ink: 'side-r', hi: 'side-hi', sig: 'side-sig' };

export { slotTone } from '../prims.ts';

/** Prostokąt w płaszczyźnie z. */
export const rectZ = (x0: number, y0: number, x1: number, y1: number, z: number): V3[] => [
  [x0, y0, z],
  [x1, y0, z],
  [x1, y1, z],
  [x0, y1, z],
];

/** Otoczka wypukła punktów rysunku (łańcuch monotoniczny). */
export function hull(pts: V2[]): V2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: V2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** Obrys ochrony dowolnym wielokątem (gdy prostokąt z plate() nie omija części „poza ochroną”). */
export function protectPoly(s: Sketch, pts: V2[], z: number, g = 0) {
  s.poly(
    g,
    'fine-d',
    pts.map(([x, y]) => [x, y, z] as V3),
  );
}

export interface GearLiteOpt {
  teeth: number;
  m: number;
  thk: number;
  tone?: Tone;
  phase?: number;
  missing?: number[];
  /** Promień otworu na wał (wnętrze piasty). */
  bore?: number;
  /** Okrąg piasty na wierzchu. */
  hub?: number;
  /** Otwory odciążające (koło duże): liczba i promień. */
  holes?: { n: number; r: number; at: number; phase?: number };
}

export interface GearLite {
  rp: number;
  ra: number;
  rr: number;
  zt: number;
  step: number;
  /** Kąt (stopnie) środka zęba i. */
  angle: (i: number) => number;
  /** Punkt 3D na zadanym promieniu i kącie (stopnie), na wysokości z (domyślnie wierzch). */
  at: (r: number, a: number, z?: number) => V3;
  /** Zarys jednego zęba (4 punkty) na wysokości z. */
  tooth: (i: number, z: number, dr?: number) => V3[];
}

/**
 * Lekkie koło zębate o osi pionowej: wierzch z zębami (pełny zarys) + przednia połowa dolnego zarysu jako
 * ściana boczna (tylna połowa i tak leży pod wierzchem). Bez osobnych ścian zębów — ~40% mniej punktów niż gear().
 */
export function gearLite(s: Sketch, g: number, c: V3, o: GearLiteOpt): GearLite {
  const N = o.teeth;
  const rp = (o.m * N) / 2;
  const ra = rp + o.m;
  const rr = rp - 1.15 * o.m;
  const step = 360 / N;
  const ph = o.phase ?? 0;
  const miss = new Set(o.missing ?? []);
  const tone = o.tone ?? 'ink';
  const zt = c[2] + o.thk;
  const at = (r: number, a: number, z = zt): V3 => [c[0] + r * Math.cos(deg(a)), c[1] + r * Math.sin(deg(a)), z];
  const tooth = (i: number, z: number, dr = 0): V3[] => {
    const a = ph + i * step;
    return [at(rr + dr, a - 0.27 * step, z), at(ra + dr, a - 0.13 * step, z), at(ra + dr, a + 0.13 * step, z), at(rr + dr, a + 0.27 * step, z)];
  };
  const outline = (z: number, from = 0, to = N): V3[] => {
    const pts: V3[] = [];
    for (let k = from; k < to; k++) {
      const i = ((k % N) + N) % N;
      if (miss.has(i)) {
        const a = ph + i * step;
        pts.push(at(rr, a - 0.27 * step, z), at(rr, a + 0.27 * step, z));
      } else pts.push(...tooth(i, z));
    }
    return pts;
  };
  // ściana boczna: pasek walca u stóp zębów + dla każdego zęba z przodu otoczka (wypukła) zęba dolnego i górnego
  s.cylZ(g, c, o.thk, rr, { tone, noCap: true });
  for (let i = 0; i < N; i++) {
    if (miss.has(i)) continue;
    const a = ((((ph + i * step + 70) % 360) + 360) % 360) - 70;
    if (a > 150) continue;
    s.poly2(g, SIDE[tone], hull([...tooth(i, c[2]), ...tooth(i, zt)].map(P)));
  }
  s.poly(g, TOP[tone], outline(zt));
  if (o.holes) {
    const h = o.holes;
    for (let j = 0; j < h.n; j++) s.ell(g, 'bore', at(h.at, (h.phase ?? 45) + (360 * j) / h.n), 'z', h.r);
  }
  if (o.hub) s.ell(g, 'fine', [c[0], c[1], zt], 'z', o.hub);
  if (o.bore) s.ell(g, 'bore', [c[0], c[1], zt], 'z', o.bore);
  return { rp, ra, rr, zt, step, angle: (i) => ph + i * step, at, tooth };
}

/** Faza koła b (stopnie): w kierunku styku theta (od a do b) ząb a trafia w lukę b. */
export function meshPh(a: { teeth: number; m: number; phase: number }, b: { teeth: number; m: number }, theta: number): number {
  const stA = 360 / a.teeth;
  const stB = 360 / b.teeth;
  let d = (((theta - a.phase) % stA) + stA) % stA;
  if (d > stA / 2) d -= stA;
  return theta + 180 - (d * a.teeth) / b.teeth + stB / 2;
}

/** Indeks zęba najbliższego kierunkowi a (stopnie). */
export function toothNear(teeth: number, phase: number, a: number): number {
  const st = 360 / teeth;
  return ((Math.round((a - phase) / st) % teeth) + teeth) % teeth;
}

/** Gniazdo we wkładce: wielokąt (V3[] na wysokości ściany) albo okrąg {c, r}. */
export type Hole = V3[] | { c: V3; r: number; post?: number };

const ellD = (c: V3, r: number) => {
  const e = circ(c, [1, 0, 0], [0, 1, 0], r);
  const p = e.at(0);
  const a = arcSegs(e, 0, Math.PI * 2);
  return { d: [['M', p[0], p[1]] as const, ...a.d, ['Z'] as const], bb: a.bb };
};

/**
 * Wkładka z gniazdami na wymiar (górna ściana z = c): wnęki (dno + widoczne ścianki), potem ściana z otworami
 * (evenodd). Okrągłe gniazdo: ścianka = elipsa krawędzi, dno = elipsa niżej (półksiężyc ścianki widać z tyłu).
 * simple — same dna (jedna ścieżka dla wszystkich gniazd), bez ścianek: lżejsza miniatura.
 */
export function insertWithHoles(s: Sketch, g: number, outer: V3[], holes: Hole[], depth: number, top: Role = 'top', simple = false) {
  for (const h of holes) {
    if (Array.isArray(h) && simple) s.poly(g, 'bore', h.map((p): V3 => [p[0], p[1], p[2] - depth]));
    else if (Array.isArray(h)) s.pocket(g, null, h, depth);
    else {
      s.ell(g, 'side-l', h.c, 'z', h.r);
      s.ell(g, 'bore', [h.c[0], h.c[1], h.c[2] - depth], 'z', h.r);
      if (h.post) s.cylZ(g, [h.c[0], h.c[1], h.c[2] - depth], depth, h.post);
    }
  }
  const d: Seg[] = [];
  const bb: V2[] = [];
  const poly = (pts: V3[]) => {
    const p = pts.map(P);
    d.push(['M', p[0][0], p[0][1]], ...p.slice(1).map((q): Seg => ['L', q[0], q[1]]), ['Z']);
    bb.push(...p);
  };
  poly(outer);
  for (const h of holes) {
    if (Array.isArray(h)) poly(h);
    else {
      const e = ellD(h.c, h.r);
      d.push(...(e.d as Seg[]));
    }
  }
  s.add(g, top, d, bb, { eo: true });
}

/** Skrzynka kasety: dwie widoczne ściany boczne (x = x1, y = y1) — wierzch rysuje insertWithHoles. */
export function caseSides(s: Sketch, g: number, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number) {
  s.poly(g, 'side-r', [[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]]);
  s.poly(g, 'side-l', [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]);
}
