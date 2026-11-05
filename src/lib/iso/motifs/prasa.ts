/**
 * Motyw „Prasa” (plan grafik: final.json → motifs[prasa]; szkic sketch-src/prasa.js). Dwie maszyny jednej rodziny,
 * obie powielają — jedna treść, druga kształt:
 *   drukarska (/ubezpieczenia/oc-mediow/): ręczna prasa śrubowa — belka na dwóch kolumnach, wrzeciono z pokrętłem T,
 *             płyta dociskowa; łoże z formą wysunięte spod płyty, nad formą arkusz z odbitką, z przodu stos wydruków;
 *             czerwień: jeden arkusz odłożony poza stos i poza obrys (umyślne naruszenie);
 *   tlocznik  (/ubezpieczenia/ochrona-prawna-ip/): wykrojnik rozłożony — płyta dolna z matrycą (gniazdo zastrzeżonego
 *             kształtu widoczne z góry) i słupami prowadzącymi (widać trzy z czterech), nad nią stempel tego samego
 *             kształtu z trzpieniem, a nad nim płyta górna na słupach (tylna, z wysięgnikiem do trzpienia — nie zasłania
 *             gniazda ani stempla); obok wypraska-kopia tego kształtu (tusz — zdarzenie objęte ochroną);
 *             czerwień: nowa matryca o innym kształcie poza obrysem (nowy wzór bez zgłoszenia).
 * Uwagi z arkusza: kształt wzoru nie jest strzałką (zarys butelki — klasyczny wzór przemysłowy), gniazdo matrycy
 * widać z góry (stempel uniesiony o G0, płyta górna tylko z tyłu), wszystkie podpisy w prawej kolumnie.
 * Grupy — drukarska: g0 płyta, stół, kolumny, stos; g1 forma; g2 arkusz; g3 płyta dociskowa; g4 belka z wrzecionem.
 *          tłocznik: g0 płyta dolna z matrycą, słupy, wypraska; g1 stempel z trzpieniem; g2 płyta górna.
 * Linie rzutu forma → arkusz i matryca → stempel mają dokładnie G0 (rozciągają się z rozstrzeleniem).
 * Sloty — drukarska: 0 forma, 1 arkusz z odbitką, 2 stos wydruków; tłocznik: 0 matryca (płyta dolna), 1 stempel.
 */
import { G0, Sketch, plate, take, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Tone } from '../scene.ts';
import { THIN, describeParts, rectZ, rot, slotTone } from './_g4.ts';

const T = 6;

/**
 * Treść strony na poziomej płaszczyźnie (arkusz, wierzch stosu): R(u, v) — punkt strony (u w dół strony, v wzdłuż
 * wiersza), L × W — wymiar. Pasek tytułu, ramka zdjęcia (z przekątnymi w nagłówku), wiersze tekstu.
 */
function page(s: Sketch, g: number, R: (u: number, v: number) => V3, L: number, W: number, tone: Tone, t: boolean) {
  const solid = tone === 'sig' ? 'solid-sig' : 'solid';
  const thin = tone === 'sig' ? 'hatch-sig' : 'fine';
  const fr = THIN[tone === 'hi' ? 'ink' : tone];
  const u = (f: number) => -L / 2 + L * f;
  const v = (f: number) => -W / 2 + W * f;
  s.poly(g, solid, [R(u(0.1), v(0.12)), R(u(0.17), v(0.12)), R(u(0.17), v(0.88)), R(u(0.1), v(0.88))]);
  if (tone !== 'sig') {
    s.poly(g, fr, [R(u(0.27), v(0.55)), R(u(0.58), v(0.55)), R(u(0.58), v(0.88)), R(u(0.27), v(0.88))]);
    if (!t) {
      s.line(g, thin, R(u(0.27), v(0.55)), R(u(0.58), v(0.88)));
      s.line(g, thin, R(u(0.27), v(0.88)), R(u(0.58), v(0.55)));
    }
  }
  const n = t ? 3 : 6;
  for (let i = 0; i < n; i++) {
    const f = 0.29 + (i * 0.62) / n;
    const under = tone === 'sig' || f > 0.6;
    s.line(g, thin, R(u(f), v(0.12)), R(u(f), under ? v(i % 3 === 2 ? 0.6 : 0.88) : v(0.47)));
  }
}

