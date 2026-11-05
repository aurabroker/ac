/**
 * „Stół”.
 *   zarzad — sala posiedzeń bez ścian: długi stół wzdłuż x (blat uniesiony nad dwoma cokołami), puste krzesła
 *            (po dwa wzdłuż stołu, wyższe u szczytu), na blacie tabliczka D&O i teczki. Krzesło z końca stołu
 *            odsunięto poza obrys ochrony (czerwień: działanie umyślne), na jego miejscu został przerywany ślad.
 *            Krzesła to osoby (bez twarzy), blat to spółka.
 *   pulpit — spokojna miniatura strony prawnej: pochyły pulpit do pisania z jednym formularzem i piórem (g0, bez ruchu).
 * Grupy (zarzad): g0 płyta + ślad miejsca, g1 krzesła, g2 cokoły, g3 blat z tabliczką i teczkami; out — odsunięte krzesło.
 * Sloty podpisów: [krzesła — „Ochrona osób”, blat — „Ochrona spółki”, teczka — „Rozszerzenie”].
 */
import { budget, Sketch, hi, plate, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule, Tone } from '../scene.ts';
import { boxes, guide, seats, segs, type Box } from './_g3.ts';

/** Wierzch płyty bazowej (plate h = 6). */
const T = 6;

function zarzad(m: MotifInput) {
  const s = new Sketch();
  const t = hi(m);
  const B = budget(m);
  const head = !m.thumb;
  plate(s, { x0: -42, y0: -38, w: 222, d: 128, protect: [-33, -29, 134, 81] });

  // stół: blat [0, 110] × [0, 44]; cokoły do zP, blat uniesiony o 8 (rozstrzelenie)
  const X1 = 104;
  const Y1 = 44;
  const zP = T + 26;
  const zT = zP + 8;
  const zB = zT + 6;

  // g0: przerywany ślad miejsca, z którego odsunięto krzesło
  const gone = { x: 123, y: 22 };
  s.poly(0, 'fine-d', [[gone.x - 10, gone.y - 10, T], [gone.x + 10, gone.y - 10, T], [gone.x + 10, gone.y + 10, T], [gone.x - 10, gone.y + 10, T]]);

  // g1: krzesła za stołem i u szczytu (wyższe oparcie)
  seats(s, 1, [[-21, Y1 / 2]], T, { back: '-x', S: 20, bh: 28, tone: t });
  const cBack = seats(s, 1, [[26, -18], [78, -18]], T, { back: '-y', S: 20, bh: 18, tone: t })[1];

  // g2: cokoły z płytką pod blatem
  boxes(s, 2, [22, 82].map((x): Box => [x - 7, 10, T, 14, Y1 - 20, zP - T - 3]));
  boxes(s, 2, [22, 82].map((x): Box => [x - 11, 6, zP - 3, 22, Y1 - 12, 3]));
  if (head) {
    guide(s, 2, 1, 93, 6, zP, zT);
    guide(s, 2, 1, 93, Y1 - 6, zP, zT);
    guide(s, 2, 1, 11, Y1 - 6, zP, zT);
  }

  // g3: blat (spółka), teczki, tabliczka
  s.box(3, 0, 0, zT, X1, Y1, 6, { top: t === 'hi' ? 'top-hi' : 'top' });
  if (head) {
    s.box(3, 10, 16, zB, 22, 16, 2.5);
    s.line(3, 'fine', [13, 24, zB + 2.5], [29, 24, zB + 2.5]);
  }
  const fT: Tone = B.slots[2] ? t : 'ink';
  s.box(3, 76, 12, zB, 22, 18, 2.5, fT);
  s.line(3, 'fine', [79, 21, zB + 2.5], [95, 21, zB + 2.5]);
  if (m.plate) {
    // tabliczka-namiot z grawerem na przedniej (pochyłej) ścianie
    const px0 = 34;
    const pl = 34;
    const py = 22;
    const ph = 12;
    s.prism(3, [[px0, py - 6, zB], [px0, py + 6, zB], [px0, py, zB + ph]], [pl, 0, 0]);
    const sl = Math.hypot(6, ph);
    s.mark(3, m.plate, [px0 + pl / 2, py + 3, zB + ph / 2], { u: [1, 0, 0], v: [0, 6 / sl, -ph / sl], size: 8, max: pl - 6 });
  }

  // g1: krzesła przed stołem
  seats(s, 1, [[26, 66], [78, 66]], T, { back: '+y', S: 20, bh: 18, tone: t });

  s.label(B.slots[0], cBack.top, 'r', 1, t);
  s.label(B.slots[1], [X1, Y1 * 0.7, zT + 3] as V3, 'r', 3, t);
  s.label(B.slots[2], [98, 21, zB + 1.2] as V3, 'r', 3, fT);

  // czerwień: krzesło odsunięte od stołu poza obrys ochrony
  if (B.fault)
    s.out(() => {
      const [c] = seats(s, 0, [[156, 26]], T, { back: '+x', S: 20, bh: 18, tone: 'sig' });
      s.label(B.fault, c.front, 'r', 0, 'sig');
    });
  return s.scene({ zoom: 1.15 });
}

