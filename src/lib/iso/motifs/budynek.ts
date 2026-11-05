/**
 * Motyw „Budynek w przekroju” (plan grafik: final.json → motifs[budynek]; szkic sketch-src/budynek.js).
 * Makieta: posadzka, dwie tylne ściany przecięte poziomo (kreskowanie przekroju tylko w nagłówku), wyposażenie
 * jako proste bryły, strop / dach uniesiony. Czerwień: jeden przedmiot poza budynkiem i poza obrysem ochrony.
 *   lokal (/ubezpieczenia/oc-dzialalnosci/): pokój klienta w czasie wizyty technika — drabina pod montowanym
 *         urządzeniem, przeciekające złącze rury pod stropem i kałuża; strop w kształcie L; poza lokalem monitor z kodem;
 *   hala  (/ubezpieczenia/mienie-i-sprzet-elektroniczny/): niska hala, dach piłokształtny na całej szerokości
 *         narysowany samym obrysem (linia widmowa — nie zasłania wnętrza, nie czyta się jak schody), regał z towarem,
 *         szafka z serwerem, maszyna na fundamencie; poza halą kaseta danych z kłódką.
 * Grupy: g0 płyta + posadzka (+ kałuża), g1 ściany i wszystko w środku, g2 strop / dach.
 * Hala: regał stoi przy lewej ścianie, żeby obrys dachu nad tylną ścianą nie przecinał wyposażenia.
 * Sloty — lokal: 0 kałuża, 1 montowane urządzenie, 2 ściany, 3 biurko klienta z komputerem;
 *         hala: 0 ściany (budynek), 1 szafka z serwerem, 2 maszyna na fundamencie.
 * Wszystkie podpisy w prawej kolumnie (kotwice po prawej stronie rysunku).
 */
import { Sketch, padlock, plate, take, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Tone } from '../scene.ts';
import { THIN, TOP, describeParts, link, rectX, rectZ, slotTone } from './_g4.ts';

const T = 6;
/** Poziom posadzki i grubość ścian. */
const FZ = T + 4;
const WT = 6;

/** Dwie tylne ściany (wzdłuż y = 0 i x = 0) przecięte na wysokości h; kreskowanie przekroju (nagłówek). */
function walls(s: Sketch, g: number, W: number, D: number, h: number, tone: Tone, hatch: boolean) {
  s.box(g, 0, WT, FZ, WT, D - WT, h, tone);
  s.box(g, 0, 0, FZ, W, WT, h, tone);
  if (hatch) {
    const z = FZ + h;
    s.hatch(g, [0, 0, z], [W, 0, 0], [0, WT, 0], 6);
    s.hatch(g, [0, WT, z], [0, D - WT, 0], [WT, 0, 0], 6);
  }
}

/** Monitor na nóżce, ekran zwrócony do +x: x — płaszczyzna ekranu, y0…y0+w, spód z0. Zwraca ekran. */
function monitor(s: Sketch, g: number, x: number, y0: number, z0: number, w: number, h: number, tone: Tone) {
  s.box(g, x - 7, y0 + w / 2 - 5, z0, 9, 10, 1.5, tone);
  s.box(g, x - 4, y0 + w / 2 - 1.2, z0 + 1.5, 2.4, 2.4, 5, tone);
  s.box(g, x - 3, y0, z0 + 6, 3, w, h, tone);
  const xs = x + 0.05;
  s.poly(g, tone === 'sig' ? 'top-sig' : 'bore', rectX(xs, y0 + 2, y0 + w - 2, z0 + 8, z0 + 4 + h));
  return { xs, y0, z0: z0 + 6, w, h };
}

/** Linie kodu na ekranie (płaszczyzna x = xs). */
function code(s: Sketch, g: number, sc: { xs: number; y0: number; z0: number; w: number; h: number }, n: number, tone: Tone) {
  const rows: [number, number][] = [[0, 0.6], [1, 0.42], [1, 0.62], [2, 0.34], [1, 0.5], [0, 0.28]];
  const lh = (sc.h - 5) / (n + 0.6);
  rows.slice(0, n).forEach(([ind, l], i) => {
    const z = sc.z0 + sc.h - 3.5 - lh * (i + 0.6);
    const ya = sc.y0 + sc.w - 4 - ind * 3.5;
    s.line(g, THIN[tone], [sc.xs + 0.05, ya, z], [sc.xs + 0.05, ya - (sc.w - 9) * l, z]);
  });
}

