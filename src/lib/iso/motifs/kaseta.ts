/**
 * Motyw „Kaseta z gniazdami” — otwarta skrzynka warsztatowa, we wkładce gniazda wycięte na wymiar przedmiotów
 * (wzorce i dopasowanie). Wkładka to wierzch skrzynki (bez unoszących się warstw); przedmioty stoją albo leżą
 * nieco nad swoimi gniazdami (g1).
 *   wzorce   — /slownik/: komplet sześciu płytek wzorcowych stojących pionowo w gniazdach (coraz cieńsze ku
 *              przodowi, wysokości prawie równe), wieko otwarte do tyłu i oparte o płytę, na wieku grawer (A–Z).
 *   na-miare — /ubezpieczenia/ryzyka-nietypowe/: cztery duże, wyraźnie różne gniazda (koło, pierścień, trójkąt,
 *              kwadrat) i bryły nad nimi; czerwień: nieregularna bryła bez gniazda poza kasetą i obrysem.
 *   przybory — /zespol/marek-ciesla/: bez wieka; cyrkiel, ekierka i przymiar (nagłówek: także grafion) nad
 *              gniazdami w ich kształcie.
 * Sloty: wzorce [płytka 1…4]; na-miare [kula, pierścień, graniastosłup, kostka]; przybory [cyrkiel, ekierka,
 * przymiar, grafion]. Odnośniki w prawą kolumnę: przedmioty z tyłu i z lewej stoją wyżej na rysunku.
 */
import { Sketch, plate, take, type V2, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule } from '../scene.ts';
import { caseSides, insertWithHoles, protectPoly, rectZ, slotTone, type Hole } from './_g2.ts';

/** Wielokąt 2D przesunięty od środka ciężkości o d (dla wypukłych: gniazdo z luzem). */
function inflate(pts: V2[], d: number): V2[] {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return pts.map(([x, y]) => {
    const l = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d];
  });
}
const at = (pts: V2[], z: number): V3[] => pts.map(([x, y]) => [x, y, z]);

/* ---------------- wzorce ---------------- */

function wzorce(m: MotifInput, s: Sketch) {
  const L = take(m);
  const thumb = m.thumb;
  const W = 240;
  const D = 140;
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: [10, 8, W - 10, D - 8] });
  const x0 = 18;
  const x1 = 222;
  const y0 = 66;
  const y1 = 130;
  const ZT = zt + 20;

  // wieko otwarte do tyłu, oparte o płytę (wewnętrzna strona do góry), zawiasy, grawer z tabliczki
  const ly = 52;
  const lidIn: V3[] = [[x0, y0, ZT], [x1, y0, ZT], [x1, y0 - ly, zt + 5], [x0, y0 - ly, zt + 5]];
  s.prism(0, lidIn, [0, 0, -5], 'ink');
  s.poly(0, 'fine', [[x0 + 8, y0 - 6, ZT - 2], [x1 - 8, y0 - 6, ZT - 2], [x1 - 8, y0 - ly + 6, zt + 6.5], [x0 + 8, y0 - ly + 6, zt + 6.5]]);
  const sl = (ZT - zt - 5) / ly;
  const k = 1 / Math.hypot(1, sl);
  s.mark(0, m.plate, [x1 - 30, y0 - ly / 2, (ZT + zt + 5) / 2], { u: [1, 0, 0], v: [0, k, -sl * k], size: 18, max: 60 });

  // skrzynka z wkładką: gniazda na płytki stojące pionowo
  caseSides(s, 0, x0, y0, x1, y1, zt, ZT);
  for (const x of [x0 + 26, x1 - 40]) s.cylX(0, [x, y0, ZT], 14, 3);
  if (!thumb) for (const x of [x0 + 34, x1 - 46]) s.poly(0, 'fine-ink', [[x, y1, ZT - 5], [x + 12, y1, ZT - 5], [x + 12, y1, ZT - 13], [x, y1, ZT - 13]]);
  // komplet płytek: różna GRUBOŚĆ (jak prawdziwe płytki wzorcowe), wysokości maleją tylko lekko — nie wykres słupkowy;
  // odstęp i spadek wysokości dają kotwice co ~20 jedn. (podpisy bez ukośnych odnośników przez sąsiednie płytki)
  const H = thumb ? [50, 47, 44, 41, 38] : [52, 49, 46, 43, 40, 37];
  const BW = thumb ? [16, 12, 8, 5, 3] : [16, 12, 9, 6, 4, 2.5];
  const bx = (i: number) => 32 + (thumb ? 36 : 34) * i;
  // miniatura: podpisy co drugą płytkę (0, 2, 4) — trzy podpisy w niskim kadrze bez zbiegania się odnośników
  const blockOf = (slot: number) => (thumb ? slot * 2 : slot);
  const bd = 34;
  const yb = 86;
  const holes: Hole[] = H.map((_, i) => rectZ(bx(i) - 1.5, yb - 1.5, bx(i) + BW[i] + 1.5, yb + bd + 1.5, ZT));
  insertWithHoles(s, 0, rectZ(x0, y0, x1, y1, ZT), holes, 5, 'top', thumb);

  // płytki wzorcowe (g1) — stoją pionowo (cienkie płytki, nie słupki), uniesione nad gniazdami
  const lift = thumb ? 8 : 16;
  H.forEach((h, i) => {
    const slot = [0, 1, 2, 3].find((k) => blockOf(k) === i);
    const tone = slot !== undefined ? slotTone(m, L.labels[slot]) : 'ink';
    s.box(1, bx(i), yb, ZT + lift, BW[i], bd, h, tone);
    if (slot !== undefined) s.label(L.labels[slot], [bx(i) + BW[i], yb + 3, ZT + lift + h], 'r', 1, tone);
  });
}

