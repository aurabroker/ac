/**
 * Motyw „Mechanizm zamka” — jeden mechanizm zamykający w trzech skalach (pieniądze i nadużycia).
 *   wkladka  — /ubezpieczenia/ubezpieczenie-crime/: wkładka bębenkowa wzdłuż osi x; pakiety kołków wyjęte
 *              z gniazd nad wieżą korpusu, klucz wysunięty z kanału wzdłuż osi, na płycie dorobiona kopia klucza
 *              (inne nacięcia — zdarzenie objęte ochroną, tusz). Czerwień: pakiet kołków odłożony poza obrys
 *              (szkody pośrednie). Sloty: [pakiet 1, pakiet 3, pakiet 5, czoło bębenka].
 *   skarbiec — /ubezpieczenia/instytucje-finansowe-i-fintech/: okrągłe drzwi skarbca o osi x wysunięte z ościeżnicy
 *              (rozstrzelenie wzdłuż osi drzwi), rygle promieniowe (rygiel = polisa), koło z trzema szprychami.
 *              Czerwień: rygiel wyjęty z drzwi i odłożony poza obrys (straty z inwestycji).
 *              Sloty: rygle widoczne obok koła, od góry [OC zawodowe, Crime, D&O, Cyber] — odnośniki w prawo.
 *   kasetka  — /polityka-prywatnosci/ (spokojna): zamknięta kasetka na dokumenty z czołem wkładki, g0, bez ruchu.
 * Miniatura: bez sprężyn, bez gałek koła i tarczy szyfrowej; nagłówek: linie konstrukcyjne n·G0.
 */
import { G0, Sketch, deg, plate, spring, take, type V2, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Role } from '../scene.ts';
import { protectPoly, slotTone } from './_g2.ts';

/** Zarys klucza w płaszczyźnie (a — wzdłuż pióra, b — wysokość): czubek w a0, nacięcia o głębokościach cuts. */
function keyBlade(a0: number, len: number, b0: number, h: number, cuts: number[]): V2[] {
  const pts: V2[] = [[a0 + 4, b0], [a0, b0 + h * 0.45], [a0 + 7, b0 + h]];
  const st = (len - 16) / cuts.length;
  cuts.forEach((c, i) => {
    const x = a0 + 12 + st * (i + 0.5);
    pts.push([x - st * 0.42, b0 + h], [x - st * 0.12, b0 + h - c], [x + st * 0.12, b0 + h - c], [x + st * 0.42, b0 + h]);
  });
  pts.push([a0 + len, b0 + h], [a0 + len, b0]);
  return pts;
}

/* ---------------- wkładka ---------------- */