/** Kałuża: nieregularna plama na posadzce. */
function puddle(s: Sketch, g: number, cx: number, cy: number, r: number, n: number, tone: Tone) {
  const pts: V3[] = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    const rr = r * (1 + 0.17 * Math.sin(3 * t + 0.6) + 0.1 * Math.cos(5 * t));
    pts.push([cx + rr * Math.cos(t), cy + rr * 0.75 * Math.sin(t), FZ + 0.1]);
  }
  s.poly(g, TOP[tone], pts);
}

/** Drabina rozstawna (linie): wierzchołek nad x = xa, szerokość wzdłuż y (y0…y0 + wd), wysokość h. */
function ladder(s: Sketch, g: number, xa: number, y0: number, wd: number, h: number, steps: number) {
  const zt = FZ + h;
  for (const y of [y0, y0 + wd]) s.line(g, 'edge', [xa - 13, y, FZ], [xa - 1.5, y, zt]);
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    const x = xa + 13 - 11.5 * t;
    s.line(g, 'edge', [x, y0, FZ + h * t], [x, y0 + wd, FZ + h * t]);
  }
  for (const y of [y0, y0 + wd]) s.line(g, 'edge', [xa + 13, y, FZ], [xa + 1.5, y, zt]);
  s.box(g, xa - 3, y0 - 1, zt, 6, wd + 2, 2);
}

/** Biurko: blat na czterech nogach (nogi jako linie). */
function desk(s: Sketch, g: number, x0: number, y0: number, w: number, d: number, h: number) {
  for (const [x, y] of [[x0 + 2, y0 + d - 2], [x0 + w - 2, y0 + d - 2], [x0 + w - 2, y0 + 2]]) s.line(g, 'edge', [x, y, FZ], [x, y, FZ + h - 2.5]);
  s.box(g, x0, y0, FZ + h - 2.5, w, d, 2.5);
  return FZ + h;
}

/* ---------------- lokal: OC działalności ---------------- */
function lokal(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const L = take(m);
  const tPud = slotTone(m, L.labels[0]);
  const tDev = slotTone(m, L.labels[1]);
  const tWal = slotTone(m, L.labels[2]);
  const tPc = slotTone(m, L.labels[3]);
  const W = 140;
  const D = 112;
  const H = 54;
  plate(s, { x0: -14, y0: -14, w: 214, d: D + 34, protect: [-6, -6, W + 10, D + 12] });
  /* g0: posadzka i kałuża pod złączem rury */
  s.box(0, 0, 0, T, W, D, FZ - T);
  const pX = 120;
  puddle(s, 0, pX, 26, 13, t ? 14 : 22, tPud);

  /* g1: ściany, rura z przeciekiem, urządzenie na ścianie, drabina (+ biurko, skrzynka w nagłówku) */
  walls(s, 1, W, D, H, tWal, !t);
  const zP = FZ + H - 6;
  s.cylX(1, [WT, WT + 4, zP], W - WT, 2.6);
  s.cylX(1, [pX - 4, WT + 4, zP], 8, 4.2);
  for (const [z1, z2] of [[zP - 7, zP - 12], [zP - 18, zP - 23], [zP - 30, zP - 34]]) s.line(1, 'trace-hi', [pX, WT + 5, z1], [pX, WT + 5, z2]);
  // montowane urządzenie na wewnętrznej ścianie y = WT
  const dx0 = 70;
  const dz = FZ + 18;
  s.box(1, dx0, WT, dz, 24, 6, 13, tDev);
  s.line(1, THIN[tDev], [dx0 + 4, WT + 6, dz + 8.5], [dx0 + 14, WT + 6, dz + 8.5]);
  const aDev: V3 = [dx0 + 24, WT + 3, dz + 1.5];
  ladder(s, 1, dx0 + 10, 34, 14, 24, 2);
  let aPc: V3 = [40, 92, FZ + 24];
  if (!t) {
    s.box(1, 52, 60, FZ, 16, 9, 7);
    s.arc(1, 'edge', [60, 64.5, FZ + 7], 'y', 4, 0, Math.PI);
    const zt = desk(s, 1, 18, 64, 30, 34, 22);
    const sc = monitor(s, 1, 32, 70, zt, 20, 13, tPc);
    aPc = [sc.xs, sc.y0 + 4, sc.z0 + sc.h * 0.6];
  }

  /* g2: strop w kształcie L uniesiony nad ścianami */
  const GAP = 26;
  const zC = FZ + H + GAP;
  const SD = 26;
  link(s, 1, 2, [W, 0, FZ + H], GAP);
  link(s, 1, 2, [0, D, FZ + H], GAP);
  s.prism(2, [[0, 0, zC], [W, 0, zC], [W, SD, zC], [SD, SD, zC], [SD, D, zC], [0, D, zC]], [0, 0, 6]);
  if (!t) {
    s.hatch(2, [W, 0, zC], [0, SD, 0], [0, 0, 6], 4);
    s.hatch(2, [0, D, zC], [SD, 0, 0], [0, 0, 6], 4);
  }

  /* czerwień: monitor z kodem poza lokalem i poza obrysem (czysta strata finansowa) */
  if (L.fault)
    s.out(() => {
      const sc = monitor(s, 0, 176, 84, T, 34, 24, 'sig');
      code(s, 0, sc, t ? 4 : 6, 'sig');
      s.label(L.fault, [sc.xs, sc.y0 + 3, sc.z0 + sc.h * 0.7], 'r', 0, 'sig');
    });

  s.label(L.labels[2], [W, WT / 2, FZ + H - 4], 'r', 1, tWal);
  s.label(L.labels[1], aDev, 'r', 1, tDev);
  s.label(L.labels[0], [pX + 12, 30, FZ], 'r', 0, tPud);
  s.label(L.labels[3], aPc, 'r', 1, tPc);
  return s.scene();
}