/* ---------------- na miarę ---------------- */

function naMiare(m: MotifInput, s: Sketch) {
  const L = take(m);
  const thumb = m.thumb;
  const W = 276;
  const D = 128;
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: null });
  protectPoly(s, [[10, 10], [W - 10, 10], [W - 10, 84], [232, 84], [232, D - 10], [10, D - 10]], zt);
  const x0 = 18;
  const x1 = 226;
  const y0 = 22;
  const y1 = 106;
  const ZT = zt + 20;
  const yc = 64;
  const X = [46, 98, 150, 198];

  // bryła bez gniazda (czerwień) — nieregularna, leży poza kasetą i obrysem
  if (L.fault)
    s.out(() => {
      // w wycięciu obrysu, z dala od krawędzi płyty (także po odsunięciu o OUT0 wzdłuż +x)
      const jag: V3[] = at([[238, 94], [250, 90], [257, 97], [254, 103], [259, 109], [243, 112], [239, 105]], zt);
      s.prism(0, jag, [0, 0, 13], 'sig');
      s.label(L.fault, [257, 97, zt + 13], 'r', 0, 'sig');
    });

  caseSides(s, 0, x0, y0, x1, y1, zt, ZT);
  const tri = (cx: number, r: number): V2[] => [[cx - r * 0.6, yc - r], [cx + r * 0.95, yc - r * 0.1], [cx - r * 0.6, yc + r * 0.85]];
  const holes: Hole[] = [
    { c: [X[0], yc, ZT], r: 17.5 },
    { c: [X[1], yc, ZT], r: 20, post: 7 },
    at(inflate(tri(X[2], 17), 2.2), ZT),
    rectZ(X[3] - 16, yc - 16, X[3] + 16, yc + 16, ZT),
  ];
  insertWithHoles(s, 0, rectZ(x0, y0, x1, y1, ZT), holes, 6);

  // bryły (g1) nad gniazdami, od tyłu
  const lift = thumb ? 10 : 20;
  const zo = ZT + lift;
  const tn = (i: number) => slotTone(m, L.labels[i]);
  s.sphere(1, [X[0], yc, zo + 16], 16, { tone: tn(0) });
  s.tube(1, 'z', [X[1], yc, zo], 10, 7.6, 18.5, { tone: tn(1) });
  s.prism(1, at(tri(X[2], 17), zo), [0, 0, 18], tn(2));
  s.box(1, X[3] - 14, yc - 14, zo, 28, 28, 22, tn(3));

  // podpisy: prawy skraj każdej bryły
  const R0 = 16 * Math.sqrt(1.5);
  const C0 = [((X[0] - yc) * Math.sqrt(3)) / 2, (X[0] + yc) / 2 - zo - 16] as V2;
  s.label(L.labels[0], [C0[0] + R0 * 0.82, C0[1] - R0 * 0.5], 'r', 1, tn(0));
  s.label(L.labels[1], [X[1] + 13, yc - 13, zo + 10], 'r', 1, tn(1));
  s.label(L.labels[2], [X[2] + 16, yc - 1.7, zo + 18], 'r', 1, tn(2));
  s.label(L.labels[3], [X[3] + 14, yc - 14, zo + 22], 'r', 1, tn(3));
}

/* ---------------- przybory ---------------- */

