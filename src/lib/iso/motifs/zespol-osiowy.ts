/**
 * „Zespół na osi” (rysunek złożeniowy w 3D, bliźniak rysunku F-00 ze strony głównej): poziomy wał wzdłuż osi x
 * sceny na dwóch blokach łożyskowych, oś kreska-kropka, części rozsunięte wzdłuż osi w kolejności montażu.
 * Program ubezpieczenia = części na jednym wale: kołnierz bazowy, (sprężyna — udział własny), tarcze modułów,
 * (podkładka); oś zamyka czerwona pokrywa w przekroju ćwiartkowym z kreskowaniem — wyłączenia (wyjątek z planu:
 * czerwona część należy do zespołu, jak w F-00).
 *
 * Warianty: program (/ i /o-nas/) — pełny zespół; sprzeglo (/wiedza/tech-eo-a-oc-zawodowe/) — dwie półosie
 * (OC zawodowe i cyber) z piastami sprzęgła kłowego i elastyczną wkładką-gwiazdą, tabliczka na piaście.
 * Scena rozsuwa się wzdłuż osi wału (scene({ axis: 'x' })): g1 kołnierz / piasta E&O, g2 sprężyna / wkładka,
 * g3 tarcze / piasta cyber, g4 podkładka, g5 pokrywa (s.out — dodatkowo odsuwa się dalej wzdłuż osi).
 * Miniatura: bez sprężyny, śrub i podkładki (budżet detali); kreskowanie tylko na pokrywie.
 * Sloty podpisów: program [kołnierz, tarcza, tarcza czołowa]; sprzeglo [piasta E&O, wkładka, piasta cyber]
 * (miniatura: obie piasty).
 */
import { budget, Sketch, arcSegs, hi, plate, spring, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule, Tone } from '../scene.ts';
import { ellOf, onCircle, rimAt } from './_g1.ts';

const YC = 42;
const ZC = 52;
const RS = 5.5;
/** Prawy górny skraj obrzeża tarczy (kotwica podpisu). */
const RIM: readonly [number, number] = [1, -0.55];

const shaft = (s: Sketch, x0: number, x1: number) => s.cylX(0, [x0, YC, ZC], x1 - x0, RS, { noCap: true });

/** Tarcza / piasta wzdłuż osi: płaszcz + widoczne denko (x = x0 + L). */
function disc(s: Sketch, g: number, x0: number, L: number, r: number, tone: Tone = 'ink', opt: { bore?: number } = {}) {
  return s.cylX(g, [x0, YC, ZC], L, r, { tone, ...(opt.bore ? { bore: opt.bore } : {}) });
}

/** Blok łożyskowy: stopa, słupek, oprawa łożyska (g0). */
function bearing(s: Sketch, x: number, thumb: boolean, zt: number) {
  s.box(0, x - 3, YC - 24, zt, 22, 48, 4);
  s.box(0, x, YC - 13, zt + 4, 16, 26, ZC - zt - 4);
  disc(s, 0, x, 16, 16);
  if (!thumb) s.ell(0, 'fine', [x + 16, YC, ZC], 'x', 10);
}

/** Pokrywa w przekroju ćwiartkowym (wycięta ćwiartka zwrócona do widza), czerwień; zwraca kotwicę. */
function cover(s: Sketch, g: number, x0: number, L: number, R: number, thumb: boolean) {
  const x1 = x0 + L;
  const C0: V3 = [x0, YC, ZC];
  const C1: V3 = [x1, YC, ZC];
  const e0 = ellOf(C0, 'x', R);
  const e1 = ellOf(C1, 'x', R);
  const rad = (d: number) => (d * Math.PI) / 180;
  const strip = (a: number, b: number) => {
    const p = e0.at(rad(a));
    const o = arcSegs(e0, rad(a), rad(b));
    const q = e1.at(rad(b));
    const i = arcSegs(e1, rad(b), rad(a));
    s.add(g, 'side-sig', [['M', p[0], p[1]], ...o.d, ['L', q[0], q[1]], ...i.d, ['Z']], [...o.bb, ...i.bb]);
  };
  strip(-45, 0);
  strip(90, 135);
  // ściany przekroju (kreskowane)
  s.poly(g, 'top-sig', [C0, C1, [x1, YC + R, ZC], [x0, YC + R, ZC]]);
  s.poly(g, 'top-sig', [C0, C1, [x1, YC, ZC + R], [x0, YC, ZC + R]]);
  const step = thumb ? 5 : 4;
  s.hatch(g, C0, [L, 0, 0], [0, R, 0], step, 'hatch-sig');
  s.hatch(g, C0, [L, 0, 0], [0, 0, R], step, 'hatch-sig');
  // denko: trzy ćwiartki
  const a = e1.at(rad(90));
  const arc = arcSegs(e1, rad(90), rad(360));
  s.add(g, 'top-sig', [['M', e1.C[0], e1.C[1]], ['L', a[0], a[1]], ...arc.d, ['Z']], arc.bb);
  // otwór na wał w denku (ćwiartka poza wycięciem)
  s.arc(g, 'edge-sig', C1, 'x', RS + 1, rad(90), rad(360));
  return rimAt(C1, 'x', R, RIM);
}

