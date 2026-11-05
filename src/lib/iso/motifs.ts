/**
 * Motywy rysunków „układ scalony” w rzucie izometrycznym (widok rozstrzelony):
 *   stack — płytka → kulki BGA → podłoże → rdzeń → pokrywa,
 *   qfp   — obudowa QFP nad płytką, wyprowadzenia jako moduły,
 *   pcb   — przebieg ścieżek z przelotkami przez układ, opcjonalny czerwony odcinek „awarii”,
 *   bga   — podłoże z matrycą kulek (flip-chip), rdzeń nad nim, wyróżnione kulki.
 * Wynik: elementy w kolejności malowania (malarz: od tyłu i od dołu), żądania etykiet i napisy na obudowach.
 * Grupa `g` = poziom rozstrzelenia (z = g·G0); CSS przesuwa grupę o g·STEP0 przy wejściu w widok.
 */
import { iso, isoCircle, G0, type Rng, type V2, type V3 } from './geom.ts';

export type Motif = 'stack' | 'qfp' | 'pcb' | 'bga';

export type Role =
  | 'top'
  | 'top-hi'
  | 'side-r'
  | 'side-l'
  | 'edge'
  | 'fine'
  | 'fine-d'
  | 'cl'
  | 'proj'
  | 'trace'
  | 'trace-hi'
  | 'fault'
  | 'pad'
  | 'pad-hi'
  | 'pad-sig'
  | 'ball'
  | 'ball-hi'
  | 'ball-sig'
  | 'pin'
  | 'pin-hi'
  | 'pin-sig'
  | 'via'
  | 'die-line';

export type Shape = { t: 'poly'; pts: V2[]; closed: boolean } | { t: 'ell'; c: V2; rx: number; ry: number };

export interface Item {
  g: number;
  role: Role;
  shape: Shape;
  /** Linia konstrukcyjna między grupami — rozciąga się przy rozstrzeleniu (CSS: .iso-cl). */
  stretch?: boolean;
}

export type Tone = 'ink' | 'hi' | 'sig';

export interface LabelReq {
  text: string;
  at: V2;
  side: 'r' | 'l';
  g: number;
  tone: Tone;
}

/** Napis „wygrawerowany” na górnej ścianie obudowy (czytany wzdłuż osi x sceny). */
export interface Mark {
  text: string;
  at: V3;
  /** Wysokość pisma w jednostkach sceny. */
  size: number;
  /** Największa długość napisu (jednostki sceny) — dłuższy jest zmniejszany. */
  max: number;
  g: number;
}

export interface Scene {
  items: Item[];
  labels: LabelReq[];
  marks: Mark[];
}

export interface MotifInput {
  /** Etykiety modułów (najważniejsze pierwsze). */
  labels: string[];
  /** Wejścia po lewej (pcb). */
  inputs: string[];
  chip?: string;
  /** Podpis czerwonego akcentu (np. „WYŁĄCZENIA”). */
  fault?: string;
  calm?: boolean;
  /** Ile etykiet zmieści kadr (bez wejść pcb). */
  maxLabels: number;
  maxInputs: number;
}

/* ---------- prymitywy ---------- */

const poly = (pts: V3[], closed = true): Shape => ({ t: 'poly', pts: pts.map((p) => iso(...p)), closed });
const ell = (x: number, y: number, z: number, r: number): Shape => ({ t: 'ell', c: iso(x, y, z), ...isoCircle(r) });
const rectZ = (x0: number, y0: number, x1: number, y1: number, z: number): Shape =>
  poly([
    [x0, y0, z],
    [x1, y0, z],
    [x1, y1, z],
    [x0, y1, z],
  ]);
const pathZ = (pts: [number, number][], z: number): Shape => poly(pts.map(([x, y]) => [x, y, z] as V3), false);