function wkladka(m: MotifInput, s: Sketch) {
  const L = take(m);
  const thumb = m.thumb;
  const W = 274;
  const D = 120;
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: null });
  protectPoly(s, [[10, 10], [W - 10, 10], [W - 10, 76], [212, 76], [212, D - 10], [10, D - 10]], zt);

  const yc = 48;
  const R = 20;
  const zc = zt + R + 1;
  const half = 12;
  const zTop = zc + 30;
  const xa = 20;
  const xb = 152;
  const pins = [38, 62, 86, 110, 134];
  const cuts = [6, 3, 8, 4, 7];
  const pr = thumb ? 5.2 : 4.8;

  // pakiet kołków odłożony poza obrys (czerwień): leży wzdłuż x w przednim prawym narożniku
  if (L.fault)
    s.out(() => {
      const r = thumb ? 6 : 5.2;
      const z = zt + r;
      s.cylX(0, [224, 96, z], 12, r, { tone: 'sig' });
      s.cylX(0, [239, 96, z], 10, r, { tone: 'sig' });
      if (!thumb) {
        const zz: V3[] = [];
        for (let i = 0; i <= 8; i++) zz.push([252 + i * 1.8, 96, z + (i % 2 ? 3.8 : -3.8)]);
        s.poly(0, 'edge-sig', zz, false);
      }
      s.label(L.fault, [thumb ? 249 : 266, 96 - r * 0.7, z + r * 0.7], 'r', 0, 'sig');
    });

  // dorobiona kopia klucza: leży płasko na płycie przed korpusem (inne nacięcia)
  const copy = keyBlade(36, 74, 0, 14, [3, 7, 2, 6, 4]).map(([a, b]): V3 => [a, 104 - b, zt + 2.5]);
  if (thumb) s.poly(0, 'top', copy);
  else s.prism(0, copy, [0, 0, -2.5], 'ink');
  s.ell(0, 'top', [123, 97, zt + 2.5], 'z', 13);
  s.ell(0, 'bore', [128, 97, zt + 2.5], 'z', 4);

  // korpus: walec + wieża, czoło (profil) na x = xb
  s.cylX(0, [xa, yc, zc], xb - xa, R, { noCap: true });
  const yj = Math.sqrt(R * R - half * half);
  s.box(0, xa, yc - half, zc + yj, xb - xa, 2 * half, zTop - zc - yj);
  const a1 = Math.atan2(yj, half);
  const prof: V3[] = [[xb, yc + half, zTop], [xb, yc - half, zTop], [xb, yc - half, zc + yj]];
  for (let k = 1; k < 12; k++) {
    const t = Math.PI - a1 + ((Math.PI + 2 * a1) * k) / 12;
    prof.push([xb, yc + R * Math.cos(t), zc + R * Math.sin(t)]);
  }
  prof.push([xb, yc + half, zc + yj]);
  s.poly(0, 'side-r', prof);
  // bębenek i kanał klucza
  s.ell(0, 'fine-ink', [xb, yc, zc], 'x', 14.5);
  const kw: V2[] = [[-1.6, 9], [1.6, 9], [1.6, 1], [3, -1.5], [1.4, -8], [-1.4, -8], [-1.4, -2], [-2.8, 0.5]];
  s.poly(0, 'bore', kw.map(([dy, dz]): V3 => [xb, yc + dy, zc + dz]));
  // gniazda kołków
  for (const x of pins) s.ell(0, 'bore', [x, yc, zTop], 'z', pr + 0.5);

  // pakiety kołków (g1) — nad gniazdami; sloty 0..2 → pakiety 1, 3, 5
  const lift = thumb ? 14 : G0;
  const zP = zTop + lift;
  const slotOf = [0, -1, 1, -1, 2];
  for (const i of [0, 4]) {
    const a: V3 = [pins[i] + pr + 0.5, yc, zTop];
    if (thumb) s.line(0, 'cl', a, [a[0], yc, zP]);
    else s.stretch(0, a, 1);
  }
  pins.forEach((x, i) => {
    const sl = slotOf[i];
    const tone = sl >= 0 ? slotTone(m, L.labels[sl]) : 'ink';
    const kp = 7 + cuts[i];
    // kołek dolny i górny; w miniaturze stykają się (bez denka dolnego — mniej ścieżek)
    s.cylZ(1, [x, yc, zP], kp, pr, { tone, noCap: thumb });
    const zd = zP + kp + (thumb ? 0 : 3);
    s.cylZ(1, [x, yc, zd], 10, pr, { tone });
    let top = zd + 10;
    if (!thumb) {
      spring(s, 1, 'z', [x, yc, top + 2], 12, pr * 0.8, 4, { tone });
      top += 14;
    }
    if (sl >= 0) s.label(L.labels[sl], [x + pr * 0.7, yc - pr * 0.7, top], 'r', 1, tone);
  });

  // klucz wysunięty z kanału wzdłuż osi (pióro pionowe w płaszczyźnie y = yc)
  const k0 = xb + 14;
  const kl = 72;
  const blade = keyBlade(k0, kl, zc - 7, 15, cuts).map(([a, b]): V3 => [a, yc + 1.5, b]);
  if (thumb) s.poly(0, 'side-l', blade);
  else s.prism(0, blade, [0, -3, 0], { top: 'top', x: 'side-r', y: 'side-l' });
  s.cylY(0, [k0 + kl + 13, yc - 1.5, zc], 3, 14, { cap: 'side-l', side: 'side-r', bore: 4.5 });
  if (!thumb) s.axisLine(0, [xb - 8, yc, zc], [k0 + 6, yc, zc]);
  // czoło bębenka — slot 3
  s.label(L.labels[3], [xb, yc - 10, zc + 10], 'r', 0, slotTone(m, L.labels[3]));
}

/* ---------------- skarbiec ---------------- */

/** Ściana w płaszczyźnie x = const z okrągłym otworem (evenodd). */
function ringFaceX(s: Sketch, g: number, role: Role, x: number, yc: number, zc: number, r0: number, r1: number) {
  s.ring(g, role, [x, yc, zc], 'x', r0, r1);
}

