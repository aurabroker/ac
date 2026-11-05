/**
 * „Manometr ze strefami” (AI Act dzieli systemy według poziomu ryzyka, a jedna strefa jest zakazana).
 * Tarcza leży w płaszczyźnie przedniej ściany obudowy (x = const, zwrócona do widza), cztery łuki stref bez cyfr:
 * minimalne, przejrzystość, wysokie, zakazane — ostatnia, największa, czerwona (wyjątek z planu: czerwień należy
 * do tarczy, więc bez s.out). Wskazówka grafitowa, szybka z pierścieniem lekko odsunięta (bez „opony”: obudowa
 * płytka, odsunięcia małe).
 *
 * Warianty: regulacja (/regulacje/ai-act/) — duży manometr na pochyłym pulpicie, króciec na płycie; zawor (/wiedza/ai-act-a-ubezpieczenie/) —
 * zbiornik ciśnieniowy na siodłach, na nim manometr (złożony) i sprężynowy zawór bezpieczeństwa rozłożony w górę:
 * korpus, grzybek, sprężyna (w miniaturze: osłona sprężyny), kołpak.
 * Grupy: regulacja — g0 płyta, pulpit, króciec, obudowa z tarczą i wskazówką; g1 szybka z pierścieniem (unosi się);
 * zawor — g0 płyta, zbiornik, manometr; g1 korpus, g2 grzybek, g3 sprężyna, g4 kołpak.
 * Sloty podpisów: regulacja [strefa wysokiego ryzyka, strefa przejrzystości, pierścień]; zawor [korpus, sprężyna,
 * grzybek, kołpak]; czerwony podpis — strefa zakazana.
 */
import { add, budget, mul, P, Sketch, hi, nameplate, plate, spring, type V2, type V3 } from '../prims.ts';
import type { MotifInput, MotifModule, Role, Tone } from '../scene.ts';
import { onCircle } from './_g1.ts';

const T = 6;
const rad = (d: number) => (d * Math.PI) / 180;

/** Strefy (kąty w płaszczyźnie tarczy: 0° = +y, 90° = góra; skala biegnie od lewego dołu przez górę do prawego dołu). */
const ZONES = [
  { key: 'min', a: -45, b: 10 },
  { key: 'trans', a: 10, b: 66 },
  { key: 'high', a: 66, b: 124 },
  { key: 'ban', a: 124, b: 225 },
] as const;
type ZoneKey = (typeof ZONES)[number]['key'];

interface GaugeOpt {
  /** Przednia ściana obudowy (płaszczyzna tarczy). */
  xf: number;
  yc: number;
  zc: number;
  R: number;
  depth: number;
  tone: Tone;
  thumb: boolean;
  /** Grupy: obudowa z tarczą, wskazówka, szybka. */
  gCase: number;
  gNeedle: number;
  gGlass: number;
  /** Odsunięcie wskazówki i szybki od tarczy (wzdłuż +x). */
  dn: number;
  dg: number;
  mark?: string;
  needle?: number;
  minorTicks?: boolean;
}