class Builder {
  items: Item[] = [];
  labels: LabelReq[] = [];
  marks: Mark[] = [];
  add(g: number, role: Role, shape: Shape, stretch = false) {
    this.items.push({ g, role, shape, stretch: stretch || undefined });
  }
  /** Prostopadłościan: ściana prawa (x = x1), lewa/przednia (y = y1), górna. */
  slab(g: number, x0: number, y0: number, w: number, d: number, z: number, h: number, top: Role = 'top') {
    const x1 = x0 + w;
    const y1 = y0 + d;
    const zt = z + h;
    this.add(g, 'side-r', poly([[x1, y0, zt], [x1, y1, zt], [x1, y1, z], [x1, y0, z]]));
    this.add(g, 'side-l', poly([[x0, y1, zt], [x1, y1, zt], [x1, y1, z], [x0, y1, z]]));
    this.add(g, top, rectZ(x0, y0, x1, y1, zt));
  }
  /**
   * Pionowa linia konstrukcyjna od górnej ściany płytki (grupa 0) w górę o n·G0 — do spodu grupy n.
   * Malowana po płytce, przed wyższymi warstwami (one ją zasłaniają).
   */
  vline(x: number, y: number, zBoard: number, n: number, role: Role = 'cl') {
    this.add(0, role, poly([[x, y, zBoard], [x, y, zBoard + n * G0]], false), true);
  }
  label(text: string | undefined, at: V3 | V2, side: 'r' | 'l', g: number, tone: Tone) {
    if (!text) return;
    this.labels.push({ text, at: at.length === 3 ? iso(...(at as V3)) : (at as V2), side, g, tone });
  }
  done(): Scene {
    return { items: this.items, labels: this.labels, marks: this.marks };
  }
}

/** Prawy skraj elipsy (kotwica odnośnika do kulki/pola). */
const rightOf = (x: number, y: number, z: number, r: number): V2 => {
  const [cx, cy] = iso(x, y, z);
  return [cx + isoCircle(r).rx, cy];
};

/* ---------- (a) rozstrzelony stos warstw ---------- */

export function stack(m: MotifInput, r: Rng): Scene {
  const b = new Builder();
  const hi = !m.calm;
  const T = 8; // górna ściana płytki; grupa g leży na T + g·G0
  const Z = (g: number) => T + g * G0;

  // 0 — płytka z odcinkami ścieżek przy krawędziach
  b.slab(0, 0, 0, 200, 200, 0, T);
  b.add(0, 'fine-d', rectZ(40, 40, 160, 160, T));
  for (let t = 0; t < 5; t++) {
    const y = 22 + t * 38;
    if (r.chance(0.8)) {
      const len = r.int(16, 30);
      b.add(0, 'trace', pathZ([[0, y], [len, y]], T));
      if (r.chance(0.5)) b.add(0, 'via', ell(len + 3, y, T, 2.6));
    }
    if (r.chance(0.8)) {
      const len = r.int(16, 30);
      b.add(0, 'trace', pathZ([[200 - len, y + 8], [200, y + 8]], T));
      if (r.chance(0.5)) b.add(0, 'via', ell(200 - len - 3, y + 8, T, 2.6));
    }
  }
  // narożniki obudowy: od płytki do spodu pokrywy (5·G0)
  for (const [x, y] of [
    [40, 40],
    [160, 40],
    [160, 160],
    [40, 160],
  ] as const)
    b.vline(x, y, T, 5);

  // 1 — warstwa kulek BGA (wyróżnione: skupisko przy prawym narożniku)
  b.slab(1, 40, 40, 120, 120, Z(1), 4);
  const ci = r.int(3, 4);
  const cj = r.int(0, 2);
  const cluster = new Set([`${ci},${cj}`, `${ci + 1},${cj}`, `${ci},${cj + 1}`, `${ci + 1},${cj + 1}`]);
  if (r.chance(0.5)) cluster.delete(`${ci},${cj + 1}`);
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++) b.add(1, hi && cluster.has(`${i},${j}`) ? 'ball-hi' : 'ball', ell(50 + i * 20, 50 + j * 20, Z(1) + 4, 4.4));

  // 2 — podłoże
  b.slab(2, 40, 40, 120, 120, Z(2), 8);
  b.add(2, 'fine', rectZ(52, 52, 148, 148, Z(2) + 8));

  // 3 — rdzeń
  const dw = r.pick([56, 60, 64]);
  const d0 = 100 - dw / 2;
  b.slab(3, d0, d0, dw, dw, Z(3), 6, hi ? 'top-hi' : 'top');
  const lines = r.int(3, 5);
  for (let t = 0; t < lines; t++) {
    const x = d0 + 8 + (t * (dw - 16)) / (lines - 1);
    b.add(3, hi ? 'die-line' : 'fine', pathZ([[x, d0 + 6], [x, d0 + dw - 6]], Z(3) + 6));
  }

  // 5 — pokrywa (poziom 4 pusty: więcej światła nad rdzeniem)
  b.slab(5, 40, 40, 120, 120, Z(5), 10);
  b.add(5, 'fine', ell(52, 52, Z(5) + 10, 3));

  // etykiety: pokrywa = czerwony akcent (wyłączenia), dalej moduły: rdzeń, podłoże, kulki, płytka
  const slots: { g: number; at: V3; tone: Tone }[] = [
    { g: 3, at: [d0 + dw, d0, Z(3) + 3], tone: hi ? 'hi' : 'ink' },
    { g: 2, at: [160, 40, Z(2) + 4], tone: 'ink' },
    { g: 1, at: [160, 40, Z(1) + 2], tone: 'ink' },
    { g: 0, at: [200, 0, T / 2], tone: 'ink' },
  ];
  let budget = m.maxLabels;
  if (m.fault && budget > 0) {
    b.label(m.fault, [160, 40, Z(5) + 5], 'r', 5, hi ? 'sig' : 'ink');
    budget--;
  }
  // rozkład etykiet na warstwy zależnie od ich liczby (płytka zawsze jako podstawa)
  const n = Math.min(budget, m.labels.length, slots.length);
  const use = [[], [0], [0, 3], [0, 1, 3], [0, 1, 2, 3]][n];
  use.forEach((si, i) => b.label(m.labels[i], slots[si].at, 'r', slots[si].g, slots[si].tone));
  return b.done();
}

