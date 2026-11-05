/**
 * „Maszyna modelu AI” — bliźniak rysunku filaru AI (dane → model z kluczem → wynik), ale jako maszyna, nie układ scalony.
 *   model — lej z arkuszami danych na uniesionej pokrywie (wejście), obudowa z trzema pionowymi perforowanymi płytami
 *           sieci (najwyżej 4 węzły, w miniaturze bez połączeń), gniazdo i duży klucz nad nim, rynna wyników do tacy
 *           z kartami (wynik). Kabel zasilania biegnie do krawędzi płyty, a za obrysem jest przecięty (czerwień:
 *           awarie infrastruktury). Czyta się od lewej: wejście, maszyna, wynik.
 *   firma — mniejsza obudowa bez leja na stole warsztatowym firmy; z portów wychodzą przewody do narzędzi: panelu
 *           z kartami wiadomości (chatbot), tacy dokumentów (asystent) i dwuczłonowego ramienia z chwytakiem (agent),
 *           które sięga poza stół i upuściło detal poza obrys (czerwień: własna strata z decyzji AI).
 * Grupy: g0 płyta (+ stół, taca, kabel), g1 korpus obudowy (+ rynna, porty), g2 płyty sieci / narzędzia,
 * g3 pokrywa z lejem i gniazdem, g4 klucz; out — przecięty kabel / upuszczony detal.
 * Sloty podpisów: model [taca wyników, klucz, lej danych]; firma [ramię agenta, port danych, klucz].
 * Wszystkie podpisy w prawej kolumnie; jedyny wyjątek — lej (model, tylko nagłówek) po lewej, bo odnośnik w prawo
 * przeciąłby klucz.
 */
import { budget, Sketch, faces, hi, plate, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule, Tone } from '../scene.ts';
import { boxes, guide, segs, type Box } from './_g3.ts';

const T = 6;

/** Korpus z otwartą górą: wnętrze (ciemniejsze), tylne ścianki wewnętrzne (jaśniejsze). Zwraca wierzch. */
function housing(s: Sketch, g: number, x0: number, y0: number, z0: number, a: number, b: number, h: number) {
  s.box(g, x0, y0, z0, a, b, h);
  const zt = z0 + h;
  const w = 4;
  s.poly(g, 'bore', [[x0 + w, y0 + w, zt], [x0 + a - w, y0 + w, zt], [x0 + a - w, y0 + b - w, zt], [x0 + w, y0 + b - w, zt]]);
  s.poly(g, 'side-r', [
    [x0 + w, y0 + w, zt],
    [x0 + w, y0 + b - w, zt],
    [x0 + w + 6, y0 + b - w, zt - 4],
    [x0 + w + 6, y0 + w + 6, zt - 4],
    [x0 + a - w, y0 + w + 6, zt - 4],
    [x0 + a - w, y0 + w, zt],
  ]);
  return zt;
}

/** Gniazdo klucza: niski walec z wpustem. Zwraca wierzch. */
function socket(s: Sketch, g: number, cx: number, cy: number, z: number, r = 8) {
  s.cylZ(g, [cx, cy, z], 4, r);
  s.poly(g, 'bore', [[cx - 1.4, cy - r * 0.6, z + 4], [cx + 1.4, cy - r * 0.6, z + 4], [cx + 1.4, cy + r * 0.6, z + 4], [cx - 1.4, cy + r * 0.6, z + 4]]);
  return z + 4;
}

/** Klucz pionowo nad gniazdem: pióro z dwoma ząbkami, szyjka, kabłąk-pierścień (oś x). Zwraca kotwicę (prawy górny skraj kabłąka). */
function key(s: Sketch, g: number, cx: number, cy: number, z: number, tone: Tone, R: number, thumb: boolean) {
  const L = 22;
  const bits: Box[] = [
    [cx - 1.3, cy + 4.5, z + 3, 2.6, 3, 3.5],
    [cx - 1.3, cy + 4.5, z + 10, 2.6, 3, 3.5],
  ];
  s.box(g, cx - 1.3, cy - 4.5, z, 2.6, 9, L + (thumb ? 3 : 0), tone);
  if (!thumb) {
    boxes(s, g, bits, tone);
    s.box(g, cx - 2.2, cy - 5.5, z + L, 4.4, 11, 3, tone);
  }
  const zc = z + L + 3 + R - 1;
  s.tube(g, 'x', [cx - 1.8, cy, zc], 3.6, R * 0.55, R, { tone });
  return [cx + 1.8, cy + R * 0.7, zc + R * 0.7] as V3;
}

