/**
 * „Instalacja rurowa z armaturą” — wszystko, co płynie: rury z kołnierzami na podporach siodłowych, jedna armatura
 * określa stronę. Na płycie nic poza podporami (bez ścieżek i pól).
 *
 * Warianty:
 *   kolektor (/kontakt/)       — dwa wloty z zaworami (kółka uniesione) łączą się w kolektorze z tabliczką,
 *                                z którego wychodzą dwa wyloty; wloty w lewej kolumnie, wyloty w prawej;
 *   rozdzielacz (/rynek-lloyds/) — jeden wlot przez złączkę redukcyjną do piasty rozdzielacza, z której wachlarzem
 *                                wychodzą jedna gruba gałąź (z zaworem) i trzy cieńsze — jedno ryzyko dzielone na udziały;
 *   licznik (/wiedza/llmjacking/) — rura wzdłuż y: skrzynkowy licznik z okienkiem i tabliczką, tuż za nim nielegalny
 *                                trójnik, którego długie odejście wychodzi poza krawędź płyty; przed licznikiem
 *                                martwa odnoga zamknięta czerwonym kołnierzem zaślepiającym poza obrysem ochrony (s.out);
 *   kolnierz (/ubezpieczenia/ubezpieczenia-transakcyjne/) — poziome złącze dwóch odcinków rur wychodzących z dwóch
 *                                bloków (dwie spółki): błękitny kołnierz A, uszczelka, błękitny kołnierz B; opaska
 *                                naprawcza na rysie jednego odcinka, czerwona rysa (zygzak) bez opaski na drugim;
 *                                rozsuwa się wzdłuż osi x. Podpisy polis na szczytach kołnierzy (sprzedający — lewy,
 *                                kupujący — prawy), czerwony — na prawym końcu rysy.
 * Grupy: g0 płyta + podpory (+ blok A, kołnierz A przy złączu), g1 biegi rur / uszczelka, g2 armatura / druga połowa
 * złącza, g3 kółka zaworów i pokrywa licznika.
 * Sloty: kolektor — wloty [górny, dolny], wyloty [górny, dolny]; rozdzielacz — wlot, [złączka, gruba gałąź,
 * cienka gałąź]; licznik — [licznik, odczep, wylot] + czerwień (zaślepka); kolnierz — [kołnierz B (polisa kupującego),
 * kołnierz A (polisa sprzedającego), opaska] + czerwień (rysa); w budżecie najpierw oba kołnierze, opaska ostatnia.
 */
import { budget, P, Sketch, hi, plate, type V2, type V3 } from '../prims.ts';
import { add, mul, type AxisName } from '../geom.ts';
import type { MotifInput, MotifModule, Tone } from '../scene.ts';
import { onCircle, rimAt } from './_g1.ts';

const T = 6;

/** Podpora siodłowa pod rurą o osi `axis` w punkcie (x, y), oś rury na wysokości zp (g0). */
function saddle(s: Sketch, axis: 'x' | 'y', x: number, y: number, r: number, zp: number) {
  const h = zp - r + 3 - T;
  if (axis === 'x') s.box(0, x - 4, y - r - 3, T, 8, 2 * r + 6, h);
  else s.box(0, x - r - 3, y - 4, T, 2 * r + 6, 8, h);
}

/** Kołnierz: tarcza grubości 3 o promieniu r + 5 (oś jak rura). */
const flange = (s: Sketch, g: number, axis: AxisName | V3, c: V3, r: number, tone: Tone = 'ink', dr = 5) => s.cyl(g, axis, c, 3, r + dr, { tone });

/** Kółko zaworu: obręcz (dwa pierścienie), trzy szprychy, piasta; c = środek spodu obręczy. */
function wheel(s: Sketch, g: number, c: V3, R: number) {
  const w = Math.max(1.8, R * 0.2);
  s.ring(g, 'side-r', c, 'z', R - w, R);
  const top: V3 = [c[0], c[1], c[2] + 2];
  for (const a of [30, 150, 270]) s.line(g, 'edge', onCircle(top, 'z', 2, a), onCircle(top, 'z', R - w, a));
  s.ring(g, 'top', top, 'z', R - w, R);
  s.cylZ(g, [c[0], c[1], c[2] - 1], 3.4, 2.4, { tone: 'ink' });
}