/* ---------- (b) obudowa QFP nad płytką ---------- */

export function qfp(m: MotifInput, r: Rng): Scene {
  const b = new Builder();
  const hi = !m.calm;
  const B = 210; // płytka
  const T = 6;
  const P0 = 55;
  const P1 = 155; // obudowa
  const n = r.int(6, 8);
  const pitch = (P1 - P0) / (n + 1);
  const pos = Array.from({ length: n }, (_, i) => P0 + pitch * (i + 1));
  const zb = T + 2 * G0; // spód obudowy (grupa 2) = poziom stopek wyprowadzeń
  const zm = zb + 6;

  // podpisane wyprowadzenia na prawej ścianie (x = P1): od prawego narożnika, co drugie
  const nLab = Math.min(m.labels.length, m.maxLabels - (m.fault ? 1 : 0));
  const want = nLab + (m.fault ? 1 : 0);
  const stride = want * 2 - 1 <= n ? 2 : 1;
  const start = (want - 1) * stride + 1 < n && r.chance(0.5) ? 1 : 0;
  const tagged = new Map<number, Tone>();
  for (let k = 0; k < want; k++) tagged.set(start + k * stride, m.fault && k === want - 1 ? 'sig' : 'hi');

  // płytka, pola lutownicze, ścieżki
  b.slab(0, 0, 0, B, B, 0, T);
  b.add(0, 'fine-d', rectZ(P0, P0, P1, P1, T));
  pos.forEach((p, i) => {
    const tone = hi ? tagged.get(i) : undefined;
    b.add(0, tone === 'hi' ? 'pad-hi' : tone === 'sig' ? 'pad-sig' : 'pad', rectZ(P1 + 9, p - 1.8, P1 + 16, p + 1.8, T));
    if (tone === 'hi' || r.chance(0.55)) {
      const jog = tone ? 0 : r.pick([0, 0, 6, -6]);
      const x2 = P1 + 26;
      const pts: [number, number][] = jog ? [[P1 + 16, p], [x2, p], [x2 + 6, p + jog], [B, p + jog]] : [[P1 + 16, p], [B, p]];
      b.add(0, tone === 'hi' ? 'trace-hi' : 'trace', pathZ(pts, T));
      if (!tone && r.chance(0.35)) b.add(0, 'via', ell(x2 + 14, p + jog, T, 2.4));
    }
    b.add(0, 'pad', rectZ(p - 1.8, P1 + 9, p + 1.8, P1 + 16, T));
    if (r.chance(0.45)) b.add(0, 'trace', pathZ([[p, P1 + 16], [p, B]], T));
    b.add(0, 'pad', rectZ(P0 - 16, p - 1.8, P0 - 9, p + 1.8, T));
    b.add(0, 'pad', rectZ(p - 1.8, P0 - 16, p + 1.8, P0 - 9, T));
  });
  // narożniki obudowy i rzutujące (wyróżnione wyprowadzenie → jego pole)
  for (const [x, y] of [
    [P0, P0],
    [P1, P0],
    [P1, P1],
    [P0, P1],
  ] as const)
    b.vline(x, y, T, 2);
  if (hi) for (const [i, tone] of tagged) if (tone === 'hi') b.vline(P1 + 12.5, pos[i], T, 2, 'proj');

  // wyprowadzenia z tyłu (malowane przed korpusem)
  for (const p of pos) {
    b.add(2, 'pin', poly([[P0, p, zm], [P0 - 4, p, zm], [P0 - 7, p, zb], [P0 - 12, p, zb]], false));
    b.add(2, 'pin', poly([[p, P0, zm], [p, P0 - 4, zm], [p, P0 - 7, zb], [p, P0 - 12, zb]], false));
  }
  b.slab(2, P0, P0, P1 - P0, P1 - P0, zb, 12);
  b.add(2, 'fine', ell(P0 + 9, P0 + 9, zb + 12, 3.2));
  b.add(2, 'fine-d', rectZ(P0 + 20, P0 + 20, P1 - 20, P1 - 20, zb + 12));
  if (m.chip) b.marks.push({ text: m.chip, at: [(P0 + P1) / 2, (P0 + P1) / 2, zb + 12], size: 8.5, max: 84, g: 2 });
  for (const p of pos) b.add(2, 'pin', poly([[p, P1, zm], [p, P1 + 4, zm], [p, P1 + 7, zb], [p, P1 + 12, zb]], false));
  pos.forEach((p, i) => {
    const tone = hi ? tagged.get(i) : undefined;
    b.add(2, tone === 'hi' ? 'pin-hi' : tone === 'sig' ? 'pin-sig' : 'pin', poly([[P1, p, zm], [P1 + 4, p, zm], [P1 + 7, p, zb], [P1 + 12, p, zb]], false));
  });

  const texts = m.labels.slice(0, nLab);
  let k = 0;
  for (const [i, tone] of [...tagged].sort((a, c) => a[0] - c[0])) {
    const text = tone === 'sig' ? m.fault : texts[k++];
    b.label(text, [P1 + 12, pos[i], zb], 'r', 2, hi ? tone : 'ink');
  }
  return b.done();
}

