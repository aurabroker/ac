/**
 * „Przenośnik taśmowy” — linia, z której schodzi produkt. Trzy wyraźnie różne sylwetki (stoją obok siebie
 * w „Powiązanych” przy produkcie, PLD i AI Act):
 *   wycofanie    — długa taśma z kartonami jadącymi w prawo i tor zwrotny w kształcie U z wózkiem zwrotów (recall);
 *                  czerwień: karton zdjęty z linii poza obrys (wymiana samego produktu).
 *   aktualizacja — krótsza taśma z urządzeniami pod bramką, z której zjeżdża kaseta aktualizacji; urządzenie za bramką
 *                  ma pustą kieszeń; czerwień: zsuwnia z boku linii do skrzyni odbiorcy firmowego (straty B2B).
 *   naped        — bęben czołowy napędza para kół zębatych (duże koło na wale bębna, zębnik na silniku — Twoja usługa),
 *                  na taśmie urządzenia z Twoim oprogramowaniem; czerwień: odłożona kaseta z poprawką.
 *                  Koła mają oś y, więc rysuje je vgear() z _g3.ts (ten sam zarys zęba co gear() z prims.ts, który ma tylko oś z).
 * Grupy: g0 płyta + nogi + rama (+ tor, zsuwnia, silnik zębnika), g1 rolki, g2 taśma z bębnami (+ koła zębate),
 * g3 kartony / urządzenia / wózek, g4 bramka z kasetą; out — część zdjęta z linii (odsuwa się wzdłuż +x).
 * Sloty podpisów:
 *   wycofanie    [kartony, wózek zwrotów, taśma];
 *   aktualizacja [urządzenie za bramką, jego pusta kieszeń, kaseta aktualizacji];
 *   naped        [zębnik napędu, urządzenie, ekran urządzenia].
 */
import { budget, Sketch, hi, meshPhase, plate, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule, Role, Tone } from '../scene.ts';
import { boxes, segs, vgear, type Box } from './_g3.ts';

const T = 6;
const W = 34; // szerokość taśmy (y)
const zL = 28; // spód ramy
const zRt = 35; // wierzch ramy
const RR = 2.6; // promień rolki (rolki leżą na ramie)
const zBb = zRt + 2 * RR + 4; // spód taśmy (przerwa rozstrzelenia nad rolkami)
const zBt = zBb + 2.5; // wierzch taśmy
const RD = 5; // promień bębna
const zD = zBt - RD; // oś bębna
const zC = zBt + 4; // spód ładunku na taśmie (przerwa rozstrzelenia)

/** Rama na nogach (g0), rolki (g1), taśma z bębnami (g2). Ładunek rysuje wariant (po taśmie). */
function conveyor(s: Sketch, x0: number, x1: number, legs: number[], thumb: boolean, belt: Tone = 'ink') {
  // nogi tylne i rama tylna, nogi przednie i rama przednia (nogi: dwie widoczne ściany, wierzch pod ramą)
  boxes(s, 0, legs.map((x): Box => [x - 2, 1, T, 4, 4, zL - T]), 'ink', { top: false });
  s.box(0, x0, -1, zL, x1 - x0, 3, zRt - zL);
  boxes(s, 0, legs.map((x): Box => [x - 2, W - 4, T, 4, 4, zL - T]), 'ink', { top: false });
  s.box(0, x0, W - 2, zL, x1 - x0, 3, zRt - zL);
  // g1: rolki leżą na ramie — widać ich czoła nad ramą przednią (w miniaturze same czoła)
  const step = thumb ? 36 : 24;
  for (let x = x0 + 16; x < x1 - 8; x += step)
    if (thumb) s.ell(1, 'top', [x, W + 1, zRt + RR], 'y', RR);
    else s.cylY(1, [x, W - 2, zRt + RR], 3, RR, { bore: 0.9 });
  // g2: bęben dalszy, pas taśmy, bęben czołowy
  s.cylY(2, [x0, 0, zD], W, RD, { bore: thumb ? 0 : 1.6 });
  s.box(2, x0, 0.5, zBb, x1 - x0, W - 1, zBt - zBb, belt === 'hi' ? { top: 'top-hi' } : 'ink');
  s.cylY(2, [x1, -0.5, zD], W + 1, RD, { bore: 1.6 });
}

