/**
 * „Belka na podporach” (schemat obciążeń, 3D bliźniak rysunku filaru IT): dwuteownik na podporach-klinach,
 * obciążenia strzałkami w dół, bez liczb. Polisa = podpora, roszczenie = obciążenie; obciążenie bez podpory
 * (czerwona strzałka za wolnym końcem belki) nie zostaje przeniesione — to wyłączenie z tabeli zakresu.
 *
 * Belka biegnie wzdłuż osi y sceny (z prawej-u góry w lewo-w dół): wolny koniec i czerwona strzałka są po prawej
 * u góry, a odnośniki podpór idą w prawo POD belką — wszystkie podpisy w prawej kolumnie, bez krzyżowania belki.
 * Czoło przekroju (profil I) widać na bliższym końcu (ściana y = y1).
 *
 * Warianty: ciagla — trzy podpory, siła skupiona i obciążenie ciągłe; umowa — belka dźwiga blok umowy klienta,
 * z którego schodzą obciążenia, a blok wystaje za koniec belki; wspornik — dwie płyty z przerwą (dwa terytoria),
 * belka przerzucona wspornikiem nad przerwą, daleka podpora (USA i Kanada) narysowana linią przerywaną.
 * Grupy: g0 płyta + stopy podpór, g1 podpory, g2 dwuteownik, g3 strzałki (czerwona: s.out, odsuwa się wzdłuż −y),
 * g4 blok umowy.
 * Sloty podpisów: ciagla [podpora środkowa (stała), podpora przy wolnym końcu, podpora bliższa];
 * umowa [środkowa, bliższa, przy wolnym końcu]; wspornik [podpora stała na pierwszej płycie, podpora przerywana].
 */
import { budget, Sketch, hi, plate, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule, Tone } from '../scene.ts';
import { arrows } from './_g1.ts';

/** Oś belki (x) i szerokość półek. */
const XC = 35;
const BW = 26;
const T = 6;
const zF = T + 3; // wierzch stopy
const RR = 3.6; // rolka
const zW = zF + 5 + 2 * RR; // spód klina na rolkach
const zA = zW + 19; // wierzchołek klina
const zB = zA + 7; // spód belki
const BH = 24;
const FL = 3.8;
const zT = zB + BH; // wierzch belki
const zTip = zT + 3; // groty obciążeń
const ARR = 20;

type Look = 'hi' | 'ink' | 'dash';

/** Stopa podpory (płaska podkładka na płycie) — g0. */
function foot(s: Sketch, y: number, look: Look) {
  const draw = () => s.box(0, XC - 17, y - 17, T, 34, 34, 3, 'ink');
  if (look === 'dash') s.dashed(draw);
  else draw();
}

/**
 * Podpora: klin (pryzmat trójkątny wyciągnięty wzdłuż x), przesuwna — na dwóch rolkach, stała — wyższy klin ze sworzniem.
 * Zwraca kotwicę etykiety (prawa ściana klina).
 */
function support(s: Sketch, y: number, kind: 'pin' | 'roller', look: Look, tone: Tone, thumb: boolean): V3 {
  const f: Tone = look === 'ink' ? 'ink' : tone;
  const draw = () => {
    const roller = kind === 'roller' && look !== 'dash';
    if (roller) for (const dy of [-7, 7]) s.cylX(1, [XC - 13, y + dy, zF + 5 + RR], 26, RR, { tone: 'ink' });
    const z0 = roller ? zW : zF + 5;
    const hw = roller ? 14 : 16;
    s.prism(1, [[XC - 13, y - hw, z0], [XC - 13, y + hw, z0], [XC - 13, y, zA]], [26, 0, 0], f);
    if (kind === 'pin' && !thumb) s.cylX(1, [XC - 15, y, zA - 1], 30, 3.2, { tone: 'ink' });
  };
  if (look === 'dash') s.dashed(draw);
  else draw();
  return [XC + 13, y + 1, zA - 10];
}

/** Dwuteownik wzdłuż y od y0 do y1; czoło przekroju na y = y1 (z przodu po lewej). */
function beam(s: Sketch, g: number, y0: number, y1: number) {
  const L = y1 - y0;
  const x0 = XC - BW / 2;
  const tw = 4.4;
  s.box(g, x0, y0, zB, BW, L, FL);
  s.box(g, XC - tw / 2, y0, zB + FL, tw, L, BH - 2 * FL);
  s.box(g, x0, y0, zT - FL, BW, L, FL);
  const xa = x0;
  const xb = x0 + BW;
  const I: [number, number][] = [
    [xa, zB], [xb, zB], [xb, zB + FL], [XC + tw / 2, zB + FL], [XC + tw / 2, zT - FL], [xb, zT - FL],
    [xb, zT], [xa, zT], [xa, zT - FL], [XC - tw / 2, zT - FL], [XC - tw / 2, zB + FL], [xa, zB + FL],
  ];
  s.poly(g, 'side-l', I.map(([x, z]) => [x, y1, z] as V3));
}

/** Czerwona strzałka obciążenia (s.out): od zTop do zEnd, z podpisem. Bez czerwonego podpisu — zwykła strzałka (tusz). */
function redLoad(s: Sketch, y: number, zTop: number, zEnd: number, fault: string | undefined, g = 3) {
  if (!fault) {
    arrows(s, g, [[[XC, y, zTop], [XC, y, zEnd]]], { hl: 10, hw: 7 });
    return;
  }
  s.out(() => {
    arrows(s, g, [[[XC, y, zTop], [XC, y, zEnd]]], { tone: 'sig', hl: 10, hw: 7 });
    s.label(fault, [XC, y, zEnd + (zTop - zEnd) * 0.62], 'r', g, 'sig');
  });
}