/* ---------- (c) przebieg ścieżek przez układ ---------- */

export function pcb(m: MotifInput, r: Rng): Scene {
  const b = new Builder();
  const hi = !m.calm;
  const W = 250;
  const D = 150;
  const T = 6;
  const chipChars = m.chip?.length ?? 5;
  const cw = Math.max(64, Math.min(92, chipChars * 6.4 + 24));
  const X0 = 98;
  const X1 = X0 + cw;
  const Y0 = 30;
  const Y1 = 120;
  const pins = [45, 60, 75, 90, 105];
  const zb = T + G0; // jeden poziom: wyżej układ zasłaniałby złącza przy tylnej krawędzi

  const inputs = m.inputs.slice(0, m.maxInputs);
  // wyjścia: najwyżej dwa podpisane + „awaria” (razem z wejściami ≤ 5 etykiet)
  const outs = m.labels.slice(0, Math.max(0, Math.min(2, m.maxLabels - (m.fault ? 1 : 0))));
  // jedna ścieżka bez podpisu po każdej stronie — płytka nie wygląda na pustą
  const nIn = Math.min(4, inputs.length + 1);
  const nOut = Math.min(4, outs.length + 1 + (m.fault ? 1 : 0));
  const CAND = [14, 34, 54, 74, 94, 114, 134];
  const rows = (k: number) => {
    if (k <= 1) return [CAND[r.int(1, 5)]];
    const step = r.int(1, Math.floor((CAND.length - 1) / (k - 1)));
    const s = r.int(0, CAND.length - 1 - step * (k - 1));
    return Array.from({ length: k }, (_, i) => CAND[s + i * step]);
  };
  const pinRun = (k: number) => {
    const s = r.int(0, pins.length - k);
    return pins.slice(s, s + k);
  };
  const yIn = rows(nIn);
  const yOut = rows(nOut);
  const pIn = pinRun(nIn);
  const pOut = pinRun(nOut);

  b.slab(0, 0, 0, W, D, 0, T);
  b.add(0, 'fine-d', rectZ(X0, Y0, X1, Y1, T));
  for (const p of pins) {
    b.add(0, 'pad', rectZ(X0 - 6, p - 2, X0, p + 2, T));
    b.add(0, 'pad', rectZ(X1, p - 2, X1 + 6, p + 2, T));
  }
  // wejścia: złącze przy lewej krawędzi → wspólne załamanie 45° (ścieżki równoległe, bez skrzyżowań) → pole układu
  const dyIn = Math.max(...yIn.map((y, i) => Math.abs(pIn[i] - y)));
  const xa = r.int(22, Math.max(24, X0 - 12 - dyIn));
  const vias: [number, number][] = [];
  yIn.forEach((y, i) => {
    const p = pIn[i];
    const dy = Math.abs(p - y);
    const main = hi && i === 0 && inputs.length > 0;
    b.add(0, main ? 'pad-hi' : 'pad', rectZ(4, y - 3, 14, y + 3, T));
    b.add(0, main ? 'trace-hi' : 'trace', pathZ(dy < 1 ? [[14, y], [X0 - 6, p]] : [[14, y], [xa, y], [xa + dy, p], [X0 - 6, p]], T));
    if (dy > 8 && r.chance(0.5)) vias.push([xa, y]);
  });
  // wyjścia: pole układu → wspólne załamanie → złącze przy prawej krawędzi; ostatnie może być przerwane
  const dyOut = Math.max(...yOut.map((y, i) => Math.abs(pOut[i] - y)));
  const xb = r.int(X1 + 12, Math.max(X1 + 14, W - 34 - dyOut));
  yOut.forEach((y, i) => {
    const p = pOut[i];
    const dy = Math.abs(y - p);
    const xm = xb + dy;
    const isFault = !!m.fault && i === yOut.length - 1;
    const main = hi && i === 0 && outs.length > 0;
    b.add(0, isFault && hi ? 'pad-sig' : main ? 'pad-hi' : 'pad', rectZ(W - 14, y - 3, W - 4, y + 3, T));
    const route: [number, number][] = dy < 1 ? [[X1 + 6, p]] : [[X1 + 6, p], [xb, p], [xm, y]];
    if (isFault && hi) {
      const brk = Math.min(W - 30, xm + 10);
      b.add(0, 'trace', pathZ([...route, [brk, y]], T));
      b.add(0, 'fault', pathZ([[brk + 4, y], [W - 14, y]], T));
      b.add(0, 'pad-sig', ell(brk + 2, y, T, 2.6));
    } else {
      b.add(0, main ? 'trace-hi' : 'trace', pathZ([...route, [W - 14, y]], T));
      if (dy > 8 && r.chance(0.5)) vias.push([xm, y]);
    }
  });
  for (const [x, y] of vias.slice(0, 3)) b.add(0, 'via', ell(x, y, T, 2.6));
  for (let k = 0; k < 3; k++) b.add(0, 'via', ell(r.pick([24, 50, 76, 190, 216]) + k * 4, r.pick([144, 4]), T, 2.2));
  for (const [x, y] of [
    [X0, Y0],
    [X1, Y0],
    [X1, Y1],
    [X0, Y1],
  ] as const)
    b.vline(x, y, T, 1);

  // układ (grupa 1): wyprowadzenia z tyłu, korpus, napis, wyprowadzenia z przodu
  for (const p of pins) b.add(1, 'pin', poly([[X0, p, zb + 5], [X0 - 4, p, zb + 5], [X0 - 6, p, zb]], false));
  b.slab(1, X0, Y0, cw, Y1 - Y0, zb, 10);
  b.add(1, 'fine', ell(X0 + 8, Y0 + 8, zb + 10, 2.8));
  if (m.chip) b.marks.push({ text: m.chip, at: [(X0 + X1) / 2, (Y0 + Y1) / 2, zb + 10], size: 8.5, max: cw - 14, g: 1 });
  for (const p of pins) b.add(1, 'pin', poly([[X1, p, zb + 5], [X1 + 4, p, zb + 5], [X1 + 6, p, zb]], false));

  inputs.forEach((t, i) => b.label(t, [4, yIn[i], T], 'l', 0, hi && i === 0 ? 'hi' : 'ink'));
  outs.forEach((t, i) => b.label(t, [W - 4, yOut[i], T], 'r', 0, hi && i === 0 ? 'hi' : 'ink'));
  if (m.fault) b.label(m.fault, [W - 4, yOut[yOut.length - 1], T], 'r', 0, hi ? 'sig' : 'ink');
  return b.done();
}