/** Lej (odwrócony ścięty ostrosłup) z arkuszami danych. Zwraca kotwice: lewy skraj (nagłówek). */
function hopper(s: Sketch, g: number, cx: number, cy: number, z: number, sheets: number, tone: Tone) {
  const r0 = 7;
  const r1 = 18;
  const H = 22;
  const B = (dx: number, dy: number): V3 => [cx + dx * r0, cy + dy * r0, z];
  const U = (dx: number, dy: number): V3 => [cx + dx * r1, cy + dy * r1, z + H];
  s.box(g, cx - r0, cy - r0, z - 3, 2 * r0, 2 * r0, 3);
  // ścianki wewnętrzne (tylne): −x, −y; dno-otwór
  s.poly(g, 'bore', [B(-1, -1), B(-1, 1), U(-1, 1), U(-1, -1)]);
  s.poly(g, tone === 'hi' ? 'top-hi' : 'side-r', [B(-1, -1), U(-1, -1), U(1, -1), B(1, -1)]);
  s.poly(g, 'bore', [B(-1, -1), B(1, -1), B(1, 1), B(-1, 1)]);
  // arkusze wpadające do leja
  for (let i = 0; i < sheets; i++) {
    const zz = z + H - 7 + i * 9;
    const dx = -3 + i * 5;
    const dy = 2 - i * 4;
    s.poly(g, 'top', [[cx - 11 + dx, cy - 8 + dy, zz], [cx + 11 + dx, cy - 8 + dy, zz], [cx + 11 + dx, cy + 8 + dy, zz], [cx - 11 + dx, cy + 8 + dy, zz]]);
    segs(s, g, 'fine', [0, 1, 2].map((k): [V3, V3] => [[cx - 8 + dx, cy - 4 + dy + k * 4, zz], [cx + (k === 2 ? 0 : 8) + dx, cy - 4 + dy + k * 4, zz]]));
  }
  // ścianki zewnętrzne (przednie): +x, +y
  const f = faces(tone);
  s.poly(g, f.x, [B(1, -1), U(1, -1), U(1, 1), B(1, 1)]);
  s.poly(g, f.y, [B(-1, 1), B(1, 1), U(1, 1), U(-1, 1)]);
  s.poly(g, 'edge', [U(-1, -1), U(1, -1), U(1, 1), U(-1, 1)]);
  return { left: [cx - r1 * 0.55, cy + (r0 + r1) / 2 + 1, z + H * 0.6] as V3 };
}