/* ---------------- prasa drukarska ---------------- */
function drukarska(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const L = take(m);
  const tForm = slotTone(m, L.labels[0]);
  const tSheet = slotTone(m, L.labels[1]);
  const tStack = slotTone(m, L.labels[2]);
  plate(s, { x0: -30, y0: -26, w: 226, d: 128, protect: [-20, -18, 150, 92] });
  /* g0: stół z prowadnicami, łoże (wózek) wysunięte spod płyty, kolumna tylna */
  s.box(0, -8, 4, T, 146, 56, 8);
  const zr = T + 8;
  for (const y of [10, 47]) s.box(0, -8, y, zr, 146, 3, 3);
  const cx = 26;
  const zB = 92;
  s.cylZ(0, [cx, -6, T], zB - 6 - T, 4.5);
  if (!t) s.cylZ(0, [cx, -6, zB - 6], 4, 2.4);
  const bx0 = 68;
  const bx1 = 130;
  s.box(0, bx0, 6, zr + 3, bx1 - bx0, 48, 6);
  const zF = zr + 9;

  /* g3: płyta dociskowa pod wrzecionem; g4: dolny odcinek wrzeciona */
  const zP = 44;
  s.box(3, cx - 20, 10, zP, 40, 40, 8);
  s.cylZ(3, [cx, 30, zP + 8], 5, 6);
  s.cylZ(4, [cx, 30, zP + 15], zB - zP - 15, 2.8);

  /* g1: forma drukowa: płyta z treścią strony (pasek tytułu, ramka zdjęcia, 3–4 wiersze) — linie, nie bloki */
  const fx0 = bx0 + 6;
  const fx1 = bx1 - 6;
  const fy0 = 11;
  const fy1 = 49;
  s.box(1, fx0, fy0, zF, fx1 - fx0, fy1 - fy0, 4, tForm);
  const zt = zF + 4;
  page(s, 1, rot((fx0 + fx1) / 2, (fy0 + fy1) / 2, 0, zt), fx1 - fx0, fy1 - fy0, 'ink', true);
  const aForm: V3 = [fx1, fy0 + 5, zF + 2];
  // linie rzutu forma → arkusz (dokładnie G0)
  const zS = zt + G0;
  for (const [x, y] of [[fx1 + 1, fy0 - 1], [fx1 + 1, fy1 + 1], [fx0 - 1, fy1 + 1]] as const) s.stretch(1, [x, y, zt], 1, 'proj');

  /* g2: arkusz z odbitką nad formą */
  const sx0 = fx0 - 1;
  const sx1 = fx1 + 1;
  const sy0 = fy0 - 1;
  const sy1 = fy1 + 1;
  s.box(2, sx0, sy0, zS, sx1 - sx0, sy1 - sy0, 0.8, tSheet);
  page(s, 2, rot((sx0 + sx1) / 2, (sy0 + sy1) / 2, 0, zS + 0.8), sx1 - sx0, sy1 - sy0, 'ink', t);
  const aSheet: V3 = [sx1, sy0 + 4, zS + 0.4];

  /* g0: kolumna przednia; g4: belka na kolumnach, nakrętka, wrzeciono, pokrętło T */
  s.cylZ(0, [cx, 66, T], zB - 6 - T, 4.5);
  if (!t) s.cylZ(0, [cx, 66, zB - 6], 4, 2.4);
  s.box(4, cx - 9, -16, zB, 18, 92, 12);
  if (!t) s.cylZ(4, [cx, 30, zB + 12], 5, 6.5);
  const zH = zB + 32;
  s.cylZ(4, [cx, 30, zB + 17], zH - zB - 19, 2.8);
  if (!t) for (let z = zB + 19; z < zH - 7; z += 3) s.line(4, 'fine-ink', [cx - 2, 30 + 2, z], [cx + 2, 30 - 2, z + 1.8]);
  s.cylZ(4, [cx, 30, zH - 3], 6, 4);
  s.cylX(4, [cx - 26, 30, zH], 52, 1.7);
  s.sphere(4, [cx - 27, 30, zH], 3.6, { equator: false });
  s.sphere(4, [cx + 27, 30, zH], 3.6, { equator: false });

  /* g0: stos wydruków z przodu, na prawo od łoża (odnośnik w prawo nie przecina łoża): jedna bryła, arkusze — kreski */
  const kx0 = 104;
  const ky0 = 62;
  const KL = 34;
  const KW = 26;
  const KH = 6;
  s.box(0, kx0, ky0, T, KL, KW, KH, tStack);
  const lines: [V3, V3][] = [];
  for (let z = T + 2; z < T + KH; z += 2) lines.push([[kx0 + KL, ky0, z], [kx0 + KL, ky0 + KW, z]], [[kx0, ky0 + KW, z], [kx0 + KL, ky0 + KW, z]]);
  for (const [a, b] of lines) s.line(0, 'fine', a, b);
  page(s, 0, rot(kx0 + KL / 2, ky0 + KW / 2, 0, T + KH), KL, KW, 'ink', t);
  const aStack: V3 = [kx0 + KL, ky0 + 5, T + 3];

  /* czerwień: arkusz odłożony poza stos i poza obrys (obrócony) */
  if (L.fault)
    s.out(() => {
      const R = rot(174, 70, -0.32, T);
      s.prism(0, [R(-17, -13), R(17, -13), R(17, 13), R(-17, 13)], [0, 0, 1.2], 'sig');
      page(s, 0, rot(174, 70, -0.32, T + 1.2), 34, 26, 'sig', t);
      s.label(L.fault, R(17, -2, T + 0.6), 'r', 0, 'sig');
    });

  s.label(L.labels[1], aSheet, 'r', 2, tSheet);
  s.label(L.labels[0], aForm, 'r', 1, tForm);
  s.label(L.labels[2], aStack, 'r', 0, tStack);
  return s.scene();
}