/** Spokojny pulpit do pisania: nogi, półka, skrzynia z pochyłym wiekiem, arkusz formularza, pióro (wszystko g0). */
function pulpit() {
  const s = new Sketch();
  plate(s, { x0: -26, y0: -22, w: 128, d: 92, protect: null, ticks: 24 });
  const X1 = 76;
  const Y1 = 48;
  const zB = 52;
  const L = 4;
  const leg = (x: number, y: number) => s.box(0, x - L / 2, y - L / 2, T, L, L, zB - T);
  leg(3, 3);
  leg(X1 - 3, 3);
  leg(3, Y1 - 3);
  s.box(0, 3, 3, 18, X1 - 6, Y1 - 6, 3);
  leg(X1 - 3, Y1 - 3);
  // skrzynia z wiekiem pochylonym ku przodowi (+y): profil w płaszczyźnie yz wyciągnięty wzdłuż x
  const zFr = zB + 8;
  const zBk = zB + 24;
  s.prism(0, [[0, 0, zB], [0, Y1, zB], [0, Y1, zFr], [0, 0, zBk]], [X1, 0, 0]);
  const dl = Math.hypot(Y1, zBk - zFr);
  const n: V3 = [0, (zBk - zFr) / dl, Y1 / dl];
  const onLid = (x: number, f: number, h = 0): V3 => [x, Y1 - f * Y1 + n[1] * h, zFr + f * (zBk - zFr) + n[2] * h];
  // listwa na dolnej krawędzi wieka
  s.prism(0, [onLid(0, 0), onLid(0, 0.05), onLid(0, 0.05, 3), onLid(0, 0, 3)], [X1, 0, 0]);
  // arkusz formularza: kilka wierszy i pole podpisu
  const xa = 16;
  const xb = 56;
  s.poly(0, 'top', [onLid(xa, 0.16, 0.6), onLid(xb, 0.16, 0.6), onLid(xb, 0.92, 0.6), onLid(xa, 0.92, 0.6)]);
  segs(
    s,
    0,
    'fine',
    [0.8, 0.68, 0.56, 0.44, 0.3].map((f, i) => [onLid(xa + 5, f, 0.7), onLid(i === 4 ? xa + 18 : xb - 5, f, 0.7)] as [V3, V3]),
  );
  // pióro obok arkusza
  s.line(0, 'edge', onLid(64, 0.22, 1.4), onLid(69, 0.8, 1.4));
  return s.scene({ calm: true });
}

function build(m: MotifInput) {
  return m.variant === 'pulpit' ? pulpit() : zarzad(m);
}

export const motif: MotifModule = {
  id: 'stol',
  name: 'Stół',
  variants: ['zarzad', 'pulpit'],
  what: {
    zarzad:
      'długi stół zarządu z uniesionym blatem na dwóch cokołach, tabliczką D&O i teczkami; przy stole puste krzesła, wyższe u szczytu, a jedno krzesło odsunięto poza obrys, na jego miejscu został przerywany ślad',
    pulpit: 'pochyły pulpit do pisania z jednym arkuszem formularza i piórem',
  },
  describe: (d) => {
    if (d.calm || d.variant === 'pulpit') return 'Pulpit do pisania: pochyłe wieko z jednym arkuszem formularza i piórem.';
    const parts = ['krzesła', 'blat stołu', 'teczka na blacie'];
    let out = 'Stół zarządu w widoku rozstrzelonym: długi stół z uniesionym blatem na dwóch cokołach i tabliczką D&O, przy nim puste krzesła, wyższe u szczytu.';
    const named = d.labels.slice(0, 3).flatMap((l, i) => (l ? [`${parts[i]} — ${l}`] : []));
    if (named.length) out += ` Podpisane części: ${named.join(', ')}.`;
    if (d.fault) out += ` Jedno krzesło odsunięto od stołu poza obrys, na czerwono: ${d.fault} — tego polisa nie obejmuje.`;
    return out;
  },
  build,
};