/* ---------------- hala: mienie i sprzęt elektroniczny ---------------- */

/** Regał z towarem wzdłuż ściany x = 0 (półki zwrócone do +x): y0…y0+w, głębokość d (x), wysokość h. */
function rack(s: Sketch, g: number, x0: number, y0: number, w: number, d: number, h: number, rows: number, t: boolean) {
  for (const [x, y] of [[x0, y0], [x0, y0 + w]]) s.line(g, 'edge', [x, y, FZ], [x, y, FZ + h]);
  for (let i = 0; i < rows; i++) {
    const z = FZ + 2 + (i * (h - 3)) / (rows - 1);
    s.box(g, x0, y0, z - 1.5, d, w, 1.5);
    if (i < rows - 1) {
      const sizes = [[11, 9], [9, 11], [13, 8], [10, 10]];
      let y = y0 + 2;
      let k = i;
      const n = t ? 2 : 4;
      for (let j = 0; j < n && y < y0 + w - 8; j++) {
        const [bw, bh] = sizes[k++ % sizes.length];
        const ww = Math.min(bw, y0 + w - 2 - y);
        s.box(g, x0 + 2, y, z, d - 4, ww - 1, Math.min(bh, (h - 3) / (rows - 1) - 4));
        y += ww + (t ? 5 : 0);
      }
    }
  }
  for (const [x, y] of [[x0 + d, y0], [x0 + d, y0 + w]]) s.line(g, 'edge', [x, y, FZ], [x, y, FZ + h]);
}

/**
 * Dach piłokształtny — sam obrys (bez wypełnień, więc nie zasłania wnętrza i nie czyta się jak schody):
 * pas nad tylną ścianą przez całą szerokość hali (x 0…W, y 0…RD): szczyt tylny tuszem, przedni i kalenice cienko.
 */
function sawRoof(s: Sketch, g: number, W: number, RD: number, z: number, n: number, hT: number) {
  const p = W / n;
  const prof = (y: number): V3[] => {
    const pts: V3[] = [[0, y, z]];
    for (let i = 0; i < n; i++) pts.push([(i + 1) * p, y, z + hT], [(i + 1) * p, y, z]);
    return pts;
  };
  for (let i = 0; i < n; i++) s.line(g, 'fine-ink', [(i + 1) * p, 0, z + hT], [(i + 1) * p, RD, z + hT]);
  s.line(g, 'fine-ink', [0, 0, z], [0, RD, z]);
  s.poly(g, 'fine-ink', prof(RD), true);
  s.poly(g, 'edge', prof(0), true);
}

/** Kaseta danych z kłódką (czerwień): x, y — narożnik, wymiary L × B × h. Zwraca kotwicę. */
function cassette(s: Sketch, g: number, x: number, y: number, t: boolean): V3 {
  const Lx = 26;
  const B = 30;
  const h = 8;
  s.box(g, x, y, T, Lx, B, h, 'sig');
  const zt = T + h;
  s.poly(g, 'hatch-sig', rectZ(x + 6, y + 5, x + 20, y + 25, zt));
  for (const yy of [y + 10.5, y + 19.5]) s.ell(g, 'hatch-sig', [x + 13, yy, zt], 'z', t ? 3 : 3.4);
  return padlock(s, g, [x + Lx + 0.5, y + 9, T + 2], { face: 'x', w: 12, h: 10, d: 4, tone: 'sig' });
}