/** Zawór zasuwowy na rurze o kierunku `dir` (poziomym) w punkcie c: kołnierze, korpus, nasada; zwraca szczyt nasady. */
function gateValve(s: Sketch, g: number, dir: V3, c: V3, r: number, tone: Tone = 'ink', flanges = true): V3 {
  const at = (d: number) => add(c, mul(dir, d));
  if (flanges) s.cyl(g, dir, at(-9), 3, r + 5, { tone: 'ink' });
  s.cyl(g, dir, at(-6), 12, r + 3, { tone });
  s.cylZ(g, [c[0], c[1], c[2] + r], 9, 4.2, { tone: 'ink' });
  if (flanges) s.cyl(g, dir, at(6), 3, r + 5, { tone: 'ink' });
  return [c[0], c[1], c[2] + r + 9];
}

/** Trzpień (przerywany, g nasady) i kółko uniesione nad nasadą (g3); `plain` — sama obręcz i piasta (miniatura). */
function lifted(s: Sketch, gStem: number, top: V3, R: number, lift: number, plain = false) {
  const c: V3 = [top[0], top[1], top[2] + lift];
  if (plain) {
    s.ring(3, 'top', c, 'z', R - 2.4, R);
    s.cylZ(3, [c[0], c[1], c[2] - 1], 3, 2.4, { tone: 'ink' });
    return c;
  }
  s.line(gStem, 'fine-d', top, c);
  wheel(s, 3, c, R);
  return c;
}

/* ---------- kolektor: /kontakt/ ---------- */
function kolektor(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m, { inputs: 2 });
  const r = 7.5;
  const ZP = T + 14 + r;
  const xh = 100;
  const RH = 14;
  plate(s, { x0: 0, y0: 0, w: 192, d: 100, protect: [8, 8, 184, 92], ticks: 28 });
  const ins = [24, 76];
  const outs = [38, 62];
  // legary pod wlotami i wylotami, dwa siodła pod kolektorem
  s.box(0, 20, ins[0] - r - 3, T, 8, ins[1] - ins[0] + 2 * r + 6, ZP - r + 3 - T);
  for (const y of [14, 86]) saddle(s, 'y', xh, y, RH, ZP);
  s.box(0, 158, outs[0] - r - 3, T, 8, outs[1] - outs[0] + 2 * r + 6, ZP - r + 3 - T);
  const inAnch: V2[] = [];
  for (const y of ins) {
    flange(s, 1, 'x', [6, y, ZP], r);
    s.cylX(1, [9, y, ZP], 28, r, { noCap: true });
    const top = gateValve(s, 2, [1, 0, 0], [46, y, ZP], r, 'ink', !m.thumb);
    s.cylX(1, [55, y, ZP], xh - 55 - RH + 3, r, { noCap: true });
    lifted(s, 2, top, 10, m.thumb ? 9 : 11, m.thumb);
    // tylny wlot: kotwica na górze kołnierza (nad kółkiem przedniego zaworu), przedni — z lewej
    inAnch.push(rimAt([6, y, ZP], 'x', r + 5, y === ins[0] ? [-0.35, -1] : [-1, 0.15]));
  }
  // kolektor (g2) z tabliczką na grzbiecie (napis wzdłuż kolektora)
  s.cylY(2, [xh, 6, ZP], 88, RH, { tone: t });
  if (m.plate) {
    s.box(2, xh - 6, 26, ZP + RH - 1.5, 12, 48, 2, 'ink');
    s.mark(2, m.plate, [xh, 50, ZP + RH + 0.5], { u: [0, -1, 0], v: [1, 0, 0], size: 7, max: 42 });
  }
  const outAnch: V2[] = [];
  for (const y of outs) {
    s.cylX(1, [xh + RH - 3, y, ZP], 176 - xh - RH + 3, r, { noCap: true });
    flange(s, 1, 'x', [176, y, ZP], r);
    outAnch.push(rimAt([179, y, ZP], 'x', r + 5, [1, -0.2]));
  }
  B.inputs.forEach((txt, i) => s.label(txt, inAnch[i], 'l', 1, 'ink'));
  s.label(B.slots[0], outAnch[0], 'r', 1, t);
  s.label(B.slots[1], outAnch[1], 'r', 1, t);
}