/* ---------- wariant: model ---------- */
function model(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m);
  const head = !m.thumb;
  plate(s, { x0: -112, y0: -46, w: 348, d: 118, protect: [-104, -38, 172, 64] });

  // g0: kabel zasilania z tyłu obudowy do krawędzi obrysu (dalej — czerwień)
  const cy = -30;
  const CR = 3;
  const zc = T + CR;
  s.cylX(0, [46, cy, zc], 126, CR, { noCap: true });

  /* g1: korpus obudowy */
  const A = 92;
  const Bw = 62;
  const zH = housing(s, 1, 0, 0, T, A, Bw, 44);

  /* g0: taca wyników z kartami (moduł: OC zawodowe) */
  const tx0 = 114;
  const tx1 = 154;
  const ty0 = 12;
  const ty1 = 50;
  const tT: Tone = B.slots[0] ? t : 'ink';
  s.box(0, tx0, ty0, T, tx1 - tx0, ty1 - ty0, 8, tT);
  s.poly(0, 'bore', [[tx0 + 3, ty0 + 3, T + 8], [tx1 - 3, ty0 + 3, T + 8], [tx1 - 3, ty1 - 3, T + 8], [tx0 + 3, ty1 - 3, T + 8]]);
  boxes(s, 0, (head ? [0, 1, 2] : [1]).map((i): Box => [tx0 + 6 - i * 1.5, ty0 + 6 + i, T + 8 + 1 + i * 2.6, 28, 24, 1.4]));

  /* g1: rynna wyników z obudowy do tacy */
  const rz0 = T + 30;
  const rz1 = T + 18;
  s.poly(1, 'bore', [[A, 22, rz0 - 1], [A, 40, rz0 - 1], [A, 40, rz0 + 7], [A, 22, rz0 + 7]]);
  s.prism(1, [[A, 22, rz0], [A, 40, rz0], [tx0 + 12, 40, rz1], [tx0 + 12, 22, rz1]], [0, 0, -2]);
  if (head)
    segs(s, 1, 'edge', [
      [[A, 22, rz0 + 4], [tx0 + 12, 22, rz1 + 4]],
      [[A, 40, rz0 + 4], [tx0 + 12, 40, rz1 + 4]],
    ]);

  /* g2: trzy pionowe perforowane płyty sieci (płaszczyzny x = const), wysunięte w górę z obudowy */
  const zp0 = zH + 3;
  const zp1 = zH + 36;
  const plates = [
    { x: 20, zs: [11, 23] },
    { x: 44, zs: [7, 17, 27] },
    { x: 68, zs: [11, 23] },
  ];
  const ys = (n: number) => Array.from({ length: n }, (_, i) => 10 + ((i + 1) / (n + 1)) * (Bw - 20));
  const nodes = plates.map((p) => ys(p.zs.length).map((y, i): V3 => [p.x + 2.4, y, zp0 + p.zs[i]]));
  plates.forEach((p, i) => {
    s.box(2, p.x, 8, zp0, 2.4, Bw - 16, zp1 - zp0, i === 1 && head ? t : 'ink');
    for (const n of nodes[i]) s.ell(2, 'bore', n, 'x', 3.8);
    if (head && i + 1 < plates.length) {
      const list: [V3, V3][] = [];
      for (const a of nodes[i]) for (const b of nodes[i + 1]) list.push([a, [b[0] - 2.4, b[1], b[2]]]);
      segs(s, 2, 'fine', list);
    }
  });

  /* g3: pokrywa zdjęta — uniesiona i odsunięta w lewo (−x), żeby odsłonić płyty sieci; na niej lej danych i gniazdo klucza */
  const LX = -96;
  const zL = zH + 22;
  s.box(3, LX - 2, -2, zL, A + 4, Bw + 4, 5);
  const zT = zL + 5;
  const hp = hopper(s, 3, LX + 26, 32, zT + 3, head ? 3 : 1, B.slots[2] ? t : 'ink');
  const kx = LX + 70;
  const ky = 32;
  const zs = socket(s, 3, kx, ky, zT);
  /* g4: klucz nad gniazdem (moduł: cyberprzestępstwa) */
  const kT: Tone = B.slots[1] ? t : 'ink';
  if (head) for (const dy of [-4.5, 4.5]) guide(s, 3, 1, kx, ky + dy, zs, zs + 8);
  const kAt = key(s, 4, kx, ky, zs + 8, kT, 10, m.thumb);

  s.label(B.slots[1], kAt, 'r', 4, kT);
  s.label(B.slots[0], [tx1, ty1 - 6, T + 3], 'r', 0, tT);
  s.label(B.slots[2], hp.left, 'l', 3, t);

  /* czerwień: kabel za obrysem przecięty (szczelina), z wtyczką przy krawędzi płyty */
  if (B.fault)
    s.out(() => {
      s.cylX(0, [180, cy, zc], head ? 14 : 22, CR + 0.6, { tone: 'sig' });
      if (head) s.cylX(0, [200, cy, zc], 10, CR + 0.6, { tone: 'sig' });
      s.box(0, 212, cy - 6, T, 12, 12, 10, 'sig');
      segs(s, 0, 'edge-sig', [
        [[224, cy - 3, T + 5], [230, cy - 3, T + 5]],
        [[224, cy + 3, T + 5], [230, cy + 3, T + 5]],
      ]);
      s.label(B.fault, [192, cy, zc + CR], 'r', 0, 'sig');
    });
}

