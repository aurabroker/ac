/**
 * Prymitywy rysunków izometrycznych — wspólny zestaw dla wszystkich motywów (src/lib/iso/motifs/*.ts).
 * Motywy NIE dopisują tu nic i nie zmieniają render.ts / scene.ts / iso.css: wszystko, czego potrzebują,
 * jest poniżej. Rzut, wektory i okręgi: geom.ts (iso, P, add/sub/mul/dot/cross/unit, circ, G0, STEP0, deg).
 *
 * ─── Układ ────────────────────────────────────────────────────────────────────────────────────────────
 * Scena: x w prawo-w dół, y w lewo-w dół, z w górę; widz z (1,1,1). Widoczne ściany prostopadłościanu:
 * górna (z = z1), „prawa” x = x1 (side-r, jaśniejsza) i „lewa/przednia” y = y1 (side-l, ciemniejsza).
 * Koperta motywu: płyta ~260×200 jedn. (rzut ≈ 400 jedn. szerokości), wysokość ≤ 5·G0 + 60. Kadr dopasowuje
 * skalę sam (render.ts), więc liczy się proporcja, nie wielkość. Miniatura: obiekt wypełnia ~66% szerokości.
 *
 * ─── Szkic (Sketch) ───────────────────────────────────────────────────────────────────────────────────
 * Pierwszy argument metod rysujących to grupa g (0–5) = poziom rozstrzelenia. Kolejność wywołań = kolejność
 * malowania (malarz: najpierw to, co z tyłu i niżej). `Faces` = ton ('ink' | 'hi' | 'sig') albo role ścian
 * { top?, x?, y? }. `ItemOpt` = { dash?, eo?, nobox?, out?, stretch? }.
 *   s.poly(g, role, pts3, closed = true, opt)      wielokąt / łamana 3D
 *   s.poly2(g, role, pts2, closed = true, opt)     to samo na płaszczyźnie rysunku
 *   s.line(g, role, a, b, opt)                     odcinek
 *   s.stretch(g, a, n, role = 'cl', axis = 'z')    linia konstrukcyjna długości n·G0 wzdłuż z (albo x),
 *                                                  rozciąga się przy rozstrzeleniu razem z grupą g + n
 *   s.axisLine(g, a, b)                            oś (kreska-kropka)
 *   s.ell(g, role, c, axis, r, opt) → Circ         okrąg w płaszczyźnie ⟂ osi ('x'|'y'|'z' albo wektor)
 *   s.ring(g, role, c, axis, r0, r1, opt)          pierścień (evenodd)
 *   s.arc(g, role, c, axis, r, t0, t1, opt)        łuk (t: od u do v bazy osi, geom.BASIS)
 *   s.sector(g, role, c, axis, r0, r1, t0, t1)     wycinek pierścienia (strefy tarczy), r0 = 0 → wycinek koła
 *   s.box(g, x0, y0, z0, w, d, h, faces, opt)      prostopadłościan (3 widoczne ściany)
 *   s.prism(g, pts3, e, faces, opt)                wielokąt płaski wyciągnięty o wektor e (ściany tylne odrzucone)
 *   s.cyl(g, axis, c0, L, r, opt) → {e0, e1}       walec c0 → c0 + L·oś; opt: tone, side, cap, noCap, r1 (stożek
 *   s.cylX / s.cylY / s.cylZ(g, c0, L, r, opt)       ścięty), bore (otwór w denku), boreRole
 *   s.tube(g, axis, c0, L, r0, r1, opt)            tuleja (denko-pierścień)
 *   s.cone(g, c0, h, r, opt)                       stożek pionowy (wierzchołek w c0 + h·z)
 *   s.sphere(g, c, r, opt)                         kula (obrys + przednia połowa równika)
 *   s.arrow(g, a, b, {tone, hl, hw})               strzałka: trzon a → b i grot na b
 *   s.hatch(g, o, ua, ub, step, role = 'hatch')    kreskowanie równoległoboku (tylko przekroje!)
 *   s.loops(g, role, [pts3…])                      ściana z otworami (evenodd)
 *   s.pocket(g, face | null, hole, depth, opt)     wnęka w poziomej ścianie (dno + widoczne ścianki + ściana z otworem)
 *   s.mark(g, text, at, {u, v, size, max, plate})  napis na płaszczyźnie (tabliczka), domyślnie na górnej ścianie;
 *                                                  plate — obrys tabliczki, znika razem z za małym napisem
 *   s.label(text, at, side = 'r', g = 0, tone, wrap) etykieta z odnośnikiem; at = punkt 3D albo 2D rysunku;
 *                                                  wrap — węższa kolumna (znaki w wierszu)
 *   s.out(() => …)                                 wszystko w środku (także etykiety) = część „poza ochroną”
 *   s.dashed(() => …)                              wszystko w środku z obrysem przerywanym (część warunkowa)
 *   s.scene({axis, outDir, calm, k, zoom}) → Scene koniec (zoom > 1 — mała scena: większa skala kadru, razem z ruchem)
 *
 * ─── Złożone kształty (funkcje) ───────────────────────────────────────────────────────────────────────
 *   plate(s, {x0, y0, w, d, h, protect, ticks})    wspólna płyta bazowa: przerywany obrys ochrony, znaczniki
 *                                                  na krawędziach; NIC więcej na płycie (bez ścieżek, pól, kulek)
 *   gear(s, g, c, {teeth, m, thk, tone, missing, phase, hub}) koło zębate: zęby na górnej ścianie + pasek walca
 *   meshPhase(a, b, theta) / toothAt(gear, angle)  zazębienie dwóch kół
 *   ibeam(s, g, x0, x1, {y0, w, z0, h, tf, tw, tone}) dwuteownik wzdłuż x (czoło przekroju z przodu po prawej)
 *   spring(s, g, axis, c0, L, R, turns, {tone, behind}) sprężyna śrubowa (tylko nagłówek — nie w miniaturze)
 *   chair(s, g, cx, cy, z, {back, seat, tone})     puste krzesło (siedzisko, oparcie, nogi)
 *   padlock(s, g, at, {face, w, h, d, tone})       kłódka z kabłąkiem
 *   drawerBox(s, g, {x0, y0, z0, w, d, h, pull, tone, dashed}) szuflada (czoło z uchwytem i ramką, wysuw wzdłuż x)
 *   nameplate(s, g, text, at, {face, w, h})        tabliczka znamionowa z napisem (pomija pusty tekst)
 *   crack(s, g, a, b, {n, amp, role})              rysa (zygzak)
 *   take(m, {inputs})                              podział budżetu etykiet: czerwona, wloty, moduły
 *   budget(m, {inputs, order}) → {fault, inputs, slots}  to samo ze slotami (kolejność slotów w budżecie kadru)
 *   slotTone(m, label)                             błękit dla części z podpisanym modułem, inaczej tusz
 *   ellPoint(e, [dx, dy])                          skraj elipsy w kierunku na rysunku (kotwica etykiety na obrzeżu)
 *   circlePts(c, axis, r, n, phase)                wielokąt foremny w płaszczyźnie ⟂ osi (nakrętka, tarcza)
 *   tone helpers: faces(tone), lineRole(tone), solidRole(tone), hi(m)
 *
 * ─── Kolor = znaczenie ────────────────────────────────────────────────────────────────────────────────
 * Tusz: przedmiot i zdarzenie objęte ochroną. Błękit ('hi'): części niosące moduły z tabeli zakresu.
 * Czerwień ('sig'): dokładnie JEDNA rzecz poza ochroną — zwykle odłożona poza obrys ochrony i w s.out(…).
 * Spokojna scena (m.calm): render i tak zamienia błękit i czerwień na tusz i usuwa etykiety.
 *
 * ─── Szkielet motywu ──────────────────────────────────────────────────────────────────────────────────
 *   import { Sketch, plate, take, faces } from '../prims.ts';
 *   import type { MotifInput, MotifModule } from '../scene.ts';
 *   function build(m: MotifInput) {
 *     const s = new Sketch();
 *     const { zt } = plate(s, { x0: 0, y0: 0, w: 260, d: 160 });
 *     const L = take(m);                                    // { fault, labels, inputs } w budżecie kadru
 *     s.box(1, 60, 40, zt + G0, 80, 60, 30, 'hi');
 *     s.label(L.labels[0], [140, 40, zt + G0 + 15], 'r', 1, 'hi');
 *     if (L.fault) s.out(() => { s.box(0, 220, 120, zt, 30, 30, 20, 'sig'); s.label(L.fault, [250, 120, zt + 10], 'r', 0, 'sig'); });
 *     return s.scene();
 *   }
 *   export const motif: MotifModule = { id: 'belka', name: 'Belka na podporach', variants: ['ciagla'], what: { ciagla: '…' }, build };
 */