/* ---------- rozdzielacz: /rynek-lloyds/ ---------- */
function rozdzielacz(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m, { inputs: 1 });
  const yh = 40;
  const ZP = T + 16 + 10;
  const xh = 96;
  const RH = 19;
  const zh = ZP + 6;
  plate(s, { x0: 0, y0: yh - 34, w: 214, d: 68, protect: [8, yh - 26, 206, yh + 26], ticks: 28 });
  // wlot (za piastą): kołnierz, rura, złączka redukcyjna (g2), cieńsza rura do piasty
  saddle(s, 'x', 22, yh, 10, ZP);
  flange(s, 1, 'x', [4, yh, ZP], 10);
  s.cylX(1, [7, yh, ZP], 30, 10, { noCap: true });
  flange(s, 1, 'x', [37, yh, ZP], 10);
  s.cylX(2, [42, yh, ZP], 4, 14, { tone: 'ink' });
  s.cylX(2, [46, yh, ZP], 16, 11, { r1: 6.5, tone: 'ink' });
  s.cylX(2, [62, yh, ZP], 4, 10, { tone: 'ink' });
  const aRed = rimAt([46, yh, ZP], 'x', 11, [-0.4, -1]);
  s.cylX(1, [66, yh, ZP], xh - 66, 6.5, { noCap: true });
  // piasta rozdzielacza (kula na cokole, g2)
  s.box(0, xh - 9, yh - 9, T, 18, 18, zh - RH - T + 4);
  s.sphere(2, [xh, yh, zh], RH, { tone: t });
  // wachlarz gałęzi w płaszczyźnie pionowej (y = yh): gruba poziomo z zaworem, trzy cieńsze coraz wyżej
  const dirOf = (deg: number): V3 => [Math.cos((deg * Math.PI) / 180), 0, Math.sin((deg * Math.PI) / 180)];
  const branch = (deg: number, L: number, r: number, valve: boolean) => {
    const d = dirOf(deg);
    const c0 = add([xh, yh, zh], mul(d, RH - 1));
    const end = add(c0, mul(d, L));
    const fr = valve ? r + 4 : r + 2.5;
    if (valve && !m.thumb) {
      const vc = add(c0, mul(d, 40));
      s.cyl(1, d, c0, 31, r, { noCap: true });
      const top = gateValve(s, 2, d, vc, r, 'ink');
      s.cyl(1, d, add(vc, mul(d, 9)), L - 49, r, { noCap: true });
      lifted(s, 2, top, 11, 10);
    } else s.cyl(1, d, c0, L, r, { noCap: true });
    s.cyl(1, d, end, 3, fr, { tone: valve ? t : 'ink' });
    return { end: add(end, mul(d, 3)), r: fr };
  };
  saddle(s, 'x', xh + RH + 66, yh, 9, zh);
  const thin3 = branch(74, 56, 4.5, false);
  const thin2 = branch(50, 64, 4.5, false);
  const thin1 = branch(26, 72, 4.5, false);
  const lead = branch(0, 90, 9, true);
  void thin1;
  void thin3;
  const endAnchor = (b: { end: V3; r: number }): V2 => rimAt(b.end, 'x', b.r, [1, -0.3]);
  if (B.inputs[0]) s.label(B.inputs[0], rimAt([4, yh, ZP], 'x', 15, [-1, 0.1]), 'l', 1, 'ink');
  // złączka leży na wlocie po lewej u góry: odnośnik w prawo przeciąłby piastę — lewa kolumna
  s.label(B.slots[0], aRed, 'l', 2, 'ink');
  s.label(B.slots[1], endAnchor(lead), 'r', 1, t);
  s.label(B.slots[2], endAnchor(thin2), 'r', 1, 'ink');
}

