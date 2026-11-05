/**
 * Motyw „Pompa strzykawkowa” (OC w ochronie zdrowia i e-zdrowiu): urządzenie medyczne sterowane programem —
 * styk OC placówki, OC technologii i cyber. Dwa pasy wypełnienia strzykawki: OC nadwyżkowe leży na obowiązkowym.
 * Grupy: g0 płyta, obudowa (puste okienko wyświetlacza, przyciski, gniazdo danych), odłączona wtyczka (czerwień,
 *        poza obrysem, przerywana linia do gniazda); g1 napęd: silnik, śruba pociągowa, wózek popychacza;
 *        g2 strzykawka wzdłuż x: końcówka, cylinder z dwoma pasami (dolny / górny nad błękitną kreską), podziałka
 *        (same kreski), tłok, kołnierz, tłoczysko, przycisk.
 * Sloty: [dolny pas, górny pas, napęd, gniazdo danych]. Odnośniki pasów wychodzą z prawego końca wypełnienia
 * ponad kołnierzem — wszystkie w prawą kolumnę. Miniatura: bez gwintu, rowka, przewodu i linii konstrukcyjnych.
 */
import { G0, Sketch, arcSegs, circ, plate, take, type V2, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Role } from '../scene.ts';
import { slotTone } from './_g2.ts';

const D2R = Math.PI / 180;