import {
  AX,
  BASIS,
  G0,
  P,
  TAU,
  VIEW,
  add,
  axisBasis,
  circ,
  cr2,
  cross,
  deg,
  dirP,
  dot,
  len,
  mul,
  sub,
  unit,
  type AxisName,
  type Circ,
  type V2,
  type V3,
} from './geom.ts';
import type { At, FrameKind, Item, LabelReq, Mark, MotifInput, Role, Scene, Seg, Tone } from './scene.ts';

export { G0, STEP0, OUT0, deg, iso, P, add, sub, mul, dot, cross, unit, len, circ, BASIS, AX } from './geom.ts';
export type { V2, V3, Circ, AxisName } from './geom.ts';

export interface ItemOpt {
  /** Linia konstrukcyjna rozciągana przy rozstrzeleniu. */
  stretch?: boolean;
  /** Obrys przerywany (część warunkowa). */
  dash?: boolean;
  /** Wypełnienie evenodd. */
  eo?: boolean;
  /** Pomiń w kadrowaniu. */
  nobox?: boolean;
  /** Część „poza ochroną” (zwykle zamiast tego: s.out(() => …)). */
  out?: boolean;
}

/** Ton albo role ścian (top — górna/dolna, x — ściana ⟂ x, y — ściana ⟂ y). */
export type Faces = Tone | { top?: Role; x?: Role; y?: Role };

const TOP: Record<Tone, Role> = { ink: 'top', hi: 'top-hi', sig: 'top-sig' };
const SIDE_X: Record<Tone, Role> = { ink: 'side-r', hi: 'side-hi', sig: 'side-sig' };
const SIDE_Y: Record<Tone, Role> = { ink: 'side-l', hi: 'side-hi', sig: 'side-sig' };
const LINE: Record<Tone, Role> = { ink: 'edge', hi: 'trace-hi', sig: 'edge-sig' };
const SOLID: Record<Tone, Role> = { ink: 'solid', hi: 'solid-hi', sig: 'solid-sig' };

/** Role ścian dla tonu. */
export const faces = (tone: Tone = 'ink') => ({ top: TOP[tone], x: SIDE_X[tone], y: SIDE_Y[tone] });
/** Linia w danym tonie: edge / trace-hi / edge-sig. */
export const lineRole = (tone: Tone = 'ink'): Role => LINE[tone];
/** Pełne wypełnienie w danym tonie: solid / solid-hi / solid-sig. */
export const solidRole = (tone: Tone = 'ink'): Role => SOLID[tone];
/** Ton modułu: błękit, chyba że scena spokojna. */
export const hi = (m: MotifInput): Tone => (m.calm ? 'ink' : 'hi');

/** Rola ściany wg normalnej (dominująca składowa: z → góra, x → side-r, y → side-l). */
export function faceRole(n: V3, f: Faces = 'ink'): Role {
  const ax = Math.abs(n[0]);
  const ay = Math.abs(n[1]);
  const az = Math.abs(n[2]);
  const kind = az >= ax && az >= ay ? 'top' : ax >= ay ? 'x' : 'y';
  if (typeof f === 'string') return kind === 'top' ? TOP[f] : kind === 'x' ? SIDE_X[f] : SIDE_Y[f];
  return f[kind] ?? (kind === 'top' ? 'top' : kind === 'x' ? 'side-r' : 'side-l');
}

/* ---------- ścieżki ---------- */

/** Łuk elipsy od t0 do t1 (bez M — zakłada bieżący punkt w e.at(t0)); kawałki ≤ 180°. */
export function arcSegs(e: Circ, t0: number, t1: number): { d: Seg[]; bb: V2[] } {
  const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / Math.PI - 1e-9));
  const sweep: 0 | 1 = t1 > t0 === e.ccw ? 1 : 0;
  const d: Seg[] = [];
  const bb: V2[] = [];
  for (let i = 1; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const [x, y] = e.at(t);
    d.push(['A', e.rx, e.ry, e.phi, 0, sweep, x, y]);
  }
  const m = Math.max(4, Math.ceil((Math.abs(t1 - t0) / TAU) * 32));
  for (let i = 0; i <= m; i++) bb.push(e.at(t0 + ((t1 - t0) * i) / m));
  return { d, bb };
}

const polySegs = (pts: V2[], closed: boolean): Seg[] => [
  ['M', pts[0][0], pts[0][1]],
  ...pts.slice(1).map((p): Seg => ['L', p[0], p[1]]),
  ...(closed ? [['Z'] as Seg] : []),
];

function ellSegs(e: Circ): { d: Seg[]; bb: V2[] } {
  const a = arcSegs(e, 0, TAU);
  const p = e.at(0);
  return { d: [['M', p[0], p[1]], ...a.d, ['Z']], bb: a.bb };
}

const centroid = (pts: V3[]): V3 => mul(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length);

/** Normalna Newella (kierunek zależy od obiegu wielokąta). */
function newell(pts: V3[]): V3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return [x, y, z];
}

export interface CylOpt extends ItemOpt {
  tone?: Tone;
  /** Rola płaszcza (domyślnie wg tonu: side-r / side-hi / side-sig). */
  side?: Role;
  /** Rola denka (domyślnie wg tonu: top / top-hi / top-sig). */
  cap?: Role;
  noCap?: boolean;
  /** Promień drugiego końca (stożek ścięty). */
  r1?: number;
  /** Promień otworu w widocznym denku. */
  bore?: number;
  boreRole?: Role;
}