function hala(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const L = take(m);
  const tWal = slotTone(m, L.labels[0]);
  const tSrv = slotTone(m, L.labels[1]);
  const tMac = slotTone(m, L.labels[2]);
  const W = 156;
  const D = 104;
  const H = 38;
  plate(s, { x0: -14, y0: -14, w: 232, d: D + 30, protect: [-6, -6, W + 10, D + 10] });
  /* g0: posadzka */
  s.box(0, 0, 0, T, W, D, FZ - T);

  /* g1: ściany, regał, szafka z serwerem, maszyna (+ biurko z laptopem w nagłówku) */
  walls(s, 1, W, D, H, tWal, !t);
  rack(s, 1, WT + 3, 30, 46, 16, 32, 3, t);
  // szafka z serwerem przy ścianie y = 0 (prawy koniec)
  const sx = 110;
  const sy = WT + 3;
  s.box(1, sx, sy, FZ, 18, 16, 34, tSrv);
  for (let z = FZ + 7; z < FZ + 33; z += t ? 7 : 4.5) s.line(1, THIN[tSrv], [sx + 3, sy + 16, z], [sx + 15, sy + 16, z]);
  const aSrv: V3 = [sx + 18, sy + 7, FZ + 27];
  // maszyna na fundamencie (prawy przód hali)
  const mx = 102;
  const my = 54;
  s.box(1, mx - 4, my - 4, FZ, 46, 34, 4);
  s.box(1, mx, my, FZ + 4, 38, 26, 18, tMac);
  s.poly(1, 'bore', rectX(mx + 38, my + 6, my + 20, FZ + 8, FZ + 18));
  s.box(1, mx + 6, my + 4, FZ + 22, 22, 18, 8);
  s.cylY(1, [mx + 17, my - 5, FZ + 26], 9, 4);
  const aMac: V3 = [mx + 38, my + 22, FZ + 14];
  if (!t) {
    rack(s, 1, 30, WT + 3, 40, 16, 32, 3, t);
    const zt = desk(s, 1, 44, 72, 28, 24, 20);
    s.box(1, 54, 76, zt, 12, 16, 1.2);
    s.prism(1, [[54, 76, zt + 1.2], [50.5, 76, zt + 12], [51.5, 76, zt + 12.3], [55, 76, zt + 1.2]], [0, 16, 0]);
  }

  /* g2: dach piłokształtny (obrys) uniesiony nad halą */
  const GAP = 12;
  const zR = FZ + H + GAP;
  link(s, 1, 2, [W, 0, FZ + H], GAP);
  link(s, 1, 2, [0, 0, FZ + H], GAP);
  sawRoof(s, 2, W, 28, zR, 4, 15);

  /* czerwień: kaseta danych z kłódką poza halą */
  if (L.fault)
    s.out(() => {
      const a = cassette(s, 0, 182, 46, t);
      s.label(L.fault, a, 'r', 0, 'sig');
    });

  s.label(L.labels[0], [W, WT / 2, FZ + H - 2], 'r', 1, tWal);
  s.label(L.labels[1], aSrv, 'r', 1, tSrv);
  s.label(L.labels[2], aMac, 'r', 1, tMac);
  return s.scene();
}

function build(m: MotifInput) {
  return m.variant === 'hala' ? hala(m) : lokal(m);
}

const PARTS: Record<string, readonly string[]> = {
  lokal: ['kałuża pod przeciekającym złączem rury', 'urządzenie montowane na ścianie', 'ściany lokalu', 'biurko klienta z komputerem'],
  hala: ['ściany hali i dach', 'szafka z serwerem', 'maszyna na fundamencie'],
};
const RED: Record<string, string> = {
  lokal: 'monitor z linijkami kodu wyniesiony poza lokal',
  hala: 'kaseta danych z kłódką wyniesiona poza halę',
};

function describe(d: DescInput): string {
  return describeParts(motif.name, motif.what[d.variant], d, PARTS[d.variant] ?? [], RED[d.variant]);
}

export const motif: MotifModule = {
  id: 'budynek',
  name: 'Budynek w przekroju',
  variants: ['lokal', 'hala'],
  what: {
    lokal: 'pokój klienta w czasie wizyty technika — drabina pod montowanym urządzeniem, przeciekające złącze rury pod uniesionym stropem i kałuża na posadzce',
    hala: 'niska hala z uniesionym dachem piłokształtnym, regałem z towarem, szafką z serwerem i maszyną na fundamencie',
  },
  build,
  describe,
};