/** Manometr: obudowa (walec wzdłuż x), tarcza ze strefami, wskazówka, szybka z pierścieniem. Zwraca kotwice. */
function gauge(s: Sketch, o: GaugeOpt): Record<ZoneKey | 'ring', V2> {
  const { xf, yc, zc, R } = o;
  const C: V3 = [xf, yc, zc];
  s.cylX(o.gCase, [xf - o.depth, yc, zc], o.depth, R, { tone: 'ink' });
  const r0 = 0.6 * R;
  const r1 = 0.86 * R;
  const role: Record<ZoneKey, Role> = {
    min: 'top',
    trans: o.tone === 'hi' ? 'top-hi' : 'top',
    high: o.tone === 'hi' ? 'top-hi' : 'top',
    ban: 'top-sig',
  };
  const anchors = {} as Record<ZoneKey | 'ring', V2>;
  for (const z of ZONES) {
    s.sector(o.gCase, role[z.key], C, 'x', r0, r1, rad(z.a), rad(z.b));
    anchors[z.key] = P(onCircle(C, 'x', (r0 + r1) / 2, z.key === 'ban' ? 165 : z.key === 'high' ? 100 : (z.a + z.b) / 2));
  }
  // podziałka: kreski główne na granicach stref, drobne tylko w nagłówku
  for (const d of [-45, 10, 66, 124, 225]) s.line(o.gCase, 'edge', onCircle(C, 'x', r0 - 3, d), onCircle(C, 'x', 0.95 * R, d));
  if (o.minorTicks && !o.thumb)
    for (let d = -45; d <= 225; d += 11.25)
      if (![-45, 10, 66, 124, 225].some((b) => Math.abs(b - d) < 4)) s.line(o.gCase, 'fine-ink', onCircle(C, 'x', 0.88 * R, d), onCircle(C, 'x', 0.94 * R, d));
  if (o.mark) s.mark(o.gCase, o.mark, onCircle(C, 'x', 0.36 * R, 270), { u: [0, -1, 0], v: [0, 0, -1], size: 0.13 * R, max: 0.62 * R });
  // wskazówka z kołpakiem (grafit)
  const xn = xf + o.dn;
  const N: V3 = [xn, yc, zc];
  const th = o.needle ?? 104;
  s.poly(o.gNeedle, 'solid', [onCircle(N, 'x', 0.78 * R, th), onCircle(N, 'x', 0.035 * R + 1, th + 90), onCircle(N, 'x', 0.2 * R, th + 180), onCircle(N, 'x', 0.035 * R + 1, th - 90)]);
  s.cylX(o.gNeedle, [xn, yc, zc], 2, 0.07 * R + 1.5, { tone: 'ink' });
  // szybka z pierścieniem
  const xg = xf + o.dg;
  if (!o.thumb) {
    s.line(o.gGlass, 'fine', onCircle([xg + 2.5, yc, zc], 'x', 0.5 * R, 20), onCircle([xg + 2.5, yc, zc], 'x', 0.5 * R, 52));
    s.line(o.gGlass, 'fine', onCircle([xg + 2.5, yc, zc], 'x', 0.42 * R, 26), onCircle([xg + 2.5, yc, zc], 'x', 0.42 * R, 44));
  }
  // pierścień: dwa pierścienie (tył i przód) — bez wypełnionego płaszcza, który zasłoniłby tarczę
  s.ring(o.gGlass, 'side-r', [xg, yc, zc], 'x', R - 2.5, R + 1.5);
  s.ring(o.gGlass, 'top', [xg + 2.5, yc, zc], 'x', R - 2.5, R + 1.5);
  anchors.ring = P(onCircle([xg + 2.5, yc, zc], 'x', R + 1.5, 250));
  return anchors;
}

/**
 * regulacja: tarcza na pochyłym pulpicie (odchylona do tyłu o ALPHA) — prawie „en face”, czytelna i niska; płyta szeroka,
 * na przodzie płyty króciec pomiarowy. Strefy w płaszczyźnie tarczy (0° = +y, 90° = „góra” tarczy); na rysunku góra tarczy
 * patrzy w lewo-w górę, więc strefa wysokiego ryzyka wypada na godz. ~11, a zakazana na godz. 12–3.
 * Podpisy: wysokie ryzyko i przejrzystość — lewa kolumna (odnośnik w prawo przeciąłby czerwoną strefę), pierścień
 * (godz. ~5, poza strefami) i czerwień — prawa. Miniatura: wysokie ryzyko (lewa) i czerwień, węższe kolumny.
 */