function program(s: Sketch, m: MotifInput, zt: number) {
  const t = hi(m);
  const B = budget(m);
  const tone = (i: number): Tone => (B.slots[i] ? t : 'ink');
  bearing(s, 8, m.thumb, zt);
  let x = 44;
  shaft(s, 0, x);
  // g1 — kołnierz bazowy (otwory na śruby tylko w nagłówku)
  disc(s, 1, x, 7, 34, tone(0));
  if (!m.thumb) for (let i = 0; i < 6; i++) s.ell(1, 'bore', onCircle([x + 7, YC, ZC], 'x', 26, 30 + i * 60), 'x', 2.6);
  disc(s, 1, x + 7, 6, 13);
  const aFlange = rimAt([x + 7, YC, ZC], 'x', 34, RIM);
  x += 13;
  if (!m.thumb) {
    // g2 — sprężyna (udział własny)
    shaft(s, x, x + 12);
    x += 12;
    const xs = x;
    spring(s, 2, 'x', [xs, YC, ZC], 28, 12, 4, { behind: () => shaft(s, xs - 1, xs + 29) });
    x += 28;
  }
  const gap = m.thumb ? 34 : 22;
  // g3 — tarcza stopniowana (w miniaturze płaska)
  shaft(s, x, x + gap);
  x += gap;
  let aDisc;
  if (m.thumb) {
    disc(s, 3, x, 8, 31, tone(1));
    aDisc = rimAt([x + 8, YC, ZC], 'x', 31, RIM);
    x += 8;
  } else {
    disc(s, 3, x, 6, 30, tone(1));
    aDisc = rimAt([x + 6, YC, ZC], 'x', 30, RIM);
    disc(s, 3, x + 6, 7, 18, tone(1));
    x += 13;
  }
  // g3 — tarcza czołowa z rowkiem
  shaft(s, x, x + gap);
  x += gap;
  disc(s, 3, x, 12, 37, tone(2));
  s.arc(3, 'fine', [x + 6, YC, ZC], 'x', 37, -Math.PI / 4, (3 * Math.PI) / 4);
  const aFront = rimAt([x + 12, YC, ZC], 'x', 37, RIM);
  x += 11;
  if (!m.thumb) {
    // g4 — podkładka
    shaft(s, x, x + 16);
    x += 16;
    disc(s, 4, x, 3, 17, 'ink', { bore: RS + 1.5 });
    x += 3;
  }
  const xb = 226;
  shaft(s, x, xb);
  bearing(s, xb, m.thumb, zt);
  shaft(s, xb + 16, xb + 26);
  s.out(() => {
    const aC = cover(s, 5, xb + 34, 22, 24, m.thumb);
    s.label(B.fault, aC, 'r', 5, 'sig');
  });
  s.label(B.slots[0], aFlange, 'r', 1, t);
  s.label(B.slots[1], aDisc, 'r', 3, t);
  s.label(B.slots[2], aFront, 'r', 3, t);
}

/** Kieł sprzęgła: wycinek pierścienia r0…r1 między kątami a0…a1 (stopnie) w płaszczyźnie x, wyciągnięty o dx. */
function jaw(s: Sketch, g: number, x: number, dx: number, r0: number, r1: number, a0: number, a1: number, f: Tone) {
  const c: V3 = [x, YC, ZC];
  s.prism(g, [onCircle(c, 'x', r1, a0), onCircle(c, 'x', r1, a1), onCircle(c, 'x', r0, a1), onCircle(c, 'x', r0, a0)], [dx, 0, 0], f);
}