/* ---------- (d) matryca BGA (flip-chip) ---------- */

export function bga(m: MotifInput, r: Rng): Scene {
  const b = new Builder();
  const hi = !m.calm;
  const S = 180;
  const T = 8;
  const n = 8;
  const pitch = S / (n + 1);
  const at = (k: number) => pitch * (k + 1);
  const rb = 4.4;
  const D0 = 56;
  const D1 = 124;
  const zb = T + 2 * G0;

  // wyróżnione skupiska w pasie przy prawej krawędzi (kolumny n-1, n-2), rzędy rozstawione
  const k = Math.min(m.labels.length, m.maxLabels - (m.fault ? 1 : 0));
  const slots = k + (m.fault ? 1 : 0);
  const gap = slots > 0 ? Math.max(2, Math.floor((n - 1) / slots)) : 2;
  const startRow = r.int(0, Math.max(0, n - 2 - gap * (slots - 1)));
  const groups: { cells: [number, number][]; tone: Tone }[] = [];
  for (let s = 0; s < slots; s++) {
    const j = Math.min(n - 2, startRow + s * gap);
    const isFault = !!m.fault && s === slots - 1;
    const cells: [number, number][] = isFault ? [[n - 1, j]] : [[n - 1, j], [n - 1, j + 1]];
    if (!isFault && r.chance(0.6)) cells.push([n - 2, j + (r.chance(0.5) ? 0 : 1)]);
    groups.push({ cells, tone: isFault ? 'sig' : 'hi' });
  }
  const toneOf = new Map<string, Tone>();
  // kilka pojedynczych wyróżnień w głębi matrycy (bez podpisu)
  if (hi) for (let s = 0; s < 2; s++) toneOf.set(`${r.int(1, n - 3)},${r.int(5, n - 1)}`, 'hi');
  for (const gr of groups) for (const [i, j] of gr.cells) toneOf.set(`${i},${j}`, gr.tone);

  b.slab(0, 0, 0, S, S, 0, T);
  b.add(0, 'fine-d', rectZ(D0, D0, D1, D1, T));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const tone = hi ? toneOf.get(`${i},${j}`) : undefined;
      b.add(0, tone === 'hi' ? 'ball-hi' : tone === 'sig' ? 'ball-sig' : 'ball', ell(at(i), at(j), T, rb));
    }
  for (const [x, y] of [
    [D0, D0],
    [D1, D0],
    [D1, D1],
    [D0, D1],
  ] as const)
    b.vline(x, y, T, 2);

  // rdzeń nad podłożem
  b.slab(2, D0, D0, D1 - D0, D1 - D0, zb, 8, hi ? 'top-hi' : 'top');
  b.add(2, 'fine', ell(D0 + 7, D0 + 7, zb + 8, 2.6));
  if (m.chip) b.marks.push({ text: m.chip, at: [(D0 + D1) / 2, (D0 + D1) / 2, zb + 8], size: 7.5, max: D1 - D0 - 12, g: 2 });

  const texts = m.labels.slice(0, k);
  groups.forEach((gr, s) => {
    // kotwica: kulka najbardziej na prawo (kolumna n-1, najmniejsze j)
    const [i, j] = gr.cells.reduce((a, c) => (c[0] - c[1] > a[0] - a[1] ? c : a));
    const text = gr.tone === 'sig' ? m.fault : texts[s];
    b.label(text, rightOf(at(i), at(j), T, rb), 'r', 0, hi ? gr.tone : 'ink');
  });
  return b.done();
}

export const MOTIFS: Record<Motif, (m: MotifInput, r: Rng) => Scene> = { stack, qfp, pcb, bga };