const ALPHA = rad(48);
function regulacja(s: Sketch, m: MotifInput) {
  const t = hi(m);
  const R = 56;
  const n: V3 = [Math.cos(ALPHA), 0, Math.sin(ALPHA)];
  const up: V3 = [-Math.sin(ALPHA), 0, Math.cos(ALPHA)];
  const on = (c: V3, r: number, d: number): V3 => add(c, add(mul([0, 1, 0], r * Math.cos(rad(d))), mul(up, r * Math.sin(rad(d)))));
  // kąt Sketch (baza osi n: u = −y, v = −góra) = kąt tarczy + 180°
  const tt = (d: number) => rad(d) + Math.PI;
  const W = 168;
  const D = 150;
  plate(s, { x0: 0, y0: 0, w: W, d: D, protect: [10, 10, W - 10, D - 10], ticks: 30 });
  // pulpit: profil w płaszczyźnie x–z wyciągnięty wzdłuż y; pochyła ściana = płaszczyzna tylnej ścianki obudowy
  const P0 = 2 * R + 16;
  const hF = 6;
  const xF = 112;
  const yc = 76;
  const xB = xF - P0 * Math.sin(ALPHA);
  const zTop = T + hF + P0 * Math.cos(ALPHA);
  const prof: V3[] = [[xF, yc - P0 / 2, T], [xF, yc - P0 / 2, T + hF], [xB, yc - P0 / 2, zTop], [xB, yc - P0 / 2, T]];
  s.prism(0, prof, [0, P0, 0], 'ink');
  // króciec pomiarowy na przodzie płyty (do pulpitu), nakrętka tylko w nagłówku
  s.cylX(0, [xF, yc + 30, T + 5], W - 14 - xF, 4.5, { tone: 'ink' });
  if (!m.thumb) s.cylX(0, [W - 30, yc + 30, T + 5], 6, 7, { tone: 'ink' });
  // obudowa (walec wzdłuż n) z tarczą na wierzchu
  const base = add(add([xF, yc, T + hF], mul(up, P0 / 2)), [0, 0, 0]);
  const depth = 9;
  s.cyl(0, n, base, depth, R, { tone: 'ink' });
  const C = add(base, mul(n, depth));
  const r0 = 0.6 * R;
  const r1 = 0.86 * R;
  const role: Record<ZoneKey, Role> = { min: 'top', trans: t === 'hi' ? 'top-hi' : 'top', high: t === 'hi' ? 'top-hi' : 'top', ban: 'top-sig' };
  for (const z of ZONES) s.sector(0, role[z.key], C, n, r0, r1, tt(z.a), tt(z.b));
  for (const d of [-45, 10, 66, 124, 225]) s.line(0, 'edge', on(C, r0 - 3, d), on(C, 0.95 * R, d));
  if (!m.thumb)
    for (let d = -45; d <= 225; d += 11.25)
      if (![-45, 10, 66, 124, 225].some((b) => Math.abs(b - d) < 4)) s.line(0, 'fine-ink', on(C, 0.88 * R, d), on(C, 0.94 * R, d));
  // tabliczka na tarczy pod osią (napis wzdłuż −y, „w dół” = −góra tarczy)
  // w dolnym prześwicie skali (między kreskami −45° i 225°), poza strefami
  if (m.plate) s.mark(0, m.plate, on(C, 0.55 * R, 270), { u: [0, -1, 0], v: mul(up, -1), size: 0.2 * R, max: 0.8 * R });
  // wskazówka (grafit) z kołpakiem — w strefie wysokiego ryzyka
  const N = add(C, mul(n, 2.5));
  const th = 104;
  s.poly(0, 'solid', [on(N, 0.78 * R, th), on(N, 0.035 * R + 1, th + 90), on(N, 0.2 * R, th + 180), on(N, 0.035 * R + 1, th - 90)]);
  s.cyl(0, n, N, 2, 0.07 * R + 1.5, { tone: 'ink' });
  // szybka z pierścieniem (g1: unosi się z tarczy)
  const G = add(C, mul(n, 5));
  if (!m.thumb) {
    const Gf = add(G, mul(n, 2.5));
    s.line(1, 'fine', on(Gf, 0.5 * R, 20), on(Gf, 0.5 * R, 52));
    s.line(1, 'fine', on(Gf, 0.42 * R, 26), on(Gf, 0.42 * R, 44));
  }
  s.ring(1, 'side-r', G, n, R - 2.5, R + 1.5);
  s.ring(1, 'top', add(G, mul(n, 2.5)), n, R - 2.5, R + 1.5);
  const B = budget(m, { order: m.thumb ? [0] : [0, 1, 2] });
  // węższe kolumny: miniatura — 9 znaków, nagłówek szeroki — prawa kolumna 14 (tarcza dostaje szerokość kadru)
  const wrap = m.thumb ? 9 : undefined;
  const wrapR = m.thumb ? 9 : m.frame === 'w' ? 14 : undefined;
  const mid = (r0 + r1) / 2;
  // wysokie ryzyko: lewy koniec łuku (godz. ~11) → lewa kolumna; przejrzystość: środek łuku (godz. ~9) → lewa
  s.label(B.slots[0], P(on(C, r1, 72)), 'l', 0, t, wrap);
  s.label(B.slots[1], P(on(C, mid, 38)), 'l', 0, t, wrap);
  // pierścień: dolny prawy skraj (godz. ~5, poza strefami)
  s.label(B.slots[2], P(on(add(G, mul(n, 2.5)), R + 1.5, 255)), 'r', 1, t, wrapR);
  s.label(B.fault, P(on(C, mid, 165)), 'r', 0, 'sig', wrapR);
}

