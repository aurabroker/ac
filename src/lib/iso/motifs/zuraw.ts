/**
 * „Żuraw z przeciwwagą” (gwarancje ubezpieczeniowe): żuraw wieżowy na bloku fundamentowym. Maszt kratowy, wieniec,
 * długi wysięgnik kratowy (−x) z wózkiem, hakiem i ładunkiem kontraktu; krótki przeciwwysięgnik (+x) ze stosem płyt
 * przeciwwagi — każda płyta to jedna gwarancja (błękit). Kontrakt się nie przewróci, bo przeciwwaga go równoważy.
 * Drugi ładunek stoi na ziemi poza zasięgiem haka i poza obrysem ochrony (czerwień: strata wykonawcy — gwarancja
 * chroni zamawiającego, nie wykonawcę przed jego własną stratą).
 * Grupy: g0 płyta + fundament (+ ładunek na ziemi: out), g1 maszt, g2 wieniec + wysięgniki + wózek + hak + ładunek,
 * g3 dolna płyta przeciwwagi, g4 środkowa, g5 górna.
 * Sloty podpisów (kolejność tabeli zakresu): [płyta górna — wadialna, środkowa — kontraktowa, dolna — płatności].
 */
import { budget, Sketch, hi, plate, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule } from '../scene.ts';
import { guide, segs } from './_g3.ts';

const T = 6;
const zF = T + 8; // wierzch fundamentu
const zM = 92; // wierzch masztu
const zR = zM + 9; // spód wysięgników (nad wieńcem)
const JH = 11; // wysokość wysięgnika
const CJ = 7; // wysokość przeciwwysięgnika

/** Kratownica na ścianie masztu x = 8 albo y = 8: poziome pasy i przekątne naprzemiennie. */
function lattice(s: Sketch, face: 'x' | 'y', n: number) {
  const at = (t: number, z: number): V3 => (face === 'x' ? [8, t, z] : [t, 8, z]);
  const [a0, a1] = face === 'x' ? [-8, 8] : [8, -8];
  const h = (zM - zF) / n;
  const list: [V3, V3][] = [];
  for (let i = 1; i < n; i++) list.push([at(a0, zF + i * h), at(a1, zF + i * h)]);
  for (let i = 0; i < n; i++) {
    const [p, q] = i % 2 ? [a0, a1] : [a1, a0];
    list.push([at(p, zF + i * h), at(q, zF + (i + 1) * h)]);
  }
  segs(s, 1, 'fine-ink', list);
}

/** Pas kratowy (zygzak) wzdłuż x na ścianie y = const. */
function truss(s: Sketch, g: number, y: number, x0: number, x1: number, z0: number, z1: number, step: number) {
  const pts: V3[] = [];
  let up = false;
  for (let x = x0; x <= x1 + 0.1; x += step) {
    pts.push([x, y, up ? z1 : z0]);
    up = !up;
  }
  s.poly(g, 'fine-ink', pts, false);
}

