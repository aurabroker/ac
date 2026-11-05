/**
 * Motyw „Szafa serwerowa” (plan grafik: final.json → motifs[szafa-serwerowa]; szkic sketch-src/szafa-serwerowa.js).
 * Cyber chroni własne systemy i dane — szafa rack to dosłownie przedmiot ataku, a jej części to moduły polisy.
 *   firma   (/ubezpieczenie-cyber/): otwarta szafa — biblioteka kopii, serwer danych, wysunięta konsola z klawiaturą;
 *   blokada (/wiedza/ransomware-2-0/): drzwi z szybą zamknięte na skobel z dużą kłódką (cudza blokada), jedna kaseta
 *           kopii wyjęta i uniesiona obok szafy; tabliczka na pokrywie.
 * Czoło szafy = ściana +x (prawa-przednia), panel boczny = ściana +y. Płyta bez siatki podłogi (uwaga z arkusza).
 * Grupy: g0 płyta + kabel, g1 cokół, g2 korpus z jednostkami (konsola, drzwi, kłódka, kaseta), g3 pokrywa z wentylatorami.
 * Czerwień (out, odsuwa się wzdłuż kabla): odcięty odcinek kabla zasilania z punktem przerwania i wtyczką.
 * Sloty podpisów — firma: 0 konsola, 1 kopie zapasowe, 2 serwer; blokada: 0 kłódka, 1 wyjęta kaseta, 2 konsola, 3 serwer.
 */
import { Sketch, plate, take, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Tone } from '../scene.ts';
import { SIDE_L, SIDE_R, TOP, describeParts, link, padlockU, rectX, rectY, rectZ, slotTone } from './_g4.ts';

const T = 6;
/** Czoło szafy (x), szerokość korpusu (y 0…WY, panel boczny do WY + 2). */
const XF = 52;
const WY = 54;
const Z1 = T + 8;
const H = 100;
const ZT = Z1 + H;
const GAP = 16;
const ZC = ZT + GAP;
/** Kabel zasilania (y, oś z), punkt przerwania (x), wtyczka (x). */
const CY = 14;
const XB = 108;
const XE = 128;

/** Pionowe szczeliny na czole (x = XF): od y0 w stronę +y, n sztuk. */
function slots(s: Sketch, g: number, y0: number, y1: number, z0: number, z1: number, n: number, empty = -1, et: Tone = 'hi') {
  const w = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    if (i === empty) continue;
    s.poly(g, 'bore', rectX(XF, y0 + i * w + 0.8, y0 + (i + 1) * w - 0.8, z0, z1));
  }
  if (empty >= 0) s.dashed(() => s.poly(g, et === 'hi' ? 'trace-hi' : 'edge', rectX(XF, y0 + empty * w + 0.8, y0 + (empty + 1) * w - 0.8, z0, z1)));
  return y0 + (empty + 0.5) * w;
}