/* ---------- licznik: /wiedza/llmjacking/ ---------- */
function licznik(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m);
  const r = 8;
  const ZP = T + 14 + r;
  const XP = 40;
  plate(s, { x0: 0, y0: 0, w: 80, d: 272, protect: [8, 54, 72, 264], ticks: 30 });
  for (const y of [62, 226]) saddle(s, 'y', XP, y, r, ZP);
  // wlot (prawy górny koniec)
  flange(s, 1, 'y', [XP, 2, ZP], r);
  s.cylY(1, [XP, 5, ZP], 17, r, { noCap: true });
  // martwa odnoga: trójnik, krótki króciec w +x, czerwony kołnierz zaślepiający (poza obrysem, s.out)
  const yd = 30;
  s.cylY(2, [XP, yd - 8, ZP], 16, r + 3, { tone: 'ink' });
  s.cylX(2, [XP, yd, ZP], 26, 6, { noCap: true });
  let aDead: V2 = [0, 0];
  // czerwień tylko z podpisem (konkretne wyłączenie); bez niego zaślepka jest zwykłą częścią (tusz)
  const deadTone: Tone = B.fault ? 'sig' : 'ink';
  s.out(() => {
    s.cylX(2, [XP + 28, yd, ZP], 4, 13, { tone: deadTone });
    if (!m.thumb) for (let i = 0; i < 4; i++) s.ell(2, 'bore', onCircle([XP + 32, yd, ZP], 'x', 9.5, 45 + i * 90), 'x', 1.3);
    aDead = rimAt([XP + 32, yd, ZP], 'x', 13, [1, -0.1]);
    s.label(B.fault, aDead, 'r', 2, 'sig');
  });
  s.cylY(1, [XP, yd + 8, ZP], 46, r, { noCap: true });
  // licznik skrzynkowy (g2): kołnierze, korpus, okienko z liczydłem (bez cyfr) na wierzchu, tabliczka na boku
  const y0 = 86;
  const y1 = 128;
  flange(s, 2, 'y', [XP, y0 - 3, ZP], r);
  s.box(2, XP - 19, y0, ZP - 13, 38, y1 - y0, 30, t);
  const zt = ZP + 17;
  s.poly(2, 'fine-ink', [[XP - 11, y0 + 7, zt], [XP + 9, y0 + 7, zt], [XP + 9, y1 - 7, zt], [XP - 11, y1 - 7, zt]]);
  for (let i = 0; i < (m.thumb ? 4 : 5); i++) {
    const ya = y0 + 10 + i * 5.6;
    s.poly(2, 'bore', [[XP - 7, ya, zt], [XP + 5, ya, zt], [XP + 5, ya + 4.2, zt], [XP - 7, ya + 4.2, zt]]);
  }
  // tabliczka na boku licznika (w miniaturze pismo miałoby ~3 px — tam bez niej)
  if (m.plate && !m.thumb) {
    const xf = XP + 19.05;
    s.poly(2, 'fine-ink', [[xf, y1 - 4, ZP - 5], [xf, y0 + 4, ZP - 5], [xf, y0 + 4, ZP + 7], [xf, y1 - 4, ZP + 7]]);
    s.mark(2, m.plate, [xf, (y0 + y1) / 2, ZP + 1], { u: [0, -1, 0], v: [0, 0, -1], size: 5.2, max: y1 - y0 - 11 });
  }
  flange(s, 2, 'y', [XP, y1, ZP], r);
  // kotwica pod tabliczką (odnośnik w prawo przechodzi pod podporą i martwą odnogą)
  const aMeter = P([XP + 19, y1 - 6, ZP - 9]);
  if (!m.thumb) {
    // pokrywa licznika uniesiona (g3)
    s.line(2, 'fine-d', [XP + 19, y0, zt], [XP + 19, y0, zt + 12]);
    s.box(3, XP - 17, y0 + 2, zt + 12, 34, y1 - y0 - 4, 3, 'ink');
  }
  // nielegalny trójnik tuż za licznikiem; długie odejście w +x poza krawędź płyty (tusz: zdarzenie objęte modułem)
  s.cylY(1, [XP, y1 + 3, ZP], 18, r, { noCap: true });
  const yt = 158;
  s.cylY(2, [XP, yt - 8, ZP], 16, r + 3, { tone: 'ink' });
  const xe = 136;
  s.cylX(2, [XP, yt, ZP], xe - XP, 6.5, { noCap: true });
  s.cylX(2, [xe, yt, ZP], 3, 9.5, { tone: 'ink', bore: 5 });
  s.line(2, 'fine-d', [xe + 3, yt, ZP], [xe + 24, yt, ZP], { nobox: true });
  const aTap = rimAt([xe + 3, yt, ZP], 'x', 9.5, [0.3, 1]);
  // dalej rura do wylotu (lewy dolny koniec)
  s.cylY(1, [XP, yt + 8, ZP], 262 - yt - 8, r, { noCap: true });
  flange(s, 1, 'y', [XP, 262, ZP], r);
  const aOut = rimAt([XP, 265, ZP], 'y', r + 5, [1, 0.6]);
  s.label(B.slots[0], aMeter, 'r', 2, t);
  s.label(B.slots[1], aTap, 'r', 2, 'ink');
  s.label(B.slots[2], aOut, 'r', 1, t);
}