/* ---------------- tłocznik (wykrojnik) ---------------- */

/** Zastrzeżony wzór: zarys butelki (8 wierzchołków), szyjka w stronę +x (do widza); środek (cx, cy), skala k. */
const BOTTLE = [[0, 46], [22, 46], [22, 18], [15, 11], [15, 0], [7, 0], [7, 11], [0, 18]];
function shape(cx: number, cy: number, z: number, k = 1): V3[] {
  return BOTTLE.map(([u, v]) => [cx + (23 - v) * k, cy + (u - 11) * k, z] as V3);
}

/** Gwiazda (inny kształt — nowa matryca). */
function star(cx: number, cy: number, z: number, r0: number, r1: number): V3[] {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const r = i % 2 ? r0 : r1;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), z] as V3;
  });
}

function tlocznik(m: MotifInput) {
  const s = new Sketch();
  const t = m.thumb;
  const L = take(m);
  const tDie = slotTone(m, L.labels[0]);
  const tPunch = slotTone(m, L.labels[1]);
  plate(s, { x0: -16, y0: -16, w: 222, d: 112, protect: [-8, -8, 156, 88] });
  /* g0: płyta dolna z matrycą: gniazdo zastrzeżonego kształtu widoczne z góry */
  const X = 104;
  const Y = 76;
  const zL = T + 14;
  s.box(0, 0, 0, T, X, Y, 14);
  const SK = 1.15;
  const cx = X / 2 + 4;
  const cy = Y / 2;
  const cav = shape(cx, cy, zL, SK);
  s.pocket(0, rectZ(0, 0, X, Y, zL), cav, 7, { floor: tDie === 'hi' ? 'top-hi' : 'bore' });
  s.poly(0, tDie === 'hi' ? 'trace-hi' : 'edge', cav);
  const aDie: V3 = [X, 12, zL - 4];
  // cztery słupy prowadzące w narożnikach (przedni lewy zasłania matryca — widać trzy), na nich w nagłówku płyta górna
  const PH = t ? 34 : G0 + 22;
  const posts = [[9, 9], [X - 9, 9], [9, Y - 9]] as const;
  for (const [x, y] of posts) s.cylZ(0, [x, y, zL], PH, 3.4, { tone: 'ink' });
  // linie rzutu matryca → stempel (dokładnie G0)
  for (const i of [0, 7, 2]) s.stretch(0, cav[i], 1, 'proj');

  /* g1: stempel — ten sam kształt, uniesiony o G0, z trzpieniem */
  const zP0 = zL + (t ? 26 : G0);
  s.prism(1, shape(cx, cy, zP0, SK), [0, 0, 14], tPunch);
  s.cylZ(1, [cx - 10 * SK, cy, zP0 + 14], 12, 7);
  const aPunch: V3 = [cx + 23 * SK, cy - 4 * SK, zP0 + 7];
  /* g2: płyta górna (trzyma stempel) — z tyłu nad słupami, z tulejami prowadzącymi; przód stempla zostaje widoczny */
  const zU = zP0 + 14 + 12;
  const UX = t ? 40 : 46;
  s.box(2, 0, 0, zU, UX, Y, 8, 'ink');
  for (const [x, y] of posts) if (x < UX) s.ell(2, 'bore', [x, y, zU + 8], 'z', 3.8);
  s.box(2, UX, cy - 9, zU, cx - 10 * SK - UX + 7, 18, 8, 'ink');

  /* g0: wypraska-kopia obok (tusz — zdarzenie objęte ochroną) */
  s.prism(0, shape(132, 64, T, 0.9), [0, 0, 3]);

  /* czerwień: nowa matryca poza obrysem — blok z innym kształtem */
  if (L.fault)
    s.out(() => {
      const rx = 168;
      const ry = 22;
      s.box(0, rx, ry, T, 28, 28, 10, 'sig');
      s.poly(0, 'edge-sig', star(rx + 14, ry + 14, T + 10, 4.5, 10));
      s.label(L.fault, [rx + 28, ry + 8, T + 6], 'r', 0, 'sig');
    });

  s.label(L.labels[1], aPunch, 'r', 1, tPunch);
  s.label(L.labels[0], aDie, 'r', 0, tDie);
  return s.scene();
}