function skarbiec(m: MotifInput, s: Sketch) {
  const L = take(m);
  const thumb = m.thumb;
  const W = thumb ? 168 : 200;
  const D = thumb ? 142 : 178;
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: null });
  protectPoly(s, [[10, 10], [W - 10, 10], [W - 10, D - 56], [W - 58, D - 56], [W - 58, D - 10], [10, D - 10]], zt);

  const yc = thumb ? 70 : 88;
  const Rd = 48; // drzwi
  const Rb = 14; // wysunięcie rygla poza obrzeże
  const zc = zt + Rd + Rb + 5;
  const xs = 14; // ościeżnica: x od xs do xs + T
  const T = 10;
  const gap = thumb ? 30 : G0; // ościeżnica → drzwi (nagłówek: linia konstrukcyjna G0)
  const xd = xs + T + gap; // tył drzwi
  const th = 18;
  const xf = xd + th; // czoło drzwi
  const xw = xf + (thumb ? 24 : G0); // koło (piasta)

  // rygiel wyjęty (czerwień) — leży na płycie poza obrysem, przed drzwiami po prawej
  if (L.fault)
    s.out(() => {
      const r = thumb ? 7.5 : 6.5;
      s.cylY(0, [W - 30, D - 18, zt + r], -28, r, { tone: 'sig' });
      s.label(L.fault, [W - 30 + r * 0.7, D - 46, zt + r * 1.7], 'r', 0, 'sig');
    });

  // ościeżnica: pierścień na stopie (g0)
  s.box(0, xs - 4, yc - 36, zt, T + 8, 72, 8);
  s.cylX(0, [xs, yc, zc], T, Rd + Rb + 4, { noCap: true });
  s.ell(0, 'bore', [xs + T, yc, zc], 'x', Rd + 2);
  ringFaceX(s, 0, 'side-r', xs + T, yc, zc, Rd + 2, Rd + Rb + 4);
  if (!thumb) {
    s.stretch(0, [xs + T, yc + Rd - 12, zc], 1, 'cl', 'x');
    s.stretch(0, [xs + T, yc - Rd + 12, zc], 1, 'cl', 'x');
  }

  // drzwi z ryglami (g1). Kąt t w płaszczyźnie yz od +y ku +z; rygle t = 0, 45, … — po prawej rysunku 180…270.
  const dir = (t: number): V3 => [0, Math.cos(deg(t)), Math.sin(deg(t))];
  const red = 90; // gniazdo wyjętego rygla (u góry)
  const slotAt: Record<number, number> = { 135: 0, 180: 1, 270: 2, 225: 3 };
  const front = (t: number) => Math.cos(deg(t)) + Math.sin(deg(t)) > 0.01;
  const xbolt = xd + th / 2;
  const bolt = (t: number) => {
    const d = dir(t);
    const sl = slotAt[t];
    const tone = sl !== undefined ? slotTone(m, L.labels[sl]) : 'ink';
    s.cyl(1, d, [xbolt, yc + (Rd - 4) * d[1], zc + (Rd - 4) * d[2]], Rb + 4, 5.5, { tone });
  };
  const angs = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const t of angs) if (!front(t) && t !== red) bolt(t);
  s.cylX(1, [xd, yc, zc], th, Rd);
  s.ell(1, 'fine', [xf, yc, zc], 'x', Rd - 7);
  {
    const d = dir(red);
    s.ell(1, 'bore', [xbolt, yc + Rd * d[1], zc + Rd * d[2]], d, 5.5);
  }
  for (const t of angs) if (front(t) && t !== red) bolt(t);
  // tarcza z kreskami (tylko nagłówek) i piasta
  if (!thumb) {
    const dc: V3 = [xf, yc - 6, zc + 30];
    s.ell(1, 'top', dc, 'x', 8);
    for (let i = 0; i < 12; i++) {
      const a = deg(i * 30);
      const r0 = i % 3 ? 6 : 4.5;
      s.line(1, 'fine-ink', [xf, dc[1] + r0 * Math.cos(a), dc[2] + r0 * Math.sin(a)], [xf, dc[1] + 7.5 * Math.cos(a), dc[2] + 7.5 * Math.sin(a)]);
    }
    s.stretch(1, [xf, yc, zc], 1, 'cl', 'x');
  }

  // koło z trzema szprychami (g2)
  s.cylX(2, [xw, yc, zc], 8, 8);
  const spokes = [90, 210, 330];
  const Rw = 32;
  const spoke = (t: number) => {
    const d = dir(t);
    s.cyl(2, d, [xw + 4, yc + 7 * d[1], zc + 7 * d[2]], Rw - 10, 2.8, { noCap: true });
  };
  for (const t of spokes) if (!front(t)) spoke(t);
  s.tube(2, 'x', [xw + 2, yc, zc], 5, Rw - 5, Rw);
  for (const t of spokes) if (front(t)) spoke(t);
  if (!thumb)
    for (const t of spokes) {
      const d = dir(t);
      s.cylX(2, [xw + 7, yc + Rw * d[1] * 0.92, zc + Rw * d[2] * 0.92], 10, 3.4);
    }
  s.cylX(2, [xw + 8, yc, zc], 3, 4.5);

  // podpisy: czoła rygli po prawej stronie rysunku
  for (const [t, sl] of Object.entries(slotAt)) {
    const d = dir(+t);
    const r = Rd + Rb;
    s.label(L.labels[sl], [xbolt + 2, yc + r * d[1], zc + r * d[2]], 'r', 1, slotTone(m, L.labels[sl]));
  }
}