/** Kartony (g, ton) w rzędzie — ściany zebrane wg roli; krzyż taśmy klejącej na wiekach. */
function cartons(s: Sketch, g: number, cs: [number, number, number][], tone: Tone, a = 20, b = 20, h = 15) {
  boxes(s, g, cs.map(([cx, cy, z]): Box => [cx - a / 2, cy - b / 2, z, a, b, h]), tone);
  const r: Role = tone === 'sig' ? 'edge-sig' : 'fine';
  segs(
    s,
    g,
    r,
    cs.flatMap(([cx, cy, z]): [V3, V3][] => [
      [[cx - a / 2, cy, z + h], [cx + a / 2, cy, z + h]],
      [[cx, cy - b / 2, z + h], [cx, cy + b / 2, z + h]],
      [[cx + a / 2, cy, z + h], [cx + a / 2, cy, z + h - 5]],
    ]),
  );
}

interface Dev {
  front: V3;
  pocket: V3;
  screen: V3;
  top: number;
}

/**
 * Urządzenia z ekranem na wierzchu i kieszenią na kasetę przy tylnej krawędzi, w rzędzie wzdłuż x (środki xs, oś cy,
 * spód z); ściany zebrane wg roli. pocket: 'full' (kaseta w kieszeni), 'empty' (pusta, przerywana — brak aktualizacji),
 * 'none' (pusta kieszeń).
 */
function devices(
  s: Sketch,
  g: number,
  list: { x: number; pocket: 'full' | 'empty' | 'none' }[],
  cy: number,
  z: number,
  o: { screen: Role; tone?: Tone; pocketTone?: Tone; thumb: boolean },
): Dev[] {
  const a = 26;
  const b = 22;
  const h = 10;
  const zt = z + h;
  const y0 = cy - b / 2;
  const rect = (xa: number, xb: number, ya: number, yb: number): V3[] => [[xa, ya, zt], [xb, ya, zt], [xb, yb, zt], [xa, yb, zt]];
  boxes(s, g, list.map((d): Box => [d.x - a / 2, y0, z, a, b, h]), o.tone ?? 'ink');
  for (const d of list) s.poly(g, o.screen, rect(d.x - a / 2 + 3, d.x + a / 2 - 3, y0 + 8, y0 + b - 3));
  for (const d of list) {
    const x1 = d.x + a / 2;
    if (!o.thumb) s.poly(g, 'bore', [[x1, y0 + 4, z + 3], [x1, y0 + 9, z + 3], [x1, y0 + 9, z + 6], [x1, y0 + 4, z + 6]]);
    if (d.pocket !== 'empty') s.poly(g, 'bore', rect(d.x - a / 2 + 5, x1 - 5, y0 + 2, y0 + 5.5));
  }
  if (!o.thumb) boxes(s, g, list.filter((d) => d.pocket === 'full').map((d): Box => [d.x - a / 2 + 6, y0 + 2.5, zt, a - 12, 2.5, 4]));
  for (const d of list)
    if (d.pocket === 'empty') s.dashed(() => s.poly(g, o.pocketTone === 'hi' && o.tone !== 'hi' ? 'top-hi' : 'top', rect(d.x - a / 2 + 5, d.x + a / 2 - 5, y0 + 2, y0 + 5.5)));
  return list.map((d) => ({ front: [d.x + a / 2, cy + 3, z + h / 2], pocket: [d.x + a / 2 - 5, y0 + 3.7, zt], screen: [d.x + a / 2 - 3, y0 + 14, zt], top: zt }));
}

