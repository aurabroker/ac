/**
 * Motyw „Archiwum arkuszy” (plan grafik: final.json → motifs[archiwum]; szkic sketch-src/archiwum.js) — meble
 * kreślarni do przechowywania arkuszy (serwis nazywa się „Arkusz”). Czoło mebli = ściana +x.
 *   komoda       (/ubezpieczenia/): niska, szeroka komoda na plany; trzy szuflady wysunięte schodkowo (dolna najdalej)
 *                — każda to grupa katalogu; górna zamknięta, narysowana linią przerywaną (ryzyka nietypowe, ocena
 *                indywidualna — tusz, nie czerwień);
 *   arkusze      (/wiedza/): ta sama komoda z tabliczką; górna szuflada wysunięta, arkusze LEŻĄ w niej wachlarzem,
 *                tylko jeden uniesiony, z podwiniętym rogiem (uwaga z arkusza: bez stosu płyt nad skrzynią);
 *   szafa-aktowa (/informacje-o-brokerze/, spokojna): wysoka zamknięta szafa aktowa, złożona w g0, bez ruchu.
 * Grupy: g0 płyta + korpus, g1 wysunięte szuflady (z arkuszami w środku), g2 arkusz uniesiony.
 * Arkusz uniesiony wisi tuż nad szufladą (linie rzutu w jego grupie). Bez czerwieni (strony-indeksy i prawne).
 * Sloty — komoda: 0 szuflada górna wysunięta, 1 środkowa, 2 dolna; arkusze: 0 arkusz uniesiony, 1–3 arkusze w szufladzie.
 */
import { Sketch, plate, take, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Tone } from '../scene.ts';
import { SIDE_R, TOP, describeParts, rectX, rectZ, rot, slotTone } from './_g4.ts';

const T = 6;
/** Głębokość komody (x), szerokość (y), wysokość szuflady. */
const X = 66;
const Y = 112;
const DH = 13;
const zb = (i: number) => T + 8 + i * (DH + 1);
const TOPZ = zb(3) + DH + 2;

/** Uchwyt muszlowy (półokrąg) na płaszczyźnie x = xf. */
function cupPull(s: Sketch, g: number, xf: number, y: number, z: number, r: number) {
  s.arc(g, 'edge', [xf, y, z], 'x', r, Math.PI, 2 * Math.PI);
  s.line(g, 'edge', [xf, y - r, z], [xf, y + r, z]);
}

/** Czoło szuflady na płaszczyźnie x = xf: obrys, ramka na etykietę (pusta), dwa uchwyty. */
function drawerFront(s: Sketch, g: number, xf: number, z: number, tone: Tone, t: boolean) {
  const x = xf + 0.05;
  s.poly(g, tone === 'ink' ? 'edge' : SIDE_R[tone], rectX(x, 3, Y - 3, z, z + DH));
  s.poly(g, 'fine-ink', rectX(x, Y / 2 - 9, Y / 2 + 9, z + DH * 0.5, z + DH * 0.78));
  if (!t || tone !== 'ink') for (const y of [20, Y - 20]) cupPull(s, g, x, y, z + DH * 0.55, 3.4);
}

/** Wysunięta szuflada i (wysuw P): korytko z wnęką, czoło; inside(zFloor) — zawartość na dnie. */
function pulled(s: Sketch, g: number, i: number, P: number, tone: Tone, t: boolean, inside?: (z: number) => void): V3 {
  const z = zb(i);
  s.box(g, X, 3, z, P, Y - 6, DH, tone);
  const zt = z + DH;
  s.pocket(g, rectZ(X, 3, X + P, Y - 3, zt), rectZ(X + 1, 5, X + P - 2, Y - 5, zt), DH - 2, { top: TOP[tone], inside });
  drawerFront(s, g, X + P, z, tone, t);
  return [X + P, 8, z + DH * 0.5];
}

/** Korpus komody: cokół, skrzynia, blat; zamknięte szuflady na czole (dashedTop — górna linią przerywaną). */
function chest(s: Sketch, closed: number[], t: boolean, dashedTop: boolean) {
  s.box(0, 4, 4, T, X - 8, Y - 8, 6);
  s.box(0, 0, 0, T + 6, X, Y, TOPZ - T - 6);
  s.box(0, -2, -2, TOPZ, X + 3, Y + 4, 4);
  for (const i of closed) {
    if (dashedTop && i === 3) s.dashed(() => drawerFront(s, 0, X, zb(i), 'ink', false));
    else drawerFront(s, 0, X, zb(i), 'ink', t);
  }
}