function przybory(m: MotifInput, s: Sketch) {
  const L = take(m);
  const thumb = m.thumb;
  const W = 252;
  const D = 150;
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: [8, 6, W - 8, D - 6] });
  const x0 = 16;
  const x1 = 236;
  const y0 = 16;
  const y1 = 136;
  const ZT = zt + 20;
  const lift = thumb ? 6 : 12;
  const zo = ZT + lift;
  const tn = (i: number) => slotTone(m, L.labels[i]);

  // kształty przyborów (rzut na płaszczyznę wkładki)
  const ruler: V2[] = [[26, 114], [226, 114], [226, 127], [26, 127]];
  const Hh: V2 = [38, 70];
  const A: V2 = [126, 44];
  const B: V2 = [122, 92];
  const sq: V2[] = [[150, 34], [218, 34], [150, 84]];
  const pen: V2[] = [[26, 24], [104, 24], [104, 33], [26, 33]];
  const withPen = !thumb && !!L.labels[3];

  caseSides(s, 0, x0, y0, x1, y1, zt, ZT);
  const holes: Hole[] = [
    at(inflate(ruler, 2), ZT),
    at(inflate([[Hh[0] - 6, Hh[1]], [A[0] + 4, A[1] - 3], [B[0] + 4, B[1] + 3]], 3), ZT),
    at(inflate(sq, 2.5), ZT),
  ];
  if (withPen) holes.push(at(inflate(pen, 1.5), ZT));
  insertWithHoles(s, 0, rectZ(x0, y0, x1, y1, ZT), holes, 5);

  // grafion (nagłówek) — z tyłu
  if (withPen) {
    s.cylX(1, [26, 28.5, zo + 5], 58, 5, { tone: tn(3) });
    s.cylX(1, [84, 28.5, zo + 5], 12, 3.6);
    s.cylX(1, [96, 28.5, zo + 5], 9, 1);
    s.label(L.labels[3], [105, 28.5, zo + 5], 'r', 1, tn(3));
  }

  // cyrkiel: główka i dwa ramiona leżące w literę V
  {
    const tone = tn(0);
    const leg = (P: V2, w: number) => {
      const dx = P[0] - Hh[0];
      const dy = P[1] - Hh[1];
      const l = Math.hypot(dx, dy);
      const nx = (-dy / l) * w;
      const ny = (dx / l) * w;
      s.prism(1, at([[Hh[0] + nx, Hh[1] + ny], [P[0] - dx / l * 6 + nx * 0.5, P[1] - dy / l * 6 + ny * 0.5], P, [P[0] - dx / l * 6 - nx * 0.5, P[1] - dy / l * 6 - ny * 0.5], [Hh[0] - nx, Hh[1] - ny]], zo), [0, 0, 3.5], tone);
    };
    leg(A, 4.2);
    leg(B, 4.2);
    s.cylZ(1, [Hh[0], Hh[1], zo], 6, 9, { tone });
    s.cylZ(1, [Hh[0], Hh[1], zo + 6], 8, 3);
    s.label(L.labels[0], [A[0], A[1], zo + 3.5], 'r', 1, tone);
  }

  // ekierka z wycięciem
  {
    const tone = tn(1);
    s.prism(1, at(sq, zo), [0, 0, 4], tone);
    const cx = (sq[0][0] + sq[1][0] + sq[2][0]) / 3;
    const cy = (sq[0][1] + sq[1][1] + sq[2][1]) / 3;
    s.poly(1, 'bore', at(sq.map(([x, y]): V2 => [cx + (x - cx) * 0.42, cy + (y - cy) * 0.42]), zo + 4));
    s.label(L.labels[1], [sq[1][0] - 3, sq[1][1] + 1, zo + 4], 'r', 1, tone);
  }

  // przymiar z podziałką (z przodu)
  {
    const tone = tn(2);
    s.prism(1, at(ruler, zo), [0, 0, 3], tone);
    const step = thumb ? 16 : 8;
    let i = 0;
    for (let x = 34; x < 222; x += step, i++) s.line(1, 'fine-ink', [x, 114, zo + 3], [x, 114 + (i % (thumb ? 2 : 5) === 0 ? 7 : 3.5), zo + 3]);
    s.label(L.labels[2], [226, 115, zo + 3], 'r', 1, tone);
  }
}

function build(m: MotifInput) {
  const s = new Sketch();
  if (m.variant === 'na-miare') naMiare(m, s);
  else if (m.variant === 'przybory') przybory(m, s);
  else wzorce(m, s);
  return s.scene();
}

const PART: Record<string, string[]> = {
  wzorce: ['najgrubsza płytka wzorcowa', 'druga płytka', 'trzecia płytka', 'czwarta płytka'],
  'na-miare': ['kula', 'pierścień', 'graniastosłup trójkątny', 'kostka'],
  przybory: ['cyrkiel', 'ekierka', 'przymiar', 'grafion'],
};

function describe(d: DescInput): string {
  const what = motif.what[d.variant] ?? motif.what.wzorce;
  if (d.calm) return `Kaseta z gniazdami: ${what}.`;
  let s = `Kaseta z gniazdami w widoku rozstrzelonym: ${what}.`;
  const parts = PART[d.variant] ?? PART.wzorce;
  const named = d.labels.slice(0, 4).flatMap((l, i) => (l ? [`${parts[i]} — ${l}`] : []));
  if (named.length) s += ` Podpisane części: ${named.join('; ')}.`;
  if (d.fault) s += ` Bryła, która nie pasuje do żadnego gniazda, leży poza kasetą i obrysem ochrony: ${d.fault}.`;
  return s;
}

export const motif: MotifModule = {
  id: 'kaseta',
  name: 'Kaseta z gniazdami',
  variants: ['wzorce', 'na-miare', 'przybory'],
  what: {
    wzorce: 'komplet płytek wzorcowych stojących pionowo nad gniazdami wyciętymi na ich wymiar, wieko otwarte do tyłu',
    'na-miare': 'bryły o nietypowych kształtach — kula, pierścień, graniastosłup i kostka — nad gniazdami wyciętymi na miarę każdej z nich',
    przybory: 'przybory kreślarskie — cyrkiel, ekierka i przymiar — nad gniazdami w ich kształcie',
  },
  build,
  describe,
};