function ciagla(s: Sketch, m: MotifInput, umowa: boolean) {
  const t = hi(m);
  const { zt } = plate(s, { x0: 0, y0: 0, w: 70, d: 300, protect: [9, 56, 61, 291], ticks: 30 });
  void zt;
  const Y = { free: 80, mid: 165, near: 250 };
  for (const y of [Y.free, Y.mid, Y.near]) foot(s, y, 'hi');
  const aFree = support(s, Y.free, 'roller', 'hi', t, m.thumb);
  const aMid = support(s, Y.mid, 'pin', 'hi', t, m.thumb);
  const aNear = support(s, Y.near, 'roller', 'hi', t, m.thumb);
  beam(s, 2, 38, 272);
  const B = budget(m, { order: m.thumb ? [0, 1, 2] : [0, 1, 2] });
  const [lMid, l1, l2] = [B.slots[0], B.slots[1], B.slots[2]];
  // podpisy podpór: kolejność slotów zależy od wariantu (tabela stron: ciagla — środkowa, przy końcu, bliższa)
  const lFree = umowa ? l2 : l1;
  const lNear = umowa ? l1 : l2;
  if (!umowa) {
    // siła skupiona i obciążenie ciągłe
    const zh = zTip + ARR * 0.62;
    const ys = m.thumb ? [196, 214, 232] : [190, 204, 218, 232];
    s.line(3, 'edge', [XC, ys[0], zh], [XC, ys[ys.length - 1], zh]);
    arrows(s, 3, [
      [[XC, 120, zTip + ARR], [XC, 120, zTip]],
      ...ys.map((y): [V3, V3] => [[XC, y, zh], [XC, y, zTip]]),
    ], { hl: 7, hw: 5 });
    redLoad(s, 16, zTip + ARR + 4, T + 3, B.fault);
  } else {
    // blok umowy klienta (g4) — wystaje za wolny koniec belki; obciążenia schodzą z bloku na belkę
    const zK = zTip + ARR;
    arrows(s, 3, (m.thumb ? [70, 140] : [62, 105, 148]).map((y): [V3, V3] => [[XC, y, zK], [XC, y, zTip]]), { hl: 7, hw: 5 });
    redLoad(s, 18, zK - 1, T + 3, B.fault);
    const y0 = 4;
    const y1 = 166;
    const H = 20;
    s.box(4, XC - 19, y0, zK, 38, y1 - y0, H, 'ink');
    // arkusz umowy na bloku: prostokąt z zagiętym rogiem i wiersze tekstu (bez napisów)
    const zs = zK + H;
    s.poly(4, 'top', [[XC - 11, 40, zs + 0.6], [XC + 11, 40, zs + 0.6], [XC + 11, 140, zs + 0.6], [XC - 3, 140, zs + 0.6], [XC - 11, 132, zs + 0.6]]);
    const rows = m.thumb ? [0, 1, 2] : [0, 1, 2, 3];
    for (const i of rows) s.line(4, 'fine', [XC + 6 - i * 4.5, 52, zs + 0.6], [XC + 6 - i * 4.5, i === rows.length - 1 ? 96 : 128, zs + 0.6]);
  }
  s.label(lMid, aMid, 'r', 1, t);
  s.label(lFree, aFree, 'r', 1, t);
  s.label(lNear, aNear, 'r', 1, t);
}

function wspornik(s: Sketch, m: MotifInput) {
  const t = hi(m);
  // pierwsza płyta (terytorium objęte polisą) i druga, za przerwą — bez obrysu ochrony
  plate(s, { x0: 0, y0: 112, w: 70, d: 188, protect: [9, 121, 61, 291], ticks: 30 });
  plate(s, { x0: 0, y0: 0, w: 70, d: 74, protect: null, ticks: false });
  const B = budget(m);
  foot(s, 250, 'ink');
  foot(s, 165, 'hi');
  foot(s, 44, 'dash');
  support(s, 250, 'roller', 'ink', t, m.thumb);
  const aPin = support(s, 165, 'pin', 'hi', t, m.thumb);
  const aDash = support(s, 44, 'pin', 'dash', t, m.thumb);
  beam(s, 2, 14, 272);
  arrows(s, 3, [
    [[XC, 210, zTip + ARR], [XC, 210, zTip]],
    [[XC, 100, zTip + ARR], [XC, 100, zTip]],
  ], { hl: 7, hw: 5 });
  redLoad(s, 20, zTip + ARR + 6, zTip, B.fault);
  s.label(B.slots[0], aPin, 'r', 1, t);
  s.label(B.slots[1], aDash, 'r', 1, t);
}

function build(m: MotifInput) {
  const s = new Sketch();
  if (m.variant === 'wspornik') wspornik(s, m);
  else ciagla(s, m, m.variant === 'umowa');
  return s.scene({ outDir: '-y', zoom: 1.1 });
}

export const motif: MotifModule = {
  id: 'belka',
  name: 'Belka na podporach',
  variants: ['ciagla', 'umowa', 'wspornik'],
  what: {
    ciagla: 'dwuteownik na trzech podporach, z góry siła skupiona i obciążenie ciągłe; za wolnym końcem belki obciążenie spada bez podparcia',
    umowa: 'dwuteownik na trzech podporach dźwiga blok umowy klienta, z którego schodzą obciążenia; blok wystaje za koniec belki',
    wspornik:
      'belka na dwóch podporach przechodzi we wspornik przerzucony nad przerwą między dwiema płytami, a daleka podpora na drugiej płycie jest narysowana linią przerywaną',
  },
  build,
};