function build(m: MotifInput) {
  return m.variant === 'tlocznik' ? tlocznik(m) : drukarska(m);
}

const PARTS: Record<string, readonly string[]> = {
  drukarska: ['forma z reliefem', 'arkusz z odbitką', 'stos wydruków'],
  tlocznik: ['płyta dolna z matrycą', 'stempel z trzpieniem'],
};
const RED: Record<string, string> = {
  drukarska: 'arkusz odłożony poza stos',
  tlocznik: 'nowa matryca o innym kształcie',
};

function describe(d: DescInput): string {
  return describeParts(motif.name, motif.what[d.variant], d, PARTS[d.variant] ?? [], RED[d.variant]);
}

export const motif: MotifModule = {
  id: 'prasa',
  name: 'Prasa',
  variants: ['drukarska', 'tlocznik'],
  what: {
    drukarska: 'ręczna prasa drukarska z belką na dwóch kolumnach, wrzecionem z pokrętłem i płytą dociskową; łoże z formą wysunięte spod płyty, nad formą arkusz z odbitką, obok stos wydruków',
    tlocznik: 'wykrojnik na słupach prowadzących rozłożony na płytę dolną z gniazdem w kształcie butelki, uniesiony nad nią stempel tego samego kształtu i płytę górną; obok leży wypraska, kopia wzoru',
  },
  build,
  describe,
};