export interface MarkOpt {
  /** Kierunek tekstu (3D, jednostkowy); domyślnie +x. */
  u?: V3;
  /** „W dół litery” (3D, jednostkowy); domyślnie +y (napis na górnej ścianie). Ściana x = const: u = [0,-1,0], v = [0,0,-1]. */
  v?: V3;
  /** Wysokość pisma (jedn. sceny), domyślnie 8. */
  size?: number;
  /** Największa długość napisu (jedn. sceny), domyślnie 80. */
  max?: number;
}

export class Sketch {
  items: Item[] = [];
  labels: LabelReq[] = [];
  marks: Mark[] = [];
  private outN = 0;
  private dashN = 0;

  /** Niski poziom: odcinki rysunku + punkty do kadrowania. */
  add(g: number, role: Role, d: Seg[], bb: V2[], opt: ItemOpt = {}) {
    if (!d.length) return;
    const it: Item = { g, role, d, bb };
    if (opt.stretch) it.stretch = true;
    if (opt.dash ?? this.dashN > 0) it.dash = true;
    if (opt.eo) it.eo = true;
    if (opt.nobox) it.nobox = true;
    if (opt.out ?? this.outN > 0) it.out = true;
    this.items.push(it);
  }
  /** Wszystko narysowane w fn (geometria, napisy, etykiety) to część „poza ochroną” — odsuwa się w bok. */
  out(fn: () => void) {
    this.outN++;
    try {
      fn();
    } finally {
      this.outN--;
    }
  }
  /** Wszystko narysowane w fn ma obrys przerywany (część warunkowa). */
  dashed(fn: () => void) {
    this.dashN++;
    try {
      fn();
    } finally {
      this.dashN--;
    }
  }