/* ---------- kolnierz: /ubezpieczenia/ubezpieczenia-transakcyjne/ ---------- */
function kolnierz(s: Sketch, m: MotifInput) {
  const t = hi(m);
  // oba kołnierze (dwie spółki) mają podpis w każdym kadrze; opaska („ryzyka zidentyfikowane”) — tylko gdy zostaje miejsce
  const B = budget(m, { order: [0, 1, 2] });
  const YP = 40;
  const r = 12;
  const ZP = T + 28;
  const RF = r + 11;
  // obrys ochrony kończy się za kołnierzem B: czerwona rysa leży już poza nim
  plate(s, { x0: 0, y0: 4, w: 278, d: 72, protect: [8, 12, 140, 68], ticks: 28 });
  const block = (g: number, x0: number) => s.box(g, x0, YP - 26, T, 40, 52, ZP + r + 2 - T, 'ink');
  const RIM: V2 = [1, -0.55];
  // strona A (g0): blok, odcinek rury z opaską na rysie, kołnierz
  block(0, 4);
  if (m.plate) s.mark(0, m.plate, [24, YP + 8, ZP + r + 2], { size: 11, max: 32 });
  s.cylX(0, [44, YP, ZP], 56, r, { noCap: true });
  // rysa pod opaską (tusz) — końce wystają spod opaski
  const crackPts = (x: number, a0: number, a1: number, n: number, amp: number, rr: number): V3[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      return [x + (i % 2 ? amp : -amp), YP + rr * Math.cos((a * Math.PI) / 180), ZP + rr * Math.sin((a * Math.PI) / 180)] as V3;
    });
  s.poly(0, 'edge', crackPts(70, 0, 100, 6, 2.2, r + 0.2), false);
  const clamp = s.cylX(0, [62, YP, ZP], 16, r + 2.5, { tone: t });
  if (!m.thumb) s.box(0, 66, YP - 4, ZP + r + 1.5, 8, 8, 5, 'ink');
  void clamp;
  // szczyt opaski leży na rysunku wyżej niż szczyty kołnierzy: jej odnośnik idzie górą, nad złączem
  const aClamp = rimAt([78, YP, ZP], 'x', r + 2.5, [0, -1]);
  const tA = B.slots[1] ? t : 'ink';
  const tB = B.slots[0] ? t : 'ink';
  flange(s, 0, 'x', [100, YP, ZP], r, tA, 11);
  if (!m.thumb) for (let i = 0; i < 6; i++) s.ell(0, 'bore', onCircle([103, YP, ZP], 'x', r + 6, 30 + i * 60), 'x', 1.8);
  s.ell(0, 'bore', [103, YP, ZP], 'x', r - 2);
  // szczyt kołnierza na rysunku (najwyższy punkt elipsy): odnośnik w prawo idzie nad kołnierzem B
  const TOPDIR: V2 = [0, -1];
  const aFlA = rimAt([103, YP, ZP], 'x', RF, TOPDIR);
  // uszczelka (g1)
  s.cylX(1, [116, YP, ZP], 2.5, RF - 3, { tone: 'ink', bore: r - 1 });
  // strona B (g2): kołnierz, odcinek z czerwoną rysą bez opaski, blok
  flange(s, 2, 'x', [131, YP, ZP], r, tB, 11);
  const aFlB = rimAt([134, YP, ZP], 'x', RF, TOPDIR);
  s.cylX(2, [134, YP, ZP], 100, r, { noCap: true });
  const red = crackPts(147, 8, 112, 8, 3, r + 0.3);
  s.poly(2, B.fault ? 'edge-sig' : 'edge', red, false);
  block(2, 234);
  s.label(B.slots[0], aFlB, 'r', 2, tB);
  s.label(B.slots[1], aFlA, 'r', 0, tA);
  s.label(B.slots[2], aClamp, 'r', 0, t);
  s.label(B.fault, P(red[red.length - 1]), 'r', 2, 'sig');
}

function build(m: MotifInput) {
  const s = new Sketch();
  switch (m.variant) {
    case 'rozdzielacz':
      rozdzielacz(s, m);
      return s.scene({ zoom: 1.2 });
    case 'licznik':
      licznik(s, m);
      return s.scene({ zoom: 1.25 });
    case 'kolnierz':
      kolnierz(s, m);
      return s.scene({ axis: 'x', zoom: 1.3 });
    default:
      kolektor(s, m);
      return s.scene({ zoom: 1.2 });
  }
}

export const motif: MotifModule = {
  id: 'rurociag',
  name: 'Instalacja rurowa',
  variants: ['kolektor', 'rozdzielacz', 'licznik', 'kolnierz'],
  what: {
    kolektor: 'dwa wloty z zaworami łączą się w kolektorze z tabliczką, z którego wychodzą dwa wyloty',
    rozdzielacz: 'jeden wlot przez złączkę redukcyjną do rozdzielacza, z którego wachlarzem wychodzą jedna gruba gałąź z zaworem i trzy cieńsze',
    licznik: 'rura ze skrzynkowym licznikiem przepływu; tuż za licznikiem nielegalny odczep wyprowadzony poza płytę, przed nim zaślepiona martwa odnoga',
    kolnierz: 'złącze dwóch rur wychodzących z dwóch bloków: kołnierz, uszczelka i kołnierz, opaska naprawcza na jednej rysie i druga rysa bez opaski',
  },
  build,
};