/* ---------- wariant: firma ---------- */
function firma(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const B = budget(m);
  const head = !m.thumb;
  plate(s, { x0: -24, y0: -20, w: 260, d: 112, protect: [-16, -12, 184, 84] });

  /* g0: stół warsztatowy */
  const BX = 176;
  const BY = 70;
  const zB = 42;
  const legs = (ys: number): Box[] => [3, BX - 9].map((x): Box => [x, ys, T, 6, 6, zB - T]);
  boxes(s, 0, legs(3), 'ink', { top: false });
  s.box(0, 6, 6, T + 10, BX - 12, BY - 12, 3);
  boxes(s, 0, legs(BY - 9), 'ink', { top: false });
  s.box(0, 0, 0, zB, BX, BY, 6);
  const zt = zB + 6;

  /* g2: panel wiadomości (chatbot) na lewym końcu stołu, zwrócony w +x */
  if (head) s.box(2, 0, 44, zt, 10, 20, 2);
  s.box(2, 3, 40, zt + 2, 3, 28, 32);
  const xp = 6.05;
  const cards: [number, number, number][] = [
    [43, 58, 27],
    [50, 65, 19],
    [43, 60, 11],
  ];
  for (const [ya, yb, z] of head ? cards : cards.slice(0, 2))
    s.poly(2, 'top', [[xp, ya, zt + 2 + z + 5], [xp, yb, zt + 2 + z + 5], [xp, yb, zt + 2 + z], [xp, ya, zt + 2 + z]]);

  /* g1: obudowa (bez leja) z trzema portami na ścianie +x; środkowy — port danych */
  const hx0 = 24;
  const ha = 44;
  const hy0 = 4;
  const hb = 40;
  const zH = housing(s, 1, hx0, hy0, zt, ha, hb, 28);
  const xF = hx0 + ha + 0.05;
  const zPo = zt + 12;
  const ports = [14, 24, 34];
  const pT: Tone = B.slots[1] ? t : 'ink';
  ports.forEach((y, i) =>
    s.poly(1, i === 1 && pT === 'hi' ? 'top-hi' : 'bore', [[xF, y - 3, zPo - 2.5], [xF, y + 3, zPo - 2.5], [xF, y + 3, zPo + 2.5], [xF, y - 3, zPo + 2.5]]),
  );

  /* g2: przewody z portów po blacie: do ramienia i do tacy dokumentów */
  const zw = zt + 0.4;
  segs(s, 2, 'fine-ink', [
    [[xF, ports[0], zPo - 2.5], [xF, ports[0], zw]],
    [[xF, ports[2], zPo - 2.5], [xF, ports[2], zw]],
  ]);
  s.poly(2, 'fine-ink', [[xF, ports[0], zw], [134, ports[0], zw], [134, 38, zw]], false);
  s.poly(2, 'fine-ink', [[xF, ports[2], zw], [76, ports[2], zw], [76, 50, zw], [82, 50, zw]], false);

  /* g2: taca dokumentów (asystent) */
  const dx0 = 82;
  const dy0 = 40;
  s.box(2, dx0, dy0, zt, 32, 24, 4);
  s.poly(2, 'bore', [[dx0 + 2, dy0 + 2, zt + 4], [dx0 + 30, dy0 + 2, zt + 4], [dx0 + 30, dy0 + 22, zt + 4], [dx0 + 2, dy0 + 22, zt + 4]]);
  boxes(s, 2, (head ? [0, 1, 2] : [1]).map((i): Box => [dx0 + 4 + i * 2, dy0 + 3 - i, zt + 4.5 + i * 2, 22, 18, 1.2]));

  /* g2: ramię agenta (moduł: OC zawodowe): podstawa, człon 1, przegub, człon 2 poza krawędź stołu, chwytak */
  const aT: Tone = B.slots[0] ? t : 'ink';
  const ax = 140;
  const ay = 46;
  s.cylZ(2, [ax, ay, zt], 6, 11, { tone: aT });
  const j1: V3 = [150, ay, zt + 40];
  const w1 = 6;
  s.prism(2, [[ax - w1, ay - w1, zt + 6], [ax + w1, ay - w1, zt + 6], [ax + w1, ay + w1, zt + 6], [ax - w1, ay + w1, zt + 6]], [j1[0] - ax, 0, j1[2] - zt - 6], aT);
  s.cylY(2, [j1[0], ay - 8, j1[2]], 16, 8, { tone: aT, bore: 2.6 });
  const j2: V3 = [196, ay, j1[2] - 10];
  const w2 = 5;
  s.prism(2, [[j1[0] + 4, ay - w2, j1[2] - w2], [j1[0] + 4, ay + w2, j1[2] - w2], [j1[0] + 4, ay + w2, j1[2] + w2], [j1[0] + 4, ay - w2, j1[2] + w2]], [j2[0] - j1[0] - 4, 0, j2[2] - j1[2]], aT);
  s.cylY(2, [j2[0], ay - 6, j2[2]], 12, 5.5, { tone: aT, bore: head ? 1.8 : 0 });
  // nadgarstek i dwa palce chwytaka (rozwarte — detal wypadł)
  s.box(2, j2[0] - 4, ay - 6, j2[2] - 14, 8, 12, 9, aT);
  boxes(s, 2, [
    [j2[0] - 3, ay - 9, j2[2] - 26, 6, 3, 12],
    [j2[0] - 3, ay + 6, j2[2] - 26, 6, 3, 12],
  ], aT);

  /* g3: pokrywa obudowy (uniesiona) z gniazdem; g4: klucz (moduł: cyberprzestępstwa) */
  const zL = zH + 12;
  if (head) for (const [x, y] of [[hx0, hy0 + hb], [hx0 + ha, hy0 + hb], [hx0 + ha, hy0]]) guide(s, 1, 2, x, y, zH, zL);
  s.box(3, hx0 - 2, hy0 - 2, zL, ha + 4, hb + 4, 4);
  const kx = hx0 + ha / 2;
  const ky = hy0 + hb / 2;
  const zs = socket(s, 3, kx, ky, zL + 4, 7);
  const kT: Tone = B.slots[2] ? t : 'ink';
  if (head) for (const dy of [-4.5, 4.5]) guide(s, 3, 1, kx, ky + dy, zs, zs + 8);
  const kAt = key(s, 4, kx, ky, zs + 8, kT, 9, m.thumb);

  s.label(B.slots[2], kAt, 'r', 4, kT);
  s.label(B.slots[1], [xF, ports[1] + 3, zPo], 'r', 1, pT);
  s.label(B.slots[0], [j1[0] + 4, ay + 8, j1[2] + 3], 'r', 2, aT);

  /* czerwień: detal upuszczony przez chwytak — poza stołem i poza obrysem; tor spadku linią przerywaną */
  if (B.fault) {
    const rx = 204;
    const ry = 50;
    if (head) s.line(0, 'fine-d', [j2[0], ay, j2[2] - 28], [rx, ry, T + 14]);
    s.out(() => {
      s.box(0, rx - 8, ry - 8, T, 16, 16, 10, 'sig');
      s.ell(0, 'edge-sig', [rx, ry, T + 10], 'z', 3.6);
      s.label(B.fault, [rx + 8, ry + 2, T + 5], 'r', 0, 'sig');
    });
  }
}