  poly(g: number, role: Role, pts: V3[], closed = true, opt?: ItemOpt) {
    const p = pts.map(P);
    this.add(g, role, polySegs(p, closed), p, opt);
  }
  poly2(g: number, role: Role, pts: V2[], closed = true, opt?: ItemOpt) {
    this.add(g, role, polySegs(pts, closed), pts, opt);
  }
  line(g: number, role: Role, a: V3, b: V3, opt?: ItemOpt) {
    this.poly(g, role, [a, b], false, opt);
  }
  /**
   * Linia konstrukcyjna od a długości n·G0 wzdłuż osi rozstrzelenia ('z' w górę, 'x' wzdłuż +x),
   * w grupie g: przy wejściu w widok jej koniec dochodzi do grupy g + n (CSS skaluje ją o 1 + STEP0/G0).
   */
  stretch(g: number, a: V3, n: number, role: Role = 'cl', axis: 'z' | 'x' = 'z') {
    const b: V3 = axis === 'z' ? [a[0], a[1], a[2] + n * G0] : [a[0] + n * G0, a[1], a[2]];
    this.line(g, role, a, b, { stretch: true });
  }
  /** Oś (kreska-kropka). */
  axisLine(g: number, a: V3, b: V3, opt?: ItemOpt) {
    this.line(g, 'axis', a, b, opt);
  }
  ell(g: number, role: Role, c: V3, axis: AxisName | V3, r: number, opt?: ItemOpt): Circ {
    const { u, v } = axisBasis(axis);
    const e = circ(c, u, v, r);
    const s = ellSegs(e);
    this.add(g, role, s.d, s.bb, opt);
    return e;
  }
  ring(g: number, role: Role, c: V3, axis: AxisName | V3, r0: number, r1: number, opt?: ItemOpt) {
    const { u, v } = axisBasis(axis);
    const a = ellSegs(circ(c, u, v, r1));
    const b = ellSegs(circ(c, u, v, r0));
    this.add(g, role, [...a.d, ...b.d], a.bb, { ...opt, eo: true });
  }
  arc(g: number, role: Role, c: V3, axis: AxisName | V3, r: number, t0: number, t1: number, opt?: ItemOpt): Circ {
    const { u, v } = axisBasis(axis);
    const e = circ(c, u, v, r);
    const p = e.at(t0);
    const a = arcSegs(e, t0, t1);
    this.add(g, role, [['M', p[0], p[1]], ...a.d], a.bb, opt);
    return e;
  }
  /** Wycinek pierścienia r0…r1 między kątami t0…t1 (r0 = 0: wycinek koła). */
  sector(g: number, role: Role, c: V3, axis: AxisName | V3, r0: number, r1: number, t0: number, t1: number, opt?: ItemOpt) {
    const { u, v } = axisBasis(axis);
    const eo = circ(c, u, v, r1);
    const p0 = eo.at(t0);
    const outer = arcSegs(eo, t0, t1);
    const d: Seg[] = [['M', p0[0], p0[1]], ...outer.d];
    const bb = [...outer.bb];
    if (r0 > 0) {
      const ei = circ(c, u, v, r0);
      const q = ei.at(t1);
      const inner = arcSegs(ei, t1, t0);
      d.push(['L', q[0], q[1]], ...inner.d);
      bb.push(...inner.bb);
    } else {
      const C = P(c);
      d.push(['L', C[0], C[1]]);
      bb.push(C);
    }
    d.push(['Z']);
    this.add(g, role, d, bb, opt);
  }
  /** Prostopadłościan [x0, x0+w] × [y0, y0+d] × [z0, z0+h]: ściana x = x1, ściana y = y1, góra. */
  box(g: number, x0: number, y0: number, z0: number, w: number, d: number, h: number, f: Faces = 'ink', opt?: ItemOpt) {
    const x1 = x0 + w;
    const y1 = y0 + d;
    const z1 = z0 + h;
    if (h > 0) {
      this.poly(g, faceRole([1, 0, 0], f), [[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]], true, opt);
      this.poly(g, faceRole([0, 1, 0], f), [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], true, opt);
    }
    this.poly(g, faceRole([0, 0, 1], f), [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], true, opt);
  }
  /**
   * Pryzmat: płaski wielokąt pts (3D, dowolny obieg) wyciągnięty o wektor e. Ściany tylne odrzucone,
   * widoczne malowane od najdalszej (dobrze dla brył wypukłych; wklęsłe dziel na wypukłe kawałki).
   * opt.noCap — bez ściany końcowej, opt.capRole — rola ściany końcowej, opt.onlyCap — tylko ściana końcowa.
   */
  prism(g: number, pts: V3[], e: V3, f: Faces = 'ink', opt: ItemOpt & { noCap?: boolean; capRole?: Role; onlyCap?: boolean } = {}) {
    const ne = unit(newell(pts));
    const sgn = dot(ne, e) > 0 ? 1 : -1;
    const top = pts.map((p) => add(p, e));
    const faceList: { pts: V3[]; n: V3; cap?: boolean }[] = [];
    faceList.push({ pts: pts.slice().reverse(), n: mul(ne, -sgn), cap: true });
    faceList.push({ pts: top, n: mul(ne, sgn), cap: true });
    if (!opt.onlyCap)
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const c = cross(sub(b, a), ne);
        if (len(c) < 1e-9) continue;
        faceList.push({ pts: [a, b, add(b, e), add(a, e)], n: unit(c) });
      }
    const vis = faceList.filter((fc) => dot(fc.n, VIEW) > 1e-6 && !(fc.cap && opt.noCap));
    vis.sort((a, b) => dot(centroid(a.pts), VIEW) - dot(centroid(b.pts), VIEW));
    for (const fc of vis) this.poly(g, fc.cap && opt.capRole ? opt.capRole : faceRole(fc.n, f), fc.pts, true, opt);
  }
  /**
   * Walec od c0 wzdłuż osi o L (L < 0 = w przeciwną stronę), promień r (r1 na drugim końcu).
   * Rysuje płaszcz i widoczne denko (to, które patrzy na widza). Zwraca elipsy obu końców (e1 = widoczny).
   */
  cyl(g: number, axis: AxisName | V3, c0: V3, L: number, r: number, opt: CylOpt = {}) {
    const { a, u, v } = axisBasis(axis);
    let A0 = c0;
    let A1 = add(c0, mul(a, L));
    let rA = r;
    let rB = opt.r1 ?? r;
    // widoczne denko = koniec, którego normalna (na zewnątrz) patrzy na widza
    if (dot(sub(A1, A0), VIEW) < 0) {
      [A0, A1] = [A1, A0];
      [rA, rB] = [rB, rA];
    }
    const e0 = circ(A0, u, v, rA);
    const e1 = circ(A1, u, v, rB);
    const tone = opt.tone ?? 'ink';
    const Ad = sub(A1, A0);
    const Ap = dirP(Ad);
    if (Math.hypot(Ap[0], Ap[1]) > 1e-6) {
      const ts = Math.atan2(cr2(e0.V, Ap), cr2(e0.U, Ap));
      const D: V2 = [e0.at(ts)[0] - e0.C[0], e0.at(ts)[1] - e0.C[1]];
      const off = e0.at(ts + Math.PI / 2);
      const same = Math.sign(cr2(D, [off[0] - e0.C[0], off[1] - e0.C[1]])) === Math.sign(cr2(D, Ap));
      const dir = same ? 1 : -1;
      const p0 = e0.at(ts);
      const p1 = e1.at(ts);
      const arc1 = arcSegs(e1, ts, ts + dir * Math.PI);
      const p2 = e0.at(ts + dir * Math.PI);
      const arc0 = arcSegs(e0, ts + dir * Math.PI, ts + dir * TAU);
      this.add(
        g,
        opt.side ?? SIDE_X[tone],
        [['M', p0[0], p0[1]], ['L', p1[0], p1[1]], ...arc1.d, ['L', p2[0], p2[1]], ...arc0.d, ['Z']],
        [...arc1.bb, ...arc0.bb],
        opt,
      );
    }
    const visibleCap = Math.abs(dot(unit(Ad), unit(VIEW))) > 1e-3;
    if (!opt.noCap && visibleCap) {
      const s = ellSegs(e1);
      this.add(g, opt.cap ?? TOP[tone], s.d, s.bb, opt);
      if (opt.bore) {
        const b = ellSegs(circ(A1, u, v, opt.bore));
        this.add(g, opt.boreRole ?? 'bore', b.d, b.bb, opt);
      }
    }
    return { e0, e1, c1: A1 };
  }
  cylX(g: number, c0: V3, L: number, r: number, opt?: CylOpt) {
    return this.cyl(g, 'x', c0, L, r, opt);
  }
  cylY(g: number, c0: V3, L: number, r: number, opt?: CylOpt) {
    return this.cyl(g, 'y', c0, L, r, opt);
  }
  cylZ(g: number, c0: V3, L: number, r: number, opt?: CylOpt) {
    return this.cyl(g, 'z', c0, L, r, opt);
  }
  /** Tuleja: płaszcz zewnętrzny r1 + denko-pierścień r0…r1 (przezierny środek). */
  tube(g: number, axis: AxisName | V3, c0: V3, L: number, r0: number, r1: number, opt: CylOpt = {}) {
    const res = this.cyl(g, axis, c0, L, r1, { ...opt, noCap: true });
    if (!opt.noCap) {
      const { u, v } = axisBasis(axis);
      const a = ellSegs(circ(res.c1, u, v, r1));
      const b = ellSegs(circ(res.c1, u, v, r0));
      this.add(g, opt.cap ?? TOP[opt.tone ?? 'ink'], [...a.d, ...b.d], a.bb, { ...opt, eo: true });
    }
    return res;
  }
  /** Stożek pionowy: podstawa w c0 (okrąg r w płaszczyźnie XY), wierzchołek w c0 + h·z (h > 0). */
  cone(g: number, c0: V3, h: number, r: number, opt: { tone?: Tone; role?: Role; base?: boolean } & ItemOpt = {}) {
    const e = circ(c0, [1, 0, 0], [0, 1, 0], r);
    const A = P([c0[0], c0[1], c0[2] + h]);
    const f = (t: number) => {
      const p = e.at(t);
      const dp: V2 = [-e.U[0] * Math.sin(t) + e.V[0] * Math.cos(t), -e.U[1] * Math.sin(t) + e.V[1] * Math.cos(t)];
      return cr2([p[0] - A[0], p[1] - A[1]], dp);
    };
    const roots: number[] = [];
    const N = 360;
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * TAU;
      const t1 = ((i + 1) / N) * TAU;
      if (Math.sign(f(t0)) !== Math.sign(f(t1))) roots.push((t0 + t1) / 2);
    }
    const tone = opt.tone ?? 'ink';
    if (opt.base) {
      const s = ellSegs(e);
      this.add(g, 'side-l', s.d, s.bb, opt);
    }
    if (roots.length < 2) {
      const s = ellSegs(e);
      this.add(g, opt.role ?? TOP[tone], s.d, s.bb, opt);
      return;
    }
    let [ta, tb] = roots;
    const mid = e.at((ta + tb) / 2);
    if (mid[1] < e.C[1]) [ta, tb] = [tb, ta + TAU];
    const pa = e.at(ta);
    const arc = arcSegs(e, ta, tb);
    this.add(g, opt.role ?? SIDE_X[tone], [['M', A[0], A[1]], ['L', pa[0], pa[1]], ...arc.d, ['Z']], [A, ...arc.bb], opt);
  }
  /** Kula: obrys (rzut izometryczny: promień r·√1,5) + przednia połowa równika. */
  sphere(g: number, c: V3, r: number, opt: { tone?: Tone; equator?: boolean } & ItemOpt = {}) {
    const [cx, cy] = P(c);
    const R = r * Math.sqrt(1.5);
    const tone = opt.tone ?? 'ink';
    const bb: V2[] = [[cx - R, cy - R], [cx + R, cy + R]];
    this.add(g, TOP[tone], [['M', cx - R, cy], ['A', R, R, 0, 0, 1, cx + R, cy], ['A', R, R, 0, 0, 1, cx - R, cy], ['Z']], bb, opt);
    if (opt.equator !== false) {
      const e = circ(c, [1, 0, 0], [0, 1, 0], r);
      this.add(g, 'fine', [['M', cx - e.rx, cy], ['A', e.rx, e.ry, 0, 0, 0, cx + e.rx, cy]], bb, opt);
    }
  }
  /** Strzałka: trzon a → b (3D) i grot na b. hl — długość grotu, hw — szerokość (jedn. rysunku). */
  arrow(g: number, a: V3, b: V3, opt: { tone?: Tone; hl?: number; hw?: number; role?: Role; head?: Role } & ItemOpt = {}) {
    const A = P(a);
    const B = P(b);
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const l = Math.hypot(dx, dy) || 1;
    const t: V2 = [dx / l, dy / l];
    const n: V2 = [-t[1], t[0]];
    const hl = opt.hl ?? 9;
    const hw = opt.hw ?? 6.5;
    const base: V2 = [B[0] - t[0] * hl, B[1] - t[1] * hl];
    const tone = opt.tone ?? 'ink';
    this.poly2(g, opt.role ?? LINE[tone], [A, base], false, opt);
    this.poly2(
      g,
      opt.head ?? SOLID[tone],
      [B, [base[0] + (n[0] * hw) / 2, base[1] + (n[1] * hw) / 2], [base[0] - (n[0] * hw) / 2, base[1] - (n[1] * hw) / 2]],
      true,
      opt,
    );
  }
  /** Kreskowanie równoległoboku (o, o+ua, o+ua+ub, o+ub) liniami co `step` — tylko w przekrojach. */
  hatch(g: number, o: V3, ua: V3, ub: V3, step: number, role: Role = 'hatch', opt?: ItemOpt) {
    const La = len(ua);
    const Lb = len(ub);
    for (let c = step; c < La + Lb; c += step) {
      const p0 = Math.max(0, c - Lb);
      const p1 = Math.min(La, c);
      if (p1 - p0 < 0.5) continue;
      const q0 = add(o, add(mul(ua, p0 / La), mul(ub, (c - p0) / Lb)));
      const q1 = add(o, add(mul(ua, p1 / La), mul(ub, (c - p1) / Lb)));
      this.line(g, role, q0, q1, opt);
    }
  }
  /** Ściana z otworami: kilka pętli w jednej ścieżce (evenodd). */
  loops(g: number, role: Role, loops: V3[][], opt?: ItemOpt) {
    const d: Seg[] = [];
    const bb: V2[] = [];
    for (const l of loops) {
      const p = l.map(P);
      d.push(...polySegs(p, true));
      bb.push(...p);
    }
    this.add(g, role, d, bb, { ...opt, eo: true });
  }
  /**
   * Wnęka w poziomej ścianie: hole — obrys wnęki (3D, na poziomie ściany), depth — głębokość;
   * face — obrys ściany (wtedy rysuje ścianę z otworem na wierzchu), null — tylko krawędź otworu.
   * opt.inside(zFloor) — zawartość wnęki (rysowana po dnie i ściankach, przed ścianą).
   */
  pocket(g: number, face: V3[] | null, hole: V3[], depth: number, opt: { floor?: Role; top?: Role; inside?: (z: number) => void } & ItemOpt = {}) {
    const down = (p: V3): V3 => [p[0], p[1], p[2] - depth];
    this.poly(g, opt.floor ?? 'bore', hole.map(down), true, opt);
    let ar = 0;
    for (let i = 0; i < hole.length; i++) {
      const p = hole[i];
      const q = hole[(i + 1) % hole.length];
      ar += p[0] * q[1] - q[0] * p[1];
    }
    for (let i = 0; i < hole.length; i++) {
      const a = hole[i];
      const b = hole[(i + 1) % hole.length];
      let n: V3 = [b[1] - a[1], -(b[0] - a[0]), 0];
      if (ar > 0) n = [-n[0], -n[1], 0];
      if (dot(n, VIEW) <= 1e-6) continue;
      this.poly(g, Math.abs(n[0]) >= Math.abs(n[1]) ? 'side-r' : 'side-l', [a, b, down(b), down(a)], true, opt);
    }
    opt.inside?.(hole[0][2] - depth);
    if (face) this.loops(g, opt.top ?? 'top', [face, hole], opt);
    else this.poly(g, 'edge', hole, true, opt);
  }
  /**
   * Napis na płaszczyźnie (tabliczka). Domyślnie górna ściana, tekst wzdłuż +x. opt.plate — obrys tabliczki (3D):
   * render rysuje go tylko razem z napisem (w kadrze, gdzie napis miałby < MIN_MARK px, znika cała tabliczka).
   */
  mark(g: number, text: string | undefined, at: V3, opt: MarkOpt & { plate?: V3[] } = {}) {
    if (!text) return;
    this.marks.push({
      text,
      at: P(at),
      u: dirP(opt.u ?? [1, 0, 0]),
      v: dirP(opt.v ?? [0, 1, 0]),
      size: opt.size ?? 8,
      max: opt.max ?? 80,
      g,
      ...(this.outN > 0 ? { out: true } : {}),
      ...(opt.plate ? { plate: opt.plate.map(P) } : {}),
    });
  }
  /**
   * Etykieta z odnośnikiem. Czerwona zawsze trafia do prawej kolumny (render). wrap — najdłuższy wiersz w znakach
   * (węższa kolumna, gdy rysunek potrzebuje szerokości kadru; domyślnie wg kadru).
   */
  label(text: string | undefined, at: At, side: 'r' | 'l' = 'r', g = 0, tone: Tone = 'ink', wrap?: number) {
    if (!text) return;
    this.labels.push({
      text,
      at: at.length === 3 ? P(at as V3) : (at as V2),
      side,
      g,
      tone,
      ...(this.outN > 0 ? { out: true } : {}),
      ...(wrap ? { wrap } : {}),
    });
  }
  scene(opt: { axis?: 'z' | 'x'; outDir?: 'x' | '-x' | 'y' | '-y'; calm?: boolean; k?: Partial<Record<FrameKind, number>>; zoom?: number } = {}): Scene {
    return { items: this.items, labels: this.labels, marks: this.marks, ...opt };
  }
}