/**
 * Arkusz rysunku leżący płasko: środek (cx, cy), wymiar L (x) × W (y), obrót ang, poziom z. Ramka, tabliczka
 * w prawym rogu (max x, min y), prosty rysunek (prostokąt z otworem). curl — bliższy róg (+L/2, +W/2) podwinięty
 * do góry. Zwraca kotwicę (prawy róg arkusza).
 */
function sheet(s: Sketch, g: number, cx: number, cy: number, L: number, W: number, z: number, ang: number, tone: Tone, detail: boolean, curl = 0): V3 {
  const R = rot(cx, cy, ang, z);
  const c = curl;
  const box = (u0: number, v0: number, u1: number, v1: number, zz: number, cc: number): V3[] =>
    cc
      ? [R(u0, v0, zz), R(u1, v0, zz), R(u1, v1 - cc, zz), R(u1 - cc, v1, zz), R(u0, v1, zz)]
      : [R(u0, v0, zz), R(u1, v0, zz), R(u1, v1, zz), R(u0, v1, zz)];
  s.prism(g, box(-L / 2, -W / 2, L / 2, W / 2, z, c), [0, 0, 0.8], tone);
  const zt = z + 0.8;
  const Q = (u: number, v: number) => R(u, v, zt);
  const m = 3;
  const u1 = L / 2 - m;
  const v0 = -W / 2 + m;
  // tabliczka rysunkowa w prawym rogu
  s.poly(g, 'fine-ink', [Q(u1 - 7, v0), Q(u1, v0), Q(u1, v0 + 22), Q(u1 - 7, v0 + 22)]);
  if (detail) {
    s.poly(g, 'fine-ink', box(-L / 2 + m, v0, u1, W / 2 - m, zt, c ? c - 1 : 0));
    s.poly(g, 'fine', [Q(-7, 2), Q(5, 2), Q(5, 24), Q(-7, 24)]);
    s.ell(g, 'fine', Q(-1, 13), 'z', 3.6);
  }
  if (c) {
    // podwinięty róg: trójkąt zagięty nad arkusz i uniesiony
    s.poly(g, TOP[tone], [R(L / 2, W / 2 - c, zt), R(L / 2 - c, W / 2, zt), R(L / 2 - c * 0.95, W / 2 - c * 0.95, zt + c * 0.55)]);
  }
  return R(L / 2, -W / 2 + 2, z + 0.4);
}

/* ---------------- komoda: katalog ubezpieczeń ---------------- */
function komoda(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const L = take(m);
  plate(s, { x0: -16, y0: -16, w: X + 80, d: Y + 30, protect: [-8, -8, X + 62, Y + 8] });
  chest(s, [3], t, true);
  // wysunięte schodkowo od dołu: im niżej, tym dalej
  const pulls: [number, number, number][] = [[0, 48, 2], [1, 32, 1], [2, 16, 0]];
  for (const [i, P, slot] of pulls) {
    const tone = slotTone(m, L.labels[slot]);
    const inside = i === 0 && !t ? (z: number) => void sheet(s, 1, X + 24, Y / 2 - 6, 34, 56, z, 0.05, 'ink', false) : undefined;
    const a = pulled(s, 1, i, P, tone, t, inside);
    s.label(L.labels[slot], a, 'r', 1, tone);
  }
  return s.scene();
}