function build(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const lock = m.variant === 'blokada';
  const L = take(m);
  // sloty → ton (błękit tylko, gdy część niesie podpis w tym kadrze)
  const lab = (i: number) => L.labels[i];
  const tCon = slotTone(m, lab(lock ? 2 : 0));
  const tBak = slotTone(m, lab(1));
  const tSrv = slotTone(m, lab(lock ? 3 : 2));
  const tLock = slotTone(m, lock ? lab(0) : undefined);

  const y0 = lock ? -38 : -24;
  plate(s, { x0: -22, y0, w: 172, d: 72 - y0, protect: [-14, y0 + 8, 100, 64] });

  /* g0: kabel zasilania od cokołu do punktu przerwania (tusz) */
  s.cylX(0, [XF - 6, CY, T + 2.4], XB - 2 - (XF - 6), 2.2);

  /* g1: cokół (wcięty) */
  s.box(1, 3, 3, T, XF - 6, WY - 4, Z1 - T);

  /* g2: korpus — otwarta góra (wnętrze), czoło jednostek, rama czoła, panel boczny */
  s.pocket(2, rectZ(0, 0, XF, WY + 2, ZT), rectZ(3, 3, XF - 3, WY - 1, ZT), 4);
  // czoło jednostek (jedna płaszczyzna x = XF, szwy między jednostkami)
  s.poly(2, SIDE_R.ink, rectX(XF, 3, WY - 1, Z1 + 3, ZT - 3));
  const zBak = [Z1 + 4, Z1 + 30] as const; // biblioteka kopii
  const zSrv = [Z1 + 31, Z1 + 53] as const; // serwer danych
  const zSv2 = [Z1 + 54, Z1 + 66] as const; // drugi serwer
  const zCon = [Z1 + 67, Z1 + 74] as const; // konsola (szuflada)
  const zTop = [Z1 + 75, ZT - 4] as const; // panel krosowy + zaślepki
  for (const z of [zBak[1] + 0.5, zSrv[1] + 0.5, zSv2[1] + 0.5, zCon[1] + 0.5]) s.line(2, 'fine-ink', [XF, 3, z], [XF, WY - 1, z]);
  // biblioteka kopii: dwa rzędy pionowych szczelin kaset (w „blokadzie” jedna pusta — kaseta wyjęta)
  const nB = t ? 6 : 8;
  const hb = (zBak[1] - zBak[0] - 5) / 2;
  let yEmpty = 0;
  for (let r = 0; r < 2; r++) {
    const za = zBak[0] + 2 + r * (hb + 1);
    const yE = slots(s, 2, 6, 42, za, za + hb, nB, lock && r === 0 ? 2 : -1, tBak);
    if (lock && r === 0) yEmpty = yE;
  }
  s.poly(2, 'bore', rectX(XF, 44, WY - 4, zBak[1] - 9, zBak[1] - 4));
  // serwer danych: kieszenie dysków (poziome, 3 kolumny)
  const bays = (z0: number, z1: number, rows: number) => {
    const cols = 3;
    const w = (WY - 10) / cols;
    const h = (z1 - z0 - 2) / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) s.poly(2, 'bore', rectX(XF, 5 + c * w + 0.8, 5 + (c + 1) * w - 0.8, z0 + 1 + r * h + 0.8, z0 + 1 + (r + 1) * h - 0.8));
  };
  if (tSrv === 'hi') s.poly(2, SIDE_R.hi, rectX(XF, 3, WY - 1, zSrv[0], zSrv[1]));
  bays(zSrv[0], zSrv[1], t ? 2 : 3);
  bays(zSv2[0], zSv2[1], 1);
  // konsola zamknięta (blokada) — czoło z uchwytem; panel krosowy i zaślepki
  if (lock) {
    if (tCon === 'hi') s.poly(2, SIDE_R.hi, rectX(XF, 3, WY - 1, zCon[0], zCon[1]));
    s.line(2, 'edge', [XF, WY / 2 - 7, zCon[0] + 3], [XF, WY / 2 + 7, zCon[0] + 3]);
  } else s.poly(2, 'bore', rectX(XF, 6, WY - 4, zCon[0] + 1, zCon[1] - 1));
  if (!t) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const y = 7 + ((WY - 14) * (i + 0.5)) / n;
      s.poly(2, 'solid', rectX(XF, y - 0.8, y + 0.8, zTop[0] + 2, zTop[0] + 4));
    }
  }
  for (const z of [zTop[0] + 9, zTop[0] + 15]) s.line(2, 'fine-ink', [XF, 8, z], [XF, WY - 6, z]);
  // rama czoła (z otworem) i panel boczny ze szczelinami wentylacji
  s.loops(2, SIDE_R.ink, [rectX(XF, 0, WY + 2, Z1, ZT), rectX(XF, 3, WY - 1, Z1 + 3, ZT - 3)]);
  s.poly(2, SIDE_L.ink, rectY(WY + 2, 0, XF, Z1, ZT));
  {
    const n = t ? 5 : 8;
    for (const zc of [Z1 + 14, ZT - 16])
      for (let i = 0; i < n; i++) {
        const x = 10 + ((XF - 20) * (i + 0.5)) / n;
        s.line(2, t ? 'fine-ink' : 'edge', [x, WY + 2, zc - 6], [x, WY + 2, zc + 6]);
      }
  }

  // kotwice
  let aCon: V3 = [XF, 8, (zCon[0] + zCon[1]) / 2];
  const aBak: V3 = [XF, 6, (zBak[0] + zBak[1]) / 2 + 2];
  const aSrv: V3 = [XF, 5, (zSrv[0] + zSrv[1]) / 2];
  let aLock: V3 | undefined;
  let aCas: V3 | undefined;

  if (!lock) {
    // konsola wysunięta (szuflada z klawiaturą)
    const P = 30;
    const za = zCon[0] + 1;
    s.box(2, XF, 7, za, P, WY - 14, 4, tCon);
    const zk = za + 4;
    const kx0 = XF + 5;
    const kx1 = XF + P - 4;
    s.poly(2, 'bore', rectZ(kx0, 10, kx1, WY - 10, zk));
    const rows = t ? 2 : 4;
    const cols = t ? 4 : 9;
    for (let r = 1; r < rows; r++) s.line(2, 'fine', [kx0 + ((kx1 - kx0) * r) / rows, 10, zk], [kx0 + ((kx1 - kx0) * r) / rows, WY - 10, zk]);
    for (let c = 1; c < cols; c++) s.line(2, 'fine', [kx0, 10 + ((WY - 20) * c) / cols, zk], [kx1, 10 + ((WY - 20) * c) / cols, zk]);
    s.line(2, 'edge', [XF + P, WY / 2 - 6, za + 2], [XF + P, WY / 2 + 6, za + 2]);
    aCon = [XF + P, 9, za + 2];
  } else {
    // drzwi z szybą (rama, odblaski), skobel i kłódka (wymuszenie — objęte ochroną, więc nie czerwień)
    const XD = XF + 2;
    s.poly(2, TOP.ink, rectZ(XF, 0, XD, WY + 2, ZT));
    s.poly(2, SIDE_L.ink, rectY(WY + 2, XF, XD, Z1, ZT));
    s.loops(2, SIDE_R.ink, [rectX(XD, 0, WY + 2, Z1, ZT), rectX(XD, 5, WY - 3, Z1 + 5, ZT - 5)]);
    s.line(2, 'fine', [XD, WY * 0.62, Z1 + H * 0.7], [XD, WY * 0.4, Z1 + H * 0.86]);
    if (!t) s.line(2, 'fine', [XD, WY * 0.5, Z1 + H * 0.68], [XD, WY * 0.32, Z1 + H * 0.82]);
    const zh = Z1 + H * 0.5;
    s.box(2, XD, 0.5, zh - 4, 1.5, 6, 9);
    s.arc(2, 'edge', [XD + 1.5, 3.5, zh + 5], 'x', 2.6, 0, Math.PI);
    aLock = padlockU(s, 2, [XD + 1.5, -9, zh - 26], { w: 24, h: 18, d: 8, leg: 6, tone: tLock });
    // kaseta kopii wyjęta i uniesiona obok szafy; linia rzutu do pustej szczeliny
    const cx = XF + 22;
    const cy = -36;
    const cz = Z1 + 3;
    s.line(2, 'proj', [XF, yEmpty, zBak[0] + 2 + hb * 0.6], [cx + 4, cy + 5, cz + 6]);
    s.box(2, cx, cy, cz, 24, 5, 15, tBak);
    s.poly(2, tBak === 'hi' ? 'trace-hi' : 'fine-ink', rectY(cy + 5, cx + 4, cx + 20, cz + 9, cz + 12));
    aCas = [cx + 24, cy + 5, cz + 6];
    aCon = [XD, 8, (zCon[0] + zCon[1]) / 2];
  }

  // linie konstrukcyjne korpus → pokrywa (g2 → g3, nadmiar chowa się pod krawędzią pokrywy)
  for (const [x, y] of [[XF, 0], [XF, WY + 2], [0, WY + 2]] as const) link(s, 2, 3, [x, y, ZT], GAP);

  /* g3: pokrywa z wentylatorami (i tabliczką) */
  s.box(3, 0, 0, ZC, XF, WY + 2, 6);
  const zc = ZC + 6;
  const fy = m.plate ? 19 : 27;
  for (const xc of [14, 38]) {
    s.ell(3, 'bore', [xc, fy, zc], 'z', 9);
    s.ell(3, 'top', [xc, fy, zc], 'z', 3);
  }
  if (!t)
    for (const xc of [14, 38])
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + 0.5;
        s.line(3, 'fine-ink', [xc + 3 * Math.cos(a), fy + 3 * Math.sin(a), zc], [xc + 8.5 * Math.cos(a + 0.6), fy + 8.5 * Math.sin(a + 0.6), zc]);
      }
  if (m.plate) {
    s.poly(3, 'fine-ink', rectZ(5, 37, 47, 47, zc));
    s.mark(3, m.plate, [26, 42, zc], { size: 5.6, max: 38 });
  }

  /* czerwień: odcięty odcinek kabla — punkt przerwania, linia przerywana, wtyczka */
  if (L.fault)
    s.out(() => {
      s.ell(0, 'solid-sig', [XB, CY, T], 'z', 2.4);
      s.line(0, 'edge-sig', [XB - 3.5, CY - 3.5, T], [XB + 3.5, CY + 3.5, T]);
      s.line(0, 'fault', [XB + 4, CY, T + 2.4], [XE, CY, T + 2.4]);
      s.box(0, XE, CY - 5, T, 11, 10, 7, 'sig');
      for (const dy of [-2.5, 2.5]) s.line(0, 'edge-sig', [XE + 11, CY + dy, T + 3.5], [XE + 15, CY + dy, T + 3.5]);
      s.label(L.fault, [XE + 11, CY - 3, T + 5], 'r', 0, 'sig');
    });

  if (lock) {
    s.label(lab(0), aLock!, 'r', 2, tLock);
    s.label(lab(1), aCas!, 'r', 2, tBak);
    s.label(lab(2), aCon, 'r', 2, tCon);
    s.label(lab(3), aSrv, 'r', 2, tSrv);
  } else {
    s.label(lab(0), aCon, 'r', 2, tCon);
    s.label(lab(1), aBak, 'r', 2, tBak);
    s.label(lab(2), aSrv, 'r', 2, tSrv);
  }
  return s.scene();
}

const PARTS: Record<string, readonly string[]> = {
  firma: ['wysunięta konsola z klawiaturą', 'biblioteka kopii zapasowych', 'serwer danych'],
  blokada: ['kłódka na skoblu drzwi', 'kaseta kopii wyjęta obok szafy', 'konsola za szybą', 'serwer danych'],
};

function describe(d: DescInput): string {
  return describeParts(motif.name, motif.what[d.variant], d, PARTS[d.variant] ?? [], 'przecięty kabel zasilania z wtyczką');
}

export const motif: MotifModule = {
  id: 'szafa-serwerowa',
  name: 'Szafa serwerowa',
  variants: ['firma', 'blokada'],
  what: {
    firma: 'szafa rack z biblioteką kopii zapasowych, serwerem danych, wysuniętą konsolą i uniesioną pokrywą z wentylatorami',
    blokada: 'szafa rack z drzwiami zamkniętymi na cudzą kłódkę, jedna kaseta kopii zapasowej wyjęta i uniesiona obok szafy',
  },
  build,
  describe,
};