function build(m: MotifInput) {
  const s = new Sketch();
  const t = hi(m);
  const B = budget(m);
  const head = !m.thumb;

  /* g0: płyta, obrys placu budowy, fundament */
  plate(s, { x0: -154, y0: -30, w: 274, d: 62, protect: [-146, -22, 76, 24], ticks: 30 });
  s.box(0, -16, -16, T, 32, 32, zF - T);

  /* g1: maszt kratowy */
  s.box(1, -8, -8, zF, 16, 16, zM - zF);
  lattice(s, 'x', head ? 6 : 4);
  lattice(s, 'y', head ? 6 : 4);

  /* g2: wieniec, wysięgnik z wózkiem i hakiem, iglica, przeciwwysięgnik */
  s.cylZ(2, [0, 0, zM + 3], 6, 11);
  const xJ = -140;
  s.box(2, xJ, -5, zR, -8 - xJ, 10, JH);
  truss(s, 2, 5, xJ, -8, zR, zR + JH, head ? 11 : 16.5);
  // wózek, liny, zblocze, hak
  const xh = -98;
  s.box(2, xh - 7, -7, zR - 5, 14, 14, 5);
  segs(s, 2, 'edge', [
    [[xh - 2.5, 0, zR - 5], [xh - 2.5, 0, 72]],
    [[xh + 2.5, 0, zR - 5], [xh + 2.5, 0, 72]],
  ]);
  s.box(2, xh - 5, -5, 64, 10, 10, 8);
  s.line(2, 'edge', [xh, 0, 64], [xh, 0, 60]);
  s.arc(2, 'edge', [xh, 0, 56.5], 'y', 3.5, Math.PI / 2, 2.3 * Math.PI);
  // ładunek kontraktu na zawiesiach (tusz)
  const L = { x0: xh - 16, x1: xh + 16, y0: -13, y1: 13, z0: 26, z1: 42 };
  const hook: V3 = [xh, 0, 53];
  segs(s, 2, 'fine-ink', [
    [hook, [L.x0, L.y0, L.z1]],
    [hook, [L.x1, L.y0, L.z1]],
  ]);
  s.box(2, L.x0, L.y0, L.z0, L.x1 - L.x0, L.y1 - L.y0, L.z1 - L.z0);
  segs(s, 2, 'fine-ink', [
    [hook, [L.x0, L.y1, L.z1]],
    [hook, [L.x1, L.y1, L.z1]],
  ]);
  if (head) segs(s, 2, 'fine', [[[L.x0, L.y1, L.z0 + 8], [L.x1, L.y1, L.z0 + 8]], [[L.x1, L.y0, L.z0 + 8], [L.x1, L.y1, L.z0 + 8]]]);
  // kabina przy wieńcu
  if (head) s.box(2, -20, 6, zM - 6, 12, 11, 13);
  // iglica i odciągi
  const zA = zR + JH + 26;
  s.box(2, -4, -4, zR + JH, 8, 8, zA - zR - JH);
  segs(s, 2, 'edge', [
    [[0, 0, zA], [-104, 0, zR + JH]],
    [[0, 0, zA], [60, 0, zR + CJ]],
  ]);
  // przeciwwysięgnik z pomostem
  s.box(2, -8, -9, zR, 70, 18, CJ);
  if (head) truss(s, 2, 9, -4, 58, zR, zR + CJ, 10.5);

  /* g3–g5: płyty przeciwwagi (rozsunięte w górę) — od dołu: płatności, kontraktowa, wadialna */
  const X0 = 34;
  const X1 = 60;
  const Y0 = -12;
  const Y1 = 12;
  const H = 10;
  const GAP = 6;
  const slot = [2, 1, 0];
  let z = zR + CJ;
  for (let i = 0; i < 3; i++) {
    const g = 3 + i;
    const zb = z + (i ? GAP : 3);
    if (head) for (const [x, y] of [[X0, Y1], [X1, Y1], [X1, Y0]]) guide(s, g - 1, 1, x, y, z, zb);
    s.box(g, X0, Y0, zb, X1 - X0, Y1 - Y0, H, t);
    s.label(B.slots[slot[i]], [X1, 2, zb + H / 2] as V3, 'r', g, t);
    z = zb + H;
  }

  /* czerwień: ładunek na ziemi poza obrysem i poza zasięgiem haka */
  if (B.fault)
    s.out(() => {
      const R = { x0: 86, x1: 108, y0: -9, y1: 13, h: 16 };
      s.box(0, R.x0, R.y0, T, R.x1 - R.x0, R.y1 - R.y0, R.h, 'sig');
      segs(s, 0, 'edge-sig', [
        [[R.x0, R.y1, T + 8], [R.x1, R.y1, T + 8]],
        [[R.x1, R.y0, T + 8], [R.x1, R.y1, T + 8]],
      ]);
      s.label(B.fault, [R.x1, 2, T + R.h * 0.55], 'r', 0, 'sig');
    });
  return s.scene({ zoom: 1.1 });
}

export const motif: MotifModule = {
  id: 'zuraw',
  name: 'Żuraw z przeciwwagą',
  variants: ['wiezowy'],
  what: {
    wiezowy:
      'żuraw wieżowy na fundamencie: maszt kratowy, długi wysięgnik z wózkiem i hakiem, na którym wisi ładunek kontraktu, a na krótkim przeciwwysięgniku stos rozsuniętych płyt przeciwwagi; drugi ładunek stoi na ziemi poza zasięgiem haka',
  },
  describe: (d) => {
    let out =
      'Żuraw wieżowy w widoku rozstrzelonym: na haku wisi ładunek kontraktu, a równoważy go stos płyt przeciwwagi na krótkim przeciwwysięgniku.';
    if (d.labels.slice(0, 3).some(Boolean)) out += ` Płyty przeciwwagi, od góry: ${d.labels.slice(0, 3).filter(Boolean).join(', ')}.`;
    if (d.fault) out += ` Poza zasięgiem haka i poza obrysem stoi na ziemi czerwony ładunek: ${d.fault} — tego gwarancja nie obejmuje.`;
    return out;
  },
  build,
};