/** Wkładka-gwiazda (elastyczna): wielokąt ramion w płaszczyźnie x, wyciągnięty o dx. */
function star(s: Sketch, g: number, x: number, dx: number, rIn: number, rOut: number, arms: number, f: Tone) {
  const c: V3 = [x, YC, ZC];
  const pts: V3[] = [];
  const half = 180 / arms;
  for (let i = 0; i < arms; i++) {
    const a = i * 2 * half + 90;
    pts.push(onCircle(c, 'x', rOut, a - half * 0.42), onCircle(c, 'x', rOut, a + half * 0.42), onCircle(c, 'x', rIn, a + half));
  }
  s.prism(g, pts, [dx, 0, 0], f);
}

function sprzeglo(s: Sketch, m: MotifInput, zt: number) {
  const t = hi(m);
  const B = budget(m, { order: [0, 2, 1] });
  const tone = (i: number): Tone => (B.slots[i] ? t : 'ink');
  bearing(s, 8, m.thumb, zt);
  shaft(s, 0, 70);
  // g1 — piasta E&O (kły do przodu) z tabliczką na płaszczu
  const hx = 70;
  const HL = 30;
  disc(s, 1, hx, HL, 27, tone(0));
  if (m.plate && !m.thumb) {
    // tabliczka styczna do płaszcza piasty (normalna ku widzowi), napis wzdłuż osi
    const k = Math.SQRT1_2;
    const ctr: V3 = [hx + HL / 2, YC + 27.3 * k, ZC + 27.3 * k];
    const u: V3 = [1, 0, 0];
    const v: V3 = [0, k, -k];
    const w = 24;
    const h = 7.5;
    const corner = (a: number, b: number): V3 => [ctr[0] + u[0] * a, ctr[1] + v[1] * b, ctr[2] + v[2] * b];
    s.poly(1, 'fine-ink', [corner(-w / 2, -h / 2), corner(w / 2, -h / 2), corner(w / 2, h / 2), corner(-w / 2, h / 2)]);
    s.mark(1, m.plate, ctr, { u, v, size: 4.6, max: w - 3 });
  }
  const aHub1 = rimAt([hx + HL, YC, ZC], 'x', 27, RIM);
  const jawsAt = m.thumb ? [90, 330] : [90, 210, 330];
  for (const a of jawsAt) jaw(s, 1, hx + HL, 11, 12, 25, a - 24, a + 24, 'ink');
  // g2 — elastyczna wkładka (błękit)
  const ix = hx + HL + 25;
  shaft(s, hx + HL + 11, ix);
  if (m.thumb) disc(s, 2, ix, 8, 23, tone(1), { bore: RS + 1.5 });
  else star(s, 2, ix, 8, 13, 24, 6, tone(1));
  const aIns = rimAt([ix + 8, YC, ZC], 'x', 24, RIM);
  // g3 — piasta cyber: kły do tyłu (za korpusem), korpus
  const cx = ix + 8 + 25;
  shaft(s, ix + 8, cx - 11);
  for (const a of m.thumb ? [30, 150] : [30, 150, 270]) jaw(s, 3, cx - 11, 11, 12, 25, a - 24, a + 24, 'ink');
  disc(s, 3, cx, HL, 27, tone(2));
  const aHub2 = rimAt([cx + HL, YC, ZC], 'x', 27, RIM);
  const xb = 226;
  shaft(s, cx + HL, xb);
  bearing(s, xb, m.thumb, zt);
  shaft(s, xb + 16, xb + 26);
  s.out(() => {
    const aC = cover(s, 5, xb + 34, 22, 24, m.thumb);
    s.label(B.fault, aC, 'r', 5, 'sig');
  });
  s.label(B.slots[0], aHub1, 'r', 1, t);
  s.label(B.slots[1], aIns, 'r', 2, t);
  s.label(B.slots[2], aHub2, 'r', 3, t);
}

function build(m: MotifInput) {
  const s = new Sketch();
  const { zt } = plate(s, { x0: -8, y0: 0, w: 304, d: 84, protect: [0, 8, 256, 76], ticks: 30 });
  if (m.variant === 'sprzeglo') sprzeglo(s, m, zt);
  else program(s, m, zt);
  s.axisLine(0, [-18, YC, ZC], [304, YC, ZC], { nobox: true });
  return s.scene({ axis: 'x', zoom: 1.2 });
}

export const motif: MotifModule = {
  id: 'zespol-osiowy',
  name: 'Zespół na osi',
  variants: ['program', 'sprzeglo'],
  what: {
    program: 'wał na dwóch blokach łożyskowych, na nim w kolejności montażu kołnierz bazowy, tarcze modułów i pokrywa w przekroju zamykająca oś',
    sprzeglo: 'dwie półosie połączone sprzęgłem kłowym z elastyczną wkładką, za łożyskiem pokrywa w przekroju',
  },
  build,
};