function build(m: MotifInput) {
  const s = new Sketch();
  if (m.variant === 'firma') firma(s, m);
  else model(s, m);
  return s.scene({ zoom: 1.1 });
}

const WHAT: Record<string, string> = {
  model:
    'na uniesionej pokrywie lej z arkuszami danych i gniazdo z kluczem nad nim, z obudowy wysunięte trzy pionowe perforowane płyty sieci, a rynna wyprowadza wyniki na tacę z kartami',
  firma:
    'mała obudowa modelu z uniesioną pokrywą i kluczem na stole warsztatowym; z jej portów przewody prowadzą do panelu z kartami wiadomości, tacy dokumentów i dwuczłonowego ramienia z chwytakiem, które sięga poza stół',
};
const PARTS: Record<string, string[]> = {
  model: ['taca wyników', 'klucz nad gniazdem', 'lej z danymi'],
  firma: ['ramię z chwytakiem', 'port danych obudowy', 'klucz nad gniazdem'],
};

export const motif: MotifModule = {
  id: 'maszyna-ai',
  name: 'Maszyna modelu AI',
  variants: ['model', 'firma'],
  what: WHAT,
  describe: (d) => {
    const v = d.variant === 'firma' ? 'firma' : 'model';
    let out = `Maszyna modelu AI w widoku rozstrzelonym: ${WHAT[v]}.`;
    const named = d.labels.slice(0, 3).flatMap((l, i) => (l ? [`${PARTS[v][i]} — ${l}`] : []));
    if (named.length) out += ` Podpisane części: ${named.join(', ')}.`;
    if (d.fault)
      out +=
        v === 'firma'
          ? ` Detal upuszczony przez ramię leży na czerwono poza obrysem: ${d.fault} — tego polisa nie obejmuje.`
          : ` Kabel zasilania za obrysem jest przecięty, na czerwono: ${d.fault} — tego polisa nie obejmuje.`;
    return out;
  },
  build,
};