/* ---------- wariant: wycofanie (recall) ---------- */
function wycofanie(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m);
  const head = !m.thumb;
  plate(s, { x0: -18, y0: -50, w: 310, d: 158, protect: [-10, -8, 284, 100], ticks: 30 });
  const X1 = 200;

  // tor zwrotny U na płycie: wylot w osi taśmy → łuk → powrót wzdłuż przodu do ogranicznika
  const yc = W / 2;
  const R = 34;
  const xT = 246;
  const yB = yc + 2 * R;
  const off = 5;
  for (const o of [-off, off]) {
    s.line(0, 'edge', [X1 + 10, yc + o, T], [xT, yc + o, T]);
    s.arc(0, 'edge', [xT, yc + R, T], 'z', R - o, -Math.PI / 2, Math.PI / 2);
    s.line(0, 'edge', [xT, yB - o, T], [40, yB - o, T]);
  }
  const ties: [V3, V3][] = [];
  for (let x = 62; x <= xT; x += head ? 22 : 33) ties.push([[x, yB - off - 2, T], [x, yB + off + 2, T]]);
  if (head) for (let x = X1 + 18; x <= xT; x += 22) ties.push([[x, yc - off - 2, T], [x, yc + off + 2, T]]);
  segs(s, 0, 'fine', ties);
  s.box(0, 34, yB - 9, T, 5, 18, 7);

  conveyor(s, 0, X1, [12, 100, 188], m.thumb, B.slots[2] ? t : 'ink');
  // g3: kartony jadą w prawo (+x) — moduł „OC za produkt”
  const xs = [30, 74, 118, 162];
  cartons(s, 3, xs.map((x): [number, number, number] => [x, W / 2, zC]), t);

  // g3: wózek zwrotów na torze (wraca w −x) z kartonem
  const cx = 186;
  const cw = 34;
  const cd = 24;
  const zc = T + 7;
  const wx = [cx - cw / 2 + 6, cx + cw / 2 - 6];
  for (const x of wx) s.ell(3, 'top', [x, yB - cd / 2 - 1, T + 4], 'y', 3.6);
  s.box(3, cx - cw / 2, yB - cd / 2, zc, cw, cd, 9, t);
  cartons(s, 3, [[cx - 2, yB, zc + 9 + 3]], 'ink', 20, 18, 13);
  for (const x of wx) s.cylY(3, [x, yB + cd / 2, T + 4], 2, 3.6, { bore: head ? 1.2 : 0 });
  // dyszel wózka po stronie +x
  segs(s, 3, 'edge', [
    [[cx + cw / 2, yB - 6, zc + 6], [cx + cw / 2 + 10, yB - 6, zc + 20]],
    [[cx + cw / 2, yB + 6, zc + 6], [cx + cw / 2 + 10, yB + 6, zc + 20]],
    [[cx + cw / 2 + 10, yB - 7, zc + 20], [cx + cw / 2 + 10, yB + 7, zc + 20]],
  ]);

  s.label(B.slots[0], [xs[3] + 10, W / 2 + 4, zC + 9], 'r', 3, t);
  s.label(B.slots[1], [cx + cw / 2, yB + 4, zc + 4.5], 'r', 3, t);
  s.label(B.slots[2], [X1 - 14, W - 0.5, zBb + 1.2], 'r', 2, t);

  // czerwień: karton zdjęty z linii, odstawiony za obrys (z tyłu, przy końcu linii)
  if (B.fault)
    s.out(() => {
      cartons(s, 0, [[240, -30, T]], 'sig');
      s.label(B.fault, [250, -26, T + 8], 'r', 0, 'sig');
    });
}