/* ---------------- kasetka (spokojna) ---------------- */

function kasetka(s: Sketch) {
  const { zt } = plate(s, { x0: 0, y0: 0, w: 196, d: 128, protect: null, ticks: false });
  const x0 = 40;
  const x1 = 158;
  const y0 = 28;
  const y1 = 98;
  const z1 = zt + 58;
  const zs = zt + 42;
  s.box(0, x0, y0, zt, x1 - x0, y1 - y0, z1 - zt);
  // szczelina wieka
  s.poly(0, 'edge', [[x0, y1, zs], [x1, y1, zs], [x1, y0, zs]], false);
  // uchwyt na wieku
  for (const x of [78, 120]) s.box(0, x - 3, 60, z1, 6, 8, 5);
  s.box(0, 75, 61.5, z1 + 5, 48, 5, 3);
  // czoło wkładki na froncie (y = y1)
  const lc: V3 = [99, y1, zt + 24];
  s.ell(0, 'top', lc, 'y', 8.5);
  s.ell(0, 'fine', lc, 'y', 6);
  const kw: V2[] = [[-1.2, 4.5], [1.2, 4.5], [1.2, -1], [2.4, -2.5], [0.8, -5.5], [-0.8, -5.5], [-1, -2]];
  s.poly(0, 'bore', kw.map(([dx, dz]): V3 => [lc[0] + dx, y1, lc[2] + dz]));
  // pusta ramka na opis (bez napisu)
  s.poly(0, 'fine', [[56, 40, z1], [74, 40, z1], [74, 50, z1], [56, 50, z1]]);
}

function build(m: MotifInput) {
  const s = new Sketch();
  if (m.variant === 'kasetka') {
    kasetka(s);
    return s.scene({ calm: true });
  }
  if (m.variant === 'skarbiec') {
    skarbiec(m, s);
    return s.scene({ axis: 'x' });
  }
  wkladka(m, s);
  return s.scene();
}

const PART: Record<string, string[]> = {
  wkladka: ['pierwszy pakiet kołków', 'trzeci pakiet kołków', 'piąty pakiet kołków', 'czoło bębenka'],
  skarbiec: ['rygiel u góry', 'rygiel z prawej', 'rygiel u dołu', 'rygiel za kołem'],
};

function describe(d: DescInput): string {
  const what = motif.what[d.variant] ?? '';
  if (d.calm || d.variant === 'kasetka') return `Mechanizm zamka: ${what}.`;
  let s = `Mechanizm zamka w widoku rozstrzelonym: ${what}.`;
  const parts = PART[d.variant] ?? PART.wkladka;
  const named = d.labels.slice(0, 4).flatMap((l, i) => (l ? [`${parts[i]} — ${l}`] : []));
  if (named.length) s += ` Podpisane części: ${named.join('; ')}.`;
  if (d.fault)
    s +=
      d.variant === 'skarbiec'
        ? ` Jeden rygiel wyjęto z drzwi i odłożono poza obrys ochrony: ${d.fault}.`
        : ` Jeden pakiet kołków leży poza obrysem ochrony: ${d.fault}.`;
  return s;
}

export const motif: MotifModule = {
  id: 'zamek',
  name: 'Mechanizm zamka',
  variants: ['wkladka', 'skarbiec', 'kasetka'],
  what: {
    wkladka: 'wkładka bębenkowa z pakietami kołków wyjętymi z gniazd, klucz wysunięty z kanału i dorobiona kopia klucza o innych nacięciach',
    skarbiec: 'okrągłe drzwi skarbca wysunięte z ościeżnicy, z ryglami promieniowymi i kołem o trzech szprychach',
    kasetka: 'zamknięta kasetka na dokumenty z wkładką zamka w przedniej ściance',
  },
  build,
  describe,
};