/**
 * Punkt elipsy (okręgu z s.ell / s.cyl → e1) najdalej w kierunku dir na rysunku, np. [1, -1] — prawy górny skraj
 * obrzeża tarczy (kotwica etykiety), [1, 0] — prawy skraj. Zwraca punkt rysunku (V2) — s.label go przyjmie.
 */
export function ellPoint(e: Circ, dir: V2): V2 {
  const t = Math.atan2(e.V[0] * dir[0] + e.V[1] * dir[1], e.U[0] * dir[0] + e.U[1] * dir[1]);
  return e.at(t);
}

/* ---------- kształty złożone ---------- */

/** Punkty wielokąta foremnego / okręgu w płaszczyźnie ⟂ osi (do pryzmatów: nakrętki, tarcze). */
export function circlePts(c: V3, axis: AxisName | V3, r: number, n: number, phaseDeg = 0): V3[] {
  const { u, v } = axisBasis(axis);
  return Array.from({ length: n }, (_, i) => {
    const t = deg(phaseDeg) + (TAU * i) / n;
    return add(c, add(mul(u, r * Math.cos(t)), mul(v, r * Math.sin(t))));
  });
}

export interface PlateOpt {
  x0: number;
  y0: number;
  w: number;
  d: number;
  /** Grubość (domyślnie 6); górna ściana w z = z0 + h. */
  h?: number;
  z0?: number;
  /** Obrys ochrony [x0, y0, x1, y1] na górnej ścianie; domyślnie wcięty o 10; null — bez obrysu. */
  protect?: readonly [number, number, number, number] | null;
  /** Odstęp znaczników na przednich krawędziach (domyślnie 26); false — bez znaczników. */
  ticks?: number | false;
  g?: number;
}