/** Lewy / prawy skraj poziomego okręgu na rysunku (kotwica przy części na osi pionowej). */
const sideOf = (c: V3, r: number, dir: 1 | -1): V2 => {
  const p = P(c);
  return [p[0] + dir * r * 1.2247, p[1]];
};

function zawor(s: Sketch, m: MotifInput) {
  const t = hi(m);
  // miniatura nie ma grzybka ani kołpaka: ich sloty idą na koniec kolejki
  const B = budget(m, { order: m.thumb ? [0, 1] : [0, 1, 2, 3] });
  const yc = 40;
  const RT = 26;
  const ZT = T + 12 + RT;
  plate(s, { x0: 0, y0: 0, w: 250, d: 80, protect: [8, 8, 242, 72], ticks: 30 });
  // siodła i zbiornik (g0)
  for (const x of [58, 186]) {
    s.box(0, x - 9, yc - 22, T, 18, 44, 3);
    s.box(0, x - 5, yc - 17, T + 3, 10, 34, ZT - RT - T + 6);
  }
  s.cylX(0, [12, yc, ZT], 224, RT, { tone: 'ink' });
  for (const xw of [36, 212]) s.arc(0, 'fine', [xw, yc, ZT], 'x', RT, -Math.PI / 4, (3 * Math.PI) / 4);
  const zTop = ZT + RT;
  // manometr (złożony) na króćcu — prawa część zbiornika, tarcza zwrócona do widza
  // miniatura: tarcza mniejsza i niżej — odnośniki zaworu przechodzą nad nią, nie po jej obrzeżu
  const R = m.thumb ? 31 : 35;
  const xg = 206;
  const zc = zTop + (m.thumb ? 3 : 6) + R;
  s.cylZ(0, [xg - 5, yc, zTop - 3], zc - R - zTop + 6, 3.6, { tone: 'ink', noCap: true });
  const a = gauge(s, { xf: xg, yc, zc, R, depth: 9, tone: t, thumb: m.thumb, gCase: 0, gNeedle: 0, gGlass: 0, dn: 1.5, dg: 3, needle: 112 });
  // tabliczka na boku zbiornika (płasko na tworzącej ~20° nad osią) — duża, żeby napis miał ≥ 7 px w nagłówku
  if (m.plate && !m.thumb) nameplate(s, 0, m.plate, [128, yc + RT * 0.94, ZT + RT * 0.34], { face: 'y', w: 54, h: 13, size: 9.5 });
  // zawór bezpieczeństwa (lewa część zbiornika), rozstrzelony w górę
  const xv = 70;
  const G = m.thumb ? 7 : 11;
  s.cylZ(0, [xv, yc, zTop - 4], 7, 12, { tone: 'ink' });
  let z = zTop + 3 + G;
  // g1 korpus z wylotem bocznym
  s.cylZ(1, [xv, yc, z], 4, 13, { tone: t });
  if (!m.thumb) s.cylY(1, [xv, yc, z + 11], 17, 5, { tone: 'ink', bore: 3 });
  s.cylZ(1, [xv, yc, z + 4], 15, 9, { tone: t, bore: 5 });
  const aBody = sideOf([xv, yc, z + 9], 13, 1);
  z += 19 + G;
  // g2 grzybek (w miniaturze pominięty: jego podpis i tak nie mieści się w budżecie)
  const aDisc = sideOf([xv, yc, z + 2], 8, 1);
  if (!m.thumb) {
    s.cylZ(2, [xv, yc, z], 3, 8, { tone: t });
    s.cylZ(2, [xv, yc, z + 3], 5, 2.2, { tone: 'ink' });
    z += 8 + G;
  }
  // g3 sprężyna (miniatura: osłona sprężyny — bez sprężyn w miniaturach)
  let aSpring: V2;
  if (m.thumb) {
    s.cylZ(3, [xv, yc, z], 20, 9, { tone: t });
    aSpring = sideOf([xv, yc, z + 12], 9, 1);
    z += 20 + G;
  } else {
    const z0 = z;
    spring(s, 3, 'z', [xv, yc, z0], 24, 8, 5, { tone: t, behind: () => s.cylZ(3, [xv, yc, z0 - 2], 28, 2.2, { tone: 'ink' }) });
    aSpring = sideOf([xv, yc, z0 + 12], 8, 1);
    z += 24 + G;
  }
  // g4 kołpak (miniatura: bez kołpaka — jego podpis i tak nie mieści się w budżecie, a zawór jest niższy)
  const aCap = sideOf([xv, yc, z + 6], 10, 1);
  if (!m.thumb) {
    s.cylZ(4, [xv, yc, z], 13, 10, { tone: t });
    s.cylZ(4, [xv, yc, z + 13], 5, 3.5, { tone: 'ink' });
  }
  s.label(B.slots[0], aBody, 'r', 1, t);
  s.label(B.slots[1], aSpring, 'r', 3, t);
  s.label(B.slots[2], aDisc, 'r', 2, t);
  s.label(B.slots[3], aCap, 'r', 4, t);
  s.label(B.fault, a.ban, 'r', 0, 'sig');
}