function build(m: MotifInput) {
  const s = new Sketch();
  const L = take(m);
  const thumb = m.thumb;
  const W = thumb ? 296 : 292;
  const D = 122;
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: [10, 10, 246, D - 10] });

  // obudowa (g0)
  const hx0 = 18;
  const hx1 = 236;
  const hy0 = 22;
  const hy1 = 100;
  const ZH = zt + 42;
  const tSock = slotTone(m, L.labels[3]);
  // odłączona wtyczka kabla danych (czerwień) — poza obrysem, przerywana linia do gniazda
  if (L.fault)
    s.out(() => {
      const b = thumb ? 22 : 18;
      s.line(0, 'fault', [hx1 + 2, 60, zt + 18], [256, 60, zt + 9]);
      s.box(0, 256, 60 - b / 2, zt, b, b, b * 0.6, 'sig');
      s.box(0, 251, 55, zt + 2.5, 5, 10, 5, 'sig');
      s.poly(0, 'edge-sig', [[256 + b, 60, zt + 4], [262 + b, 61, zt + 3], [266 + b, 70, zt + 2], [266 + b, 88, zt + 1]], false);
      s.label(L.fault, [256 + b, 60 - b / 2 + 2, zt + b * 0.45], 'r', 0, 'sig');
    });
  s.box(0, hx0, hy0, zt, hx1 - hx0, hy1 - hy0, ZH - zt);
  s.line(0, 'fine', [hx0, hy1 - 8, ZH], [hx1, hy1 - 8, ZH]);
  // puste okienko wyświetlacza na froncie (y = hy1): ramka + szyba, bez cyfr
  const win = (x0: number, x1: number, z0: number, z1: number): V3[] => [[x0, hy1, z0], [x1, hy1, z0], [x1, hy1, z1], [x0, hy1, z1]];
  s.poly(0, 'top', win(36, 112, zt + 12, zt + 34));
  s.poly(0, 'bore', win(41, 107, zt + 16, zt + 30));
  for (const x of thumb ? [130, 146] : [128, 142, 156]) s.ell(0, 'edge', [x, hy1, zt + 23], 'y', 3.6);
  if (!thumb) s.pocket(0, null, [[52, 34, ZH], [206, 34, ZH], [206, 52, ZH], [52, 52, ZH]], 4);
  // gniazdo danych na boku (x = hx1) — slot 3
  s.poly(0, 'bore', [[hx1, 50, zt + 12], [hx1, 70, zt + 12], [hx1, 70, zt + 24], [hx1, 50, zt + 24]]);
  if (!thumb) s.poly(0, 'fine', [[hx1, 54, zt + 15], [hx1, 66, zt + 15], [hx1, 66, zt + 21], [hx1, 54, zt + 21]]);
  if (tSock === 'hi') s.poly(0, 'trace-hi', [[hx1, 50, zt + 12], [hx1, 70, zt + 12], [hx1, 70, zt + 24], [hx1, 50, zt + 24]]);
  s.label(L.labels[3], [hx1, 51, zt + 22], 'r', 0, tSock);

  // napęd (g1): silnik z lewej, śruba pociągowa, wózek popychacza po prawej (przy tłoczysku)
  const z1 = ZH + (thumb ? 12 : G0);
  const yS = 42;
  if (!thumb) for (const x of [40, 214]) s.stretch(0, [x, hy0 + 12, ZH], 1);
  const tDrive = slotTone(m, L.labels[2]);
  s.box(1, 22, 30, z1, 22, 24, 22, tDrive);
  const zs = z1 + 10;
  s.cylX(1, [44, yS, zs], 152, 4.2, { noCap: true });
  if (!thumb)
    for (let x = 52; x < 190; x += 7)
      s.line(1, 'fine', [x, yS + 4.2 * Math.cos(-40 * D2R), zs + 4.2 * Math.sin(-40 * D2R)], [x + 3.5, yS + 4.2 * Math.cos(130 * D2R), zs + 4.2 * Math.sin(130 * D2R)]);
  s.box(1, 196, 28, z1, 22, 30, 26, tDrive);
  s.label(L.labels[2], [218, 30, z1 + 20], 'r', 1, tDrive);

  // strzykawka (g2) wzdłuż x; oś na wysokości z2, promień r
  const r = 19;
  const z2 = zs + 4.2 + G0 + (thumb ? -26 : 0) + r;
  if (!thumb) s.stretch(1, [120, yS, zs + 4.2], 1);
  const xb0 = 62;
  const xb1 = 186;
  const xl0 = 66;
  const xl1 = 150;
  const t0 = slotTone(m, L.labels[0]);
  const t1 = slotTone(m, L.labels[1]);
  // końcówka
  s.cylX(2, [46, yS, z2], 9, 3);
  s.cylX(2, [54, yS, z2], xb0 - 54, 6.5);
  // cylinder (szkło: białe)
  s.cylX(2, [xb0, yS, z2], xb1 - xb0, r, { side: 'top', noCap: true });
  const E = (x: number) => circ([x, yS, z2], [0, 1, 0], [0, 0, 1], r);
  const Pt = (x: number, phi: number): V2 => E(x).at(phi * D2R);
  const region = (role: Role, x0: number, x1: number, p0: number, p1: number) => {
    const a = arcSegs(E(x0), p0 * D2R, p1 * D2R);
    const b = arcSegs(E(x1), p1 * D2R, p0 * D2R);
    const A = Pt(x0, p0);
    const B = Pt(x1, p1);
    s.add(2, role, [['M', A[0], A[1]], ...a.d, ['L', B[0], B[1]], ...b.d, ['Z']], [...a.bb, ...b.bb]);
  };
  const SPLIT = 45;
  region(t0 === 'hi' ? 'side-hi' : 'side-r', xl0, xl1, -45, SPLIT);
  region(t1 === 'hi' ? 'top-hi' : 'top', xl0, xl1, SPLIT, 135);
  // kreska między pasami
  {
    const a = Pt(xl0, SPLIT);
    const b = Pt(xl1, SPLIT);
    s.poly2(2, t1 === 'hi' || t0 === 'hi' ? 'trace-hi' : 'edge', [a, b], false);
  }
  // podziałka: same kreski (na górnym pasie, wzdłuż tworzącej φ = 100°)
  {
    const n = thumb ? 7 : 13;
    for (let i = 0; i < n; i++) {
      const x = 72 + ((146 - 72) * i) / (n - 1);
      const long = i % (thumb ? 3 : 4) === 0;
      s.poly2(2, 'fine-ink', [Pt(x, 104), Pt(x, long ? 126 : 116)], false);
    }
  }
  // tłok gumowy
  region('bore', xl1, xl1 + 9, -45, 135);
  // kontur cylindra na wierzch
  s.poly2(2, 'edge', [Pt(xb0, -45), Pt(xb1, -45)], false);
  s.poly2(2, 'edge', [Pt(xb0, 135), Pt(xb1, 135)], false);
  // kołnierz (mały — odnośniki pasów przechodzą nad nim), tłoczysko, przycisk
  s.cylX(2, [xb1, yS, z2], 3, r + 3, { cap: 'side-r' });
  s.cylX(2, [xb1 + 3, yS, z2], 30, 4.5);
  s.cylX(2, [xb1 + 33, yS, z2], 3.5, 13, { cap: 'side-r' });

  // podpisy pasów: prawy koniec wypełnienia
  const pa = Pt(xl1 - 4, 38);
  const pb = Pt(xl1 - 4, 112);
  s.label(L.labels[1], pb, 'r', 2, t1);
  s.label(L.labels[0], pa, 'r', 2, t0);
  return s.scene();
}

const PART = ['dolny pas wypełnienia strzykawki', 'górny pas wypełnienia', 'napęd śrubowy z wózkiem', 'gniazdo danych'];

function describe(d: DescInput): string {
  const what = motif.what.strzykawkowa;
  if (d.calm) return `Pompa strzykawkowa: ${what}.`;
  let s = `Pompa strzykawkowa w widoku rozstrzelonym: ${what}.`;
  const named = d.labels.slice(0, 4).flatMap((l, i) => (l ? [`${PART[i]} — ${l}`] : []));
  if (named.length) s += ` Podpisane części: ${named.join('; ')}.`;
  if (d.fault) s += ` Poza obrysem ochrony leży odłączona wtyczka kabla danych: ${d.fault}.`;
  return s;
}

export const motif: MotifModule = {
  id: 'pompa',
  name: 'Pompa strzykawkowa',
  variants: ['strzykawkowa'],
  what: {
    strzykawkowa:
      'obudowa z pustym okienkiem wyświetlacza, napęd śrubowy z wózkiem popychacza i strzykawka z podziałką, której wypełnienie tworzy dwa pasy, jeden nad drugim',
  },
  build,
  describe,
};