/**
 * Wspólna płyta bazowa: cienka płyta, przerywany obrys ochrony (rzeczy objęte ochroną stoją w środku,
 * czerwona część „poza ochroną” — poza nim) i znaczniki na dwóch przednich krawędziach. Nic więcej.
 */
export function plate(s: Sketch, o: PlateOpt): { zt: number; x1: number; y1: number; protect: readonly [number, number, number, number] | null } {
  const h = o.h ?? 6;
  const z0 = o.z0 ?? 0;
  const g = o.g ?? 0;
  const x1 = o.x0 + o.w;
  const y1 = o.y0 + o.d;
  const zt = z0 + h;
  s.box(g, o.x0, o.y0, z0, o.w, o.d, h);
  const pr = o.protect === undefined ? ([o.x0 + 10, o.y0 + 10, x1 - 10, y1 - 10] as const) : o.protect;
  if (pr) s.poly(g, 'fine-d', [[pr[0], pr[1], zt], [pr[2], pr[1], zt], [pr[2], pr[3], zt], [pr[0], pr[3], zt]]);
  const step = o.ticks === undefined ? 26 : o.ticks;
  if (step) {
    const tl = 3.5;
    for (let x = o.x0 + step; x < x1 - step / 2; x += step) s.line(g, 'fine', [x, y1, zt], [x, y1 - tl, zt]);
    for (let y = o.y0 + step; y < y1 - step / 2; y += step) s.line(g, 'fine', [x1, y, zt], [x1 - tl, y, zt]);
  }
  return { zt, x1, y1, protect: pr };
}

export interface GearOpt {
  /** Liczba zębów. */
  teeth: number;
  /** Moduł (średnica podziałowa = m·teeth). */
  m: number;
  /** Grubość koła (z). */
  thk: number;
  tone?: Tone;
  /** Indeksy wyłamanych zębów. */
  missing?: number[];
  /** Obrót (stopnie) zęba 0 od osi +x. */
  phase?: number;
  /** Promień piasty (okrąg na wierzchu); 0 — bez. */
  hub?: number;
  /** Promień otworu na wał (wnętrze piasty). */
  bore?: number;
}

export interface GearRes {
  /** Promienie: podziałowy, wierzchołków, stóp. */
  rp: number;
  ra: number;
  rr: number;
  zt: number;
  teeth: number;
  phase: number;
  /** Kąt (stopnie) środka zęba i. */
  angle: (i: number) => number;
  /** Punkt 3D na wierzchu koła: promień r, kąt (stopnie). */
  at: (r: number, a: number) => V3;
}

/**
 * Koło zębate o osi pionowej, środek podstawy c: zarys zębów na górnej ścianie + pasek walca u stóp zębów
 * (bez osobnych ścian zębów — lekko). Wyłamany ząb: missing = [i]; odłamek rysuje motyw (ząb w powietrzu).
 */
export function gear(s: Sketch, g: number, c: V3, o: GearOpt): GearRes {
  const N = o.teeth;
  const rp = (o.m * N) / 2;
  const ra = rp + o.m;
  const rr = rp - 1.2 * o.m;
  const step = TAU / N;
  const ph = deg(o.phase ?? 0);
  const miss = new Set(o.missing ?? []);
  const tone = o.tone ?? 'ink';
  const outline = (z: number): V3[] => {
    const pts: V3[] = [];
    const at = (r: number, a: number): V3 => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z];
    for (let i = 0; i < N; i++) {
      const m = ph + i * step;
      if (miss.has(i)) {
        pts.push(at(rr, m - 0.28 * step), at(rr, m + 0.28 * step));
        continue;
      }
      pts.push(at(rr, m - 0.28 * step), at(ra, m - 0.15 * step), at(ra, m + 0.15 * step), at(rr, m + 0.28 * step));
    }
    return pts;
  };
  const zt = c[2] + o.thk;
  // boki: widoczne ściany zarysu (jeden odcień → jedna ścieżka), potem wierzch z zębami (zawsze na wierzchu)
  s.prism(g, outline(c[2]), [0, 0, o.thk], { top: TOP[tone], x: SIDE_X[tone], y: SIDE_X[tone] }, { noCap: true });
  s.poly(g, TOP[tone], outline(zt));
  if (o.hub) s.ell(g, 'fine', [c[0], c[1], zt], 'z', o.hub);
  if (o.bore) s.ell(g, 'bore', [c[0], c[1], zt], 'z', o.bore);
  const phase = o.phase ?? 0;
  return {
    rp,
    ra,
    rr,
    zt,
    teeth: N,
    phase,
    angle: (i) => phase + (i * 360) / N,
    at: (r, a) => [c[0] + r * Math.cos(deg(a)), c[1] + r * Math.sin(deg(a)), zt],
  };
}

/** Faza koła b (stopnie), żeby w kierunku styku theta (od a do b, stopnie) ząb a trafił w lukę b. */
export function meshPhase(a: { teeth: number; m: number; phase: number }, b: { teeth: number; m: number }, theta: number): number {
  const stA = 360 / a.teeth;
  const stB = 360 / b.teeth;
  let d = (((theta - a.phase) % stA) + stA) % stA;
  if (d > stA / 2) d -= stA;
  const rpA = (a.m * a.teeth) / 2;
  const rpB = (b.m * b.teeth) / 2;
  return theta + 180 - (d * rpA) / rpB + stB / 2;
}

/** Indeks zęba najbliższego kierunkowi a (stopnie). */
export function toothAt(q: { teeth: number; phase: number }, a: number): number {
  const st = 360 / q.teeth;
  return ((Math.round((a - q.phase) / st) % q.teeth) + q.teeth) % q.teeth;
}

export interface IbeamOpt {
  /** Początek profilu w y i szerokość półek. */
  y0: number;
  w: number;
  /** Spód i wysokość profilu. */
  z0: number;
  h: number;
  /** Grubość półek (domyślnie 3,5) i środnika (domyślnie 5). */
  tf?: number;
  tw?: number;
  tone?: Tone;
}

/** Dwuteownik wzdłuż x od x0 do x1; czoło przekroju (profil I) na x = x1 — z przodu po prawej. */
export function ibeam(s: Sketch, g: number, x0: number, x1: number, o: IbeamOpt) {
  const tf = o.tf ?? 3.5;
  const tw = o.tw ?? 5;
  const f = o.tone ?? 'ink';
  const L = x1 - x0;
  const yc = o.y0 + o.w / 2;
  const zT = o.z0 + o.h;
  s.box(g, x0, o.y0, o.z0, L, o.w, tf, f);
  s.box(g, x0, yc - tw / 2, o.z0 + tf, L, tw, o.h - 2 * tf, f);
  s.box(g, x0, o.y0, zT - tf, L, o.w, tf, f);
  const yb = o.y0 + o.w;
  const I: [number, number][] = [
    [o.y0, o.z0], [yb, o.z0], [yb, o.z0 + tf], [yc + tw / 2, o.z0 + tf], [yc + tw / 2, zT - tf], [yb, zT - tf],
    [yb, zT], [o.y0, zT], [o.y0, zT - tf], [yc - tw / 2, zT - tf], [yc - tw / 2, o.z0 + tf], [o.y0, o.z0 + tf],
  ];
  s.poly(g, SIDE_X[f], I.map(([y, z]) => [x1, y, z] as V3));
  return { zTop: zT, yc };
}