function build(m: MotifInput) {
  const s = new Sketch();
  if (m.variant === 'zawor') {
    zawor(s, m);
    return s.scene();
  }
  regulacja(s, m);
  return s.scene({ zoom: 1.2 });
}


export const motif: MotifModule = {
  id: 'manometr',
  name: 'Manometr ze strefami',
  variants: ['regulacja', 'zawor'],
  what: {
    regulacja: 'tarcza z czterema strefami bez cyfr, ostatnia i największa strefa jest czerwona, wskazówka oraz lekko odsunięta szybka z pierścieniem',
    zawor: 'zbiornik ciśnieniowy z manometrem i sprężynowym zaworem bezpieczeństwa rozłożonym na korpus, grzybek, sprężynę i kołpak',
  },
  build,
  // regulacja: czerwień to strefa skali (zakazane praktyki), a nie wyłączenie z polisy — opis mówi o strefie
  describe: (d) => {
    const what = motif.what[d.variant];
    if (d.calm) return `${motif.name}: ${what}.`;
    let out = `${motif.name} w widoku rozstrzelonym: ${what}.`;
    if (d.labels.some(Boolean)) out += ` Podpisane części: ${d.labels.filter(Boolean).join(', ')}.`;
    if (d.fault)
      out +=
        d.variant === 'regulacja'
          ? ` Czerwona strefa tarczy: ${d.fault}.`
          : ` Czerwona strefa tarczy oznacza to, czego polisa nie obejmuje: ${d.fault}.`;
    return out;
  },
};