/* ---------------- arkusze: wiedza (blog) ---------------- */
function arkusze(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const L = take(m);
  plate(s, { x0: -16, y0: -16, w: X + 74, d: Y + 30, protect: [-8, -8, X + 58, Y + 8] });
  chest(s, [0, 1, 2], t, false);
  s.mark(0, m.plate, [26, Y - 22, TOPZ + 4], { size: 7.5, max: 46 });
  const P = 50;
  const tS = [0, 1, 2, 3].map((k) => slotTone(m, L.labels[k]));
  const aIn: V3[] = [];
  // arkusze leżą w szufladzie wachlarzem (sloty 1–3: od spodu)
  // spodni wysunięty najdalej do przodu — brzegi arkuszy schodzą stopniami (kotwice jedna pod drugą)
  const fan: [number, number, number][] = [[8, 4, 0.03], [0, 0, -0.03], [-8, -4, 0.02]];
  pulled(s, 1, 3, P, 'ink', t, (z) => {
    fan.forEach(([dx, dy, a], k) => {
      aIn.push(sheet(s, 1, X + P / 2 + dx, Y / 2 + dy, 30, 84, z + k * 1.2, a, tS[3 - k], k === 2 && !t));
    });
  });
  // jeden arkusz wyjęty z szuflady i uniesiony tuż nad nią, z podwiniętym rogiem; linie rzutu wiszą pod nim (g2)
  const zr = zb(3) + DH;
  const LIFT = 20;
  for (const [x, y] of [[X + P - 3, 12], [X + P - 3, Y - 12]] as const) s.line(2, 'proj', [x, y, zr + LIFT], [x, y, zr]);
  const aTop = sheet(s, 2, X + P / 2 + 6, Y / 2, 36, 92, zr + LIFT, 0.02, tS[0], true, 12);
  s.label(L.labels[0], aTop, 'r', 2, tS[0]);
  // w szufladzie: wierzchni arkusz — slot 1, środkowy — 2, spodni — 3
  s.label(L.labels[1], aIn[2], 'r', 1, tS[1]);
  s.label(L.labels[2], aIn[1], 'r', 1, tS[2]);
  s.label(L.labels[3], aIn[0], 'r', 1, tS[3]);
  return s.scene();
}

/* ---------------- szafa aktowa: informacje o brokerze (spokojna) ---------------- */
function szafaAktowa() {
  const s = new Sketch();
  const SX = 56;
  const SY = 46;
  const H = 124;
  plate(s, { x0: -20, y0: -20, w: SX + 44, d: SY + 40, protect: null });
  s.box(0, 3, 3, T, SX - 6, SY - 6, 5);
  s.box(0, 0, 0, T + 5, SX, SY, H - 5);
  const n = 4;
  const dh = (H - 9) / n;
  for (let i = 0; i < n; i++) {
    const z = T + 7 + i * dh;
    const xf = SX + 0.05;
    s.poly(0, 'edge', rectX(xf, 3, SY - 3, z, z + dh - 2));
    s.poly(0, 'fine-ink', rectX(xf, SY / 2 - 7, SY / 2 + 7, z + dh * 0.62, z + dh * 0.8));
    s.box(0, SX, SY / 2 - 7, z + dh * 0.4, 2.5, 14, 2.4);
  }
  s.ell(0, 'fine-ink', [SX + 0.05, SY - 8, T + H - 6], 'x', 1.6);
  return s.scene({ calm: true });
}

function build(m: MotifInput) {
  if (m.variant === 'szafa-aktowa') return szafaAktowa();
  return m.variant === 'arkusze' ? arkusze(m) : komoda(m);
}

const PARTS: Record<string, readonly string[]> = {
  komoda: ['górna wysunięta szuflada', 'środkowa szuflada', 'dolna szuflada, wysunięta najdalej'],
  arkusze: ['arkusz uniesiony nad szufladą', 'wierzchni arkusz w szufladzie', 'środkowy arkusz', 'spodni arkusz'],
};

function describe(d: DescInput): string {
  return describeParts(motif.name, motif.what[d.variant], d, PARTS[d.variant] ?? []);
}

export const motif: MotifModule = {
  id: 'archiwum',
  name: 'Archiwum arkuszy',
  variants: ['komoda', 'arkusze', 'szafa-aktowa'],
  what: {
    komoda: 'niska komoda kreślarska z płaskimi szufladami wysuniętymi schodkowo — każda szuflada to grupa ubezpieczeń; górna, zamknięta, narysowana linią przerywaną: ryzyka nietypowe, ocena indywidualna',
    arkusze: 'komoda kreślarska z wysuniętą szufladą, w której leżą arkusze rysunków; jeden arkusz z podwiniętym rogiem uniesiony nad szufladą',
    'szafa-aktowa': 'wysoka, zamknięta szafa aktowa z czterema szufladami, ramkami na etykiety i uchwytami',
  },
  build,
  describe,
};