/* ---------- wariant: aktualizacja (PLD) ---------- */
function aktualizacja(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m);
  const head = !m.thumb;
  plate(s, { x0: -18, y0: -24, w: 214, d: 128, protect: [-10, -16, 188, 60], ticks: 30 });
  const X1 = 160;
  const px = 72;
  const zTop = 104;

  // czerwień: zsuwnia z boku linii (+y) na bocznicę do skrzyni odbiorcy firmowego, poza obrysem (rysowana na końcu)
  const cr = { x0: 118, x1: 150, y0: 70, y1: 96, h: 17 };

  // g4: tylny słup bramki za taśmą
  boxes(s, 4, [[px - 3, -12, T, 6, 6, zTop - T]], 'ink', { top: false });
  conveyor(s, 0, X1, [12, 84, 148], m.thumb);
  // g3: urządzenia — przed bramką, pod bramką (dostaje kasetę), za bramką z pustą kieszenią
  const scr: Role = 'bore';
  const d3 = devices(
    s,
    3,
    [
      { x: 24, pocket: 'full' },
      { x: px, pocket: 'none' },
      { x: 122, pocket: 'empty' },
    ],
    W / 2,
    zC,
    { screen: scr, tone: B.slots[0] ? t : 'ink', pocketTone: B.slots[1] ? t : 'ink', thumb: m.thumb },
  )[2];
  // g4: kaseta aktualizacji na prowadnicach, zjeżdża na urządzenie pod bramką
  const kz = 74;
  const cy = W / 2 - 6;
  if (head)
    segs(s, 4, 'fine', [
      [[px - 7, cy, zTop - 4], [px - 7, cy, kz + 12]],
      [[px + 7, cy, zTop - 4], [px + 7, cy, kz + 12]],
    ]);
  s.box(4, px - 8, cy - 1.5, kz, 16, 3, 12, B.slots[2] || m.thumb ? t : 'ink');
  s.arrow(4, [px, cy, kz - 3], [px, cy, zC + 16], { tone: t, hl: 6, hw: 4.5 });
  // przedni słup i belka bramki
  boxes(s, 4, [[px - 3, W + 6, T, 6, 6, zTop - T]], 'ink', { top: false });
  s.box(4, px - 5, -14, zTop, 10, W + 28, 8);

  s.label(B.slots[0], d3.front, 'r', 3, t);
  s.label(B.slots[1], d3.pocket, 'r', 3, t);
  s.label(B.slots[2], [px + 8, cy, kz + 8], 'r', 4, t);

  if (B.fault) {
    // zsuwnia (tusz, g0) — z ramy przedniej w dół do skrzyni
    const zs0 = zRt - 1;
    const zs1 = T + cr.h + 3;
    const sx0 = 124;
    const sx1 = 146;
    s.prism(0, [[sx0, W + 1, zs0], [sx1, W + 1, zs0], [sx1, cr.y0 - 2, zs1], [sx0, cr.y0 - 2, zs1]], [0, 0, -2.5]);
    segs(s, 0, 'edge', [
      [[sx0, W + 1, zs0 + 5], [sx0, cr.y0 - 2, zs1 + 5]],
      [[sx1, W + 1, zs0 + 5], [sx1, cr.y0 - 2, zs1 + 5]],
    ]);
    s.out(() => {
      s.box(0, cr.x0, cr.y0, T, cr.x1 - cr.x0, cr.y1 - cr.y0, cr.h, 'sig');
      segs(s, 0, 'edge-sig', [
        [[cr.x1, cr.y0, T + 8.5], [cr.x1, cr.y1, T + 8.5]],
        [[cr.x0, cr.y1, T + 8.5], [cr.x1, cr.y1, T + 8.5]],
      ]);
      s.label(B.fault, [cr.x1, (cr.y0 + cr.y1) / 2, T + cr.h * 0.6], 'r', 0, 'sig');
    });
  }
}

/* ---------- wariant: napęd (software house) ---------- */
function naped(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m);
  plate(s, { x0: -18, y0: -28, w: 290, d: 114, protect: [-10, -10, 222, 76], ticks: 30 });
  const X1 = 176;

  conveyor(s, 0, X1, [12, 94, 164], m.thumb);
  // g3: urządzenia z Twoim oprogramowaniem (ekran — moduł „Cyber”)
  const devs = devices(s, 3, [26, 74, 122].map((x) => ({ x, pocket: 'full' as const })), W / 2, zC, { screen: 'bore', tone: B.slots[1] ? t : 'ink', thumb: m.thumb });

  // napęd: duże koło na wale bębna czołowego (przed taśmą, oś y) i zębnik na silniku — Twoja usługa
  // miniatura: mniej, ale większych zębów (czytelniej i lżej)
  const mod = m.thumb ? 3.3 : 2.5;
  const big = { teeth: m.thumb ? 12 : 16, m: mod, phase: 0 };
  const small = { teeth: m.thumb ? 7 : 9, m: mod };
  const dist = (mod * (big.teeth + small.teeth)) / 2;
  const th = -35; // kierunek od koła do zębnika (° od +x ku +z): w prawo i w dół
  const pc: V3 = [X1 + dist * Math.cos((th * Math.PI) / 180), 0, zD + dist * Math.sin((th * Math.PI) / 180)];
  const gy = W + 4;
  // g0: silnik zębnika na podstawie (za zębnikiem)
  s.box(0, pc[0] - 11, 12, T, 22, 24, pc[2] - 9 - T);
  s.cylY(0, [pc[0], 14, pc[2]], gy - 14, 9, { noCap: true });
  // g2: wał bębna, duże koło, zębnik
  s.cylY(2, [X1, W + 0.5, zD], gy - W - 0.5, 2.2, { noCap: true });
  vgear(s, 2, [X1, gy, zD], { teeth: big.teeth, m: mod, thk: 4, phase: 0, hub: 6, bore: 2.2 });
  const sg = vgear(s, 2, [pc[0], gy + 0.5, pc[2]], { teeth: small.teeth, m: mod, thk: 4.5, tone: t, phase: meshPhase(big, small, th), bore: 2 });
  const zg = pc[2];
  s.label(B.slots[0], [pc[0] + sg.rp * 0.7, sg.front, zg + sg.rp * 0.3], 'r', 2, t);
  s.label(B.slots[1], devs[2].front, 'r', 3, t);
  s.label(B.slots[2], devs[2].screen, 'r', 3, t);

  // czerwień: kaseta z poprawką odłożona z przodu po prawej, poza obrysem
  if (B.fault)
    s.out(() => {
      const kx = 246;
      const ky = 62;
      s.box(0, kx - 14, ky - 9, T, 28, 18, 6, 'sig');
      s.poly(0, 'edge-sig', [[kx - 9, ky - 4, T + 6], [kx + 9, ky - 4, T + 6], [kx + 9, ky + 4, T + 6], [kx - 9, ky + 4, T + 6]]);
      s.label(B.fault, [kx + 14, ky, T + 3], 'r', 0, 'sig');
    });
}