/**
 * Sprężyna śrubowa wokół osi (axis) od c0 o długości L, promień R, zwoje turns: tył (grafit) → behind() → przód.
 * Tylko w nagłówku — miniatury bez sprężyn (budżet detali).
 */
export function spring(s: Sketch, g: number, axis: AxisName, c0: V3, L: number, R: number, turns: number, o: { tone?: Tone; behind?: () => void } = {}) {
  const a = AX[axis];
  const [u, v] = BASIS[axis];
  const N = Math.max(8, Math.round(turns * 20));
  const pts: { p: V3; front: boolean }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * turns * TAU;
    const off = add(mul(u, R * Math.cos(t)), mul(v, R * Math.sin(t)));
    pts.push({ p: add(add(c0, mul(a, (L * i) / N)), off), front: dot(off, VIEW) > 0 });
  }
  const runs: { front: boolean; pts: V3[] }[] = [];
  for (const q of pts) {
    const last = runs[runs.length - 1];
    if (last && last.front === q.front) last.pts.push(q.p);
    else runs.push({ front: q.front, pts: last ? [last.pts[last.pts.length - 1], q.p] : [q.p] });
  }
  for (const r of runs) if (!r.front) s.poly(g, 'fine', r.pts, false);
  o.behind?.();
  for (const r of runs) if (r.front) s.poly(g, LINE[o.tone ?? 'ink'], r.pts, false);
}

export interface ChairOpt {
  /** Strona oparcia: '-y' (z tyłu, domyślnie), '+y', '-x', '+x'. */
  back?: '-y' | '+y' | '-x' | '+x';
  /** Bok siedziska (domyślnie 18), wysokość siedziska (domyślnie 16), wysokość oparcia (domyślnie 16). */
  seat?: number;
  seatH?: number;
  backH?: number;
  tone?: Tone;
  /** Bez nóg (miniatura). */
  legs?: boolean;
}

/** Puste krzesło: środek siedziska (cx, cy), podłoga z. Zwraca kotwicę etykiety (prawy przedni róg siedziska). */
export function chair(s: Sketch, g: number, cx: number, cy: number, z: number, o: ChairOpt = {}): V3 {
  const S = o.seat ?? 18;
  const zS = z + (o.seatH ?? 16);
  const bh = o.backH ?? 16;
  const back = o.back ?? '-y';
  const f = o.tone ?? 'ink';
  const x0 = cx - S / 2;
  const y0 = cy - S / 2;
  const drawBack = () => {
    if (back === '-y') s.box(g, x0, y0 - 3, zS, S, 3, bh, f);
    else if (back === '+y') s.box(g, x0, y0 + S, zS - 3, S, 3, bh + 3, f);
    else if (back === '-x') s.box(g, x0 - 3, y0, zS, 3, S, bh, f);
    else s.box(g, x0 + S, y0, zS - 3, 3, S, bh + 3, f);
  };
  if (o.legs !== false)
    for (const [x, y] of [[x0 + 2, y0 + 2], [x0 + S - 2, y0 + 2], [x0 + S - 2, y0 + S - 2], [x0 + 2, y0 + S - 2]])
      s.line(g, 'edge', [x, y, z], [x, y, zS - 3]);
  const front = back === '+y' || back === '+x';
  if (!front) drawBack();
  s.box(g, x0, y0, zS - 3, S, S, 3, f);
  if (front) drawBack();
  return [x0 + S, y0 + S, zS - 1.5];
}

/** Kłódka: korpus (prostopadłościan) z kabłąkiem na ścianie face ('x' — ściana x = const, 'y' — y = const). at = narożnik spodu. */
export function padlock(s: Sketch, g: number, at: V3, o: { face?: 'x' | 'y'; w?: number; h?: number; d?: number; tone?: Tone } = {}): V3 {
  const W = o.w ?? 18;
  const H = o.h ?? 15;
  const D = o.d ?? 6;
  const tone = o.tone ?? 'ink';
  const [x, y, z] = at;
  const ro = W * 0.42;
  const ri = W * 0.26;
  if ((o.face ?? 'x') === 'x') {
    const c: V3 = [x + D / 2, y + W / 2, z + H];
    const [u, v] = BASIS.x;
    const eo = circ(c, u, v, ro);
    const ei = circ(c, u, v, ri);
    const p0 = eo.at(0);
    const outer = arcSegs(eo, 0, Math.PI);
    const q = ei.at(Math.PI);
    const inner = arcSegs(ei, Math.PI, 0);
    s.add(g, TOP[tone], [['M', p0[0], p0[1]], ...outer.d, ['L', q[0], q[1]], ...inner.d, ['Z']], [...outer.bb, ...inner.bb]);
    s.box(g, x, y, z, D, W, H, tone);
    s.ell(g, 'solid', [x + D + 0.05, y + W / 2, z + H * 0.62], 'x', 1.4);
    s.line(g, 'edge', [x + D + 0.05, y + W / 2, z + H * 0.62], [x + D + 0.05, y + W / 2, z + H * 0.32]);
    return [x + D, y + 2, z + H * 0.45];
  }
  const c: V3 = [x + W / 2, y + D / 2, z + H];
  const [u, v] = BASIS.y;
  const eo = circ(c, u, v, ro);
  const ei = circ(c, u, v, ri);
  const p0 = eo.at(0);
  const outer = arcSegs(eo, 0, Math.PI);
  const q = ei.at(Math.PI);
  const inner = arcSegs(ei, Math.PI, 0);
  s.add(g, TOP[tone], [['M', p0[0], p0[1]], ...outer.d, ['L', q[0], q[1]], ...inner.d, ['Z']], [...outer.bb, ...inner.bb]);
  s.box(g, x, y, z, W, D, H, tone);
  s.ell(g, 'solid', [x + W / 2, y + D + 0.05, z + H * 0.62], 'y', 1.4);
  s.line(g, 'edge', [x + W / 2, y + D + 0.05, z + H * 0.62], [x + W / 2, y + D + 0.05, z + H * 0.32]);
  return [x + W - 2, y + D, z + H * 0.45];
}

export interface DrawerOpt {
  /** Wnęka szafy: [x0, x0+w] × [y0, y0+d] × [z0, z0+h]; czoło na x = x0 + w. */
  x0: number;
  y0: number;
  z0: number;
  w: number;
  d: number;
  h: number;
  /** Wysunięcie wzdłuż +x (0 = zamknięta: tylko czoło). */
  pull?: number;
  tone?: Tone;
  /** Obrys przerywany (np. szuflada „ocena indywidualna”). */
  dashed?: boolean;
  /** Uchwyt i ramka na etykietę na czole (domyślnie tak). */
  handle?: boolean;
  /** Zawartość wysuniętej szuflady (rysowana na dnie, z = poziom dna). */
  inside?: (z: number) => void;
}