function build(m: MotifInput) {
  const s = new Sketch();
  if (m.variant === 'aktualizacja') aktualizacja(s, m);
  else if (m.variant === 'naped') naped(s, m);
  else wycofanie(s, m);
  return s.scene({ zoom: m.variant === 'aktualizacja' ? 1.2 : 1.05 });
}

const WHAT: Record<string, string> = {
  wycofanie: 'taśma na nogach z kartonami jadącymi w prawo, a za końcem linii tor zwrotny w kształcie litery U, po którym wózek zwrotów wiezie karton z powrotem',
  aktualizacja: 'krótka taśma z urządzeniami pod bramką, z której zjeżdża kaseta aktualizacji; urządzenie za bramką ma pustą kieszeń na kasetę, a z boku linii zsuwnia prowadzi do skrzyni odbiorcy firmowego',
  naped: 'taśma z urządzeniami, w których działa Twoje oprogramowanie; bęben czołowy napędza para kół zębatych — duże koło na wale bębna i mały zębnik na silniku — a obok linii leży odłożona kaseta z poprawką',
};
const PARTS: Record<string, string[]> = {
  wycofanie: ['kartony na taśmie', 'wózek zwrotów', 'taśma'],
  aktualizacja: ['urządzenie za bramką', 'jego pusta kieszeń na kasetę', 'kaseta aktualizacji'],
  naped: ['mały zębnik napędu', 'urządzenia na taśmie', 'ekran urządzenia'],
};

const RED: Record<string, string> = {
  wycofanie: 'Jeden karton zdjęto z linii i odstawiono poza obrys',
  aktualizacja: 'Zsuwnia prowadzi z linii do skrzyni odbiorcy firmowego poza obrysem',
  naped: 'Kaseta z poprawką leży odłożona poza obrysem',
};

export const motif: MotifModule = {
  id: 'przenosnik',
  name: 'Przenośnik taśmowy',
  variants: ['wycofanie', 'aktualizacja', 'naped'],
  what: WHAT,
  describe: (d) => {
    let out = `Przenośnik taśmowy w widoku rozstrzelonym: ${WHAT[d.variant] ?? WHAT.wycofanie}.`;
    const parts = PARTS[d.variant] ?? PARTS.wycofanie;
    const named = d.labels.slice(0, 3).flatMap((l, i) => (l ? [`${parts[i]} — ${l}`] : []));
    if (named.length) out += ` Podpisane części: ${named.join(', ')}.`;
    if (d.fault) out += ` ${RED[d.variant] ?? RED.wycofanie}, na czerwono: ${d.fault} — tego polisa nie obejmuje.`;
    return out;
  },
  build,
};