/** Szuflada: zamknięta — samo czoło z uchwytem i ramką; wysunięta — korytko z wnęką i czoło dalej na +x. */
export function drawerBox(s: Sketch, g: number, o: DrawerOpt): { anchor: V3; xf: number } {
  const pull = o.pull ?? 0;
  const tone = o.tone ?? 'ink';
  const xf = o.x0 + o.w + pull;
  const y1 = o.y0 + o.d;
  const z1 = o.z0 + o.h;
  const draw = () => {
    if (pull > 0) {
      s.box(g, o.x0 + o.w - 2, o.y0, o.z0, pull + 2, o.d, o.h, tone);
      const face: V3[] = [[o.x0 + o.w - 2, o.y0, z1], [xf, o.y0, z1], [xf, y1, z1], [o.x0 + o.w - 2, y1, z1]];
      const hole: V3[] = [[o.x0 + o.w, o.y0 + 2, z1], [xf - 2, o.y0 + 2, z1], [xf - 2, y1 - 2, z1], [o.x0 + o.w, y1 - 2, z1]];
      s.pocket(g, face, hole, o.h - 2, { top: TOP[tone], inside: o.inside });
    }
    const xr = xf + 0.05;
    s.poly(g, pull > 0 ? SIDE_X[tone] : 'edge', [[xr, o.y0 + 1, o.z0 + 1], [xr, y1 - 1, o.z0 + 1], [xr, y1 - 1, z1 - 1], [xr, o.y0 + 1, z1 - 1]]);
    if (o.handle !== false) {
      const zc = o.z0 + o.h * 0.6;
      const cw = Math.min(18, o.d * 0.22);
      s.poly(g, 'fine-ink', [[xr, o.y0 + o.d / 2 - cw / 2, zc - 2], [xr, o.y0 + o.d / 2 + cw / 2, zc - 2], [xr, o.y0 + o.d / 2 + cw / 2, zc + 2], [xr, o.y0 + o.d / 2 - cw / 2, zc + 2]]);
      for (const y of [o.y0 + o.d * 0.18, y1 - o.d * 0.18]) s.arc(g, 'edge', [xr, y, zc - 1], 'x', Math.min(3.6, o.h * 0.28), Math.PI, TAU);
    }
  };
  if (o.dashed) s.dashed(draw);
  else draw();
  return { anchor: [xf, o.y0 + o.d * 0.15, o.z0 + o.h / 2], xf };
}

/** Tabliczka znamionowa z napisem: face 'top' (na górnej ścianie), 'x' (ściana x = at.x), 'y' (ściana y = at.y). at = środek. */
export function nameplate(s: Sketch, g: number, text: string | undefined, at: V3, o: { face?: 'top' | 'x' | 'y'; w?: number; h?: number; size?: number } = {}) {
  if (!text) return;
  const face = o.face ?? 'top';
  const w = o.w ?? Math.max(24, text.length * 6.2 + 8);
  const h = o.h ?? 11;
  const [x, y, z] = at;
  const size = o.size ?? Math.min(7.5, h * 0.62);
  if (face === 'top') {
    const plate: V3[] = [[x - w / 2, y - h / 2, z], [x + w / 2, y - h / 2, z], [x + w / 2, y + h / 2, z], [x - w / 2, y + h / 2, z]];
    s.mark(g, text, at, { size, max: w - 5, plate });
  } else if (face === 'x') {
    const plate: V3[] = [[x, y + w / 2, z - h / 2], [x, y - w / 2, z - h / 2], [x, y - w / 2, z + h / 2], [x, y + w / 2, z + h / 2]];
    s.mark(g, text, at, { u: [0, -1, 0], v: [0, 0, -1], size, max: w - 5, plate });
  } else {
    const plate: V3[] = [[x - w / 2, y, z - h / 2], [x + w / 2, y, z - h / 2], [x + w / 2, y, z + h / 2], [x - w / 2, y, z + h / 2]];
    s.mark(g, text, at, { u: [1, 0, 0], v: [0, 0, -1], size, max: w - 5, plate });
  }
}

/** Rysa: zygzak od a do b (n załamań, amplituda amp w płaszczyźnie ⟂ do odcinka i do z, albo wzdłuż z dla poziomych). */
export function crack(s: Sketch, g: number, a: V3, b: V3, o: { n?: number; amp?: number; role?: Role; side?: V3 } = {}) {
  const n = o.n ?? 5;
  const amp = o.amp ?? 2.2;
  const d = sub(b, a);
  let side = o.side ?? cross(unit(d), [0, 0, 1]);
  if (len(side) < 1e-6) side = [1, 0, 0];
  side = unit(side);
  const pts: V3[] = [a];
  for (let i = 1; i < n; i++) pts.push(add(add(a, mul(d, i / n)), mul(side, (i % 2 ? 1 : -1) * amp)));
  pts.push(b);
  s.poly(g, o.role ?? 'edge', pts, false);
}

/** Ton slotu: błękit tylko dla części, która niesie podpisany moduł (w spokojnej scenie zawsze tusz). */
export const slotTone = (m: MotifInput, label: string | undefined): Tone => (label && !m.calm ? 'hi' : 'ink');

/**
 * Podział budżetu etykiet kadru ze slotami: czerwona zawsze, wloty (najwyżej `inputs`, domyślnie połowa reszty),
 * potem moduły w kolejności `order` (indeksy slotów; domyślnie 0, 1, 2 …). Zwraca podpisy w slotach
 * (undefined = slot bez podpisu w tym kadrze).
 */
export function budget(m: MotifInput, o: { inputs?: number; order?: number[] } = {}): { fault?: string; inputs: string[]; slots: (string | undefined)[] } {
  if (m.calm) return { inputs: [], slots: [] };
  let n = m.maxLabels;
  const fault = m.fault && n > 0 ? m.fault : undefined;
  if (fault) n--;
  const nIn = Math.min(m.inputs.length, o.inputs ?? Math.ceil(n / 2), n);
  const inputs = m.inputs.slice(0, nIn);
  n -= nIn;
  const slots: (string | undefined)[] = [];
  for (const i of o.order ?? m.labels.map((_, j) => j)) {
    if (n <= 0) break;
    if (m.labels[i]) {
      slots[i] = m.labels[i];
      n--;
    }
  }
  return { fault, inputs, slots };
}

/**
 * Budżet etykiet kadru (m.maxLabels: t 3, w/n 4 — razem z wlotami i czerwoną):
 * najpierw czerwona (fault), potem wloty (najwyżej `inputs`, domyślnie połowa reszty), potem moduły.
 */
export function take(m: MotifInput, o: { inputs?: number } = {}): { fault?: string; labels: string[]; inputs: string[] } {
  if (m.calm) return { labels: [], inputs: [] };
  let n = m.maxLabels;
  const fault = m.fault && n > 0 ? m.fault : undefined;
  if (fault) n--;
  const wantIn = Math.min(m.inputs.length, o.inputs ?? Math.ceil(n / 2));
  const nIn = Math.min(wantIn, n);
  const inputs = m.inputs.slice(0, nIn);
  n -= nIn;
  const labels = m.labels.slice(0, n);
  return { fault, labels, inputs };
}
