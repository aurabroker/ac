/**
 * Kadrowanie i rysowanie scen izometrycznych (motywy: src/lib/iso/motifs/*.ts):
 *   renderInline — SVG w HTML nagłówka (klasy .i-<rola> z src/styles/iso.css, tekst <text> w Plex Mono strony);
 *                  geometria w jednostkach sceny pod jedną macierzą skali, więc ruch w CSS (g·STEP0, OUT0)
 *                  jest w jednostkach sceny i nie zależy od skali kadru;
 *   renderFile   — samodzielny plik SVG miniatury 360×190 (atrybuty prezentacji, etykiety jako kontury znaków).
 * Kadry stałe: „w” 560×340 i „n” 330×250 (nagłówek szeroki i wąski), „t” 360×190 (miniatura, bez ruchu).
 * Skala: dopasowanie do kadru (miniatura: obiekt ~66% szerokości), Scene.k może ją ustalić (nigdy powyżej
 * dopasowania). Etykiety: prawa kolumna, lewa dla wlotów; czerwona zawsze po prawej; najwyżej FRAMES.maxLabels
 * (razem z wlotami i czerwoną). Miejsce na rozsunięcie (w górę, wzdłuż x, odsunięcie „out”) jest zarezerwowane,
 * więc ani rysunek, ani podpisy nie wychodzą poza kadr w stanie otwartym.
 * Korzeń obu SVG ma data-motif="motyw:wariant" — czyta go scripts/validate-iso.mjs (siatki kart, brak procesora).
 * Kontrola w buildzie (błąd zamiast cichego obcięcia): podpis dłuższy niż 3 wiersze, podpis poza kadrem po dopasowaniu
 * skali, linia konstrukcyjna `stretch` nie wzdłuż osi rozstrzelenia albo nie o wielokrotność G0.
 * Tabliczka znamionowa znika w kadrze, w którym jej napis miałby mniej niż MIN_MARK px (zamiast nieczytelnych „znaczków”).
 */
import { C30, G0, OUT0, S30, STEP0, fx, type V2 } from './geom.ts';
import type { DescInput, FrameKind, Item, LabelReq, Mark, MotifId, Role, Scene, Seg, Tone } from './scene.ts';
import { MOTIFS, describeMotif } from './motifs/index.ts';
import { glyphs, GLYPH_ADVANCE } from './glyphs.ts';

/** Najmniejsza wysokość napisu tabliczki w kadrze (px kadru); mniejszy napis — bez tabliczki w tym kadrze. */
export const MIN_MARK = 7;

export interface IsoSpec {
  motif: MotifId;
  variant: string;
  /** Podpisy modułów (wersalikami) w kolejności slotów motywu. */
  labels: string[];
  /** Wloty — lewa kolumna (rurociąg). */
  inputs: string[];
  /** Tabliczka znamionowa. */
  plate?: string;
  /** Czerwony podpis (konkretne wyłączenie). */
  fault?: string;
  /** Spokojna scena (strony prawne). */
  calm: boolean;
  /** Nazwa dostępna rysunku (po polsku). */
  title: string;
  /**
   * Dane opisu dostępnego (desc, po polsku; teksty w pisowni źródła). Opis powstaje osobno dla każdego kadru
   * nagłówka i wymienia tylko te podpisy, które ten kadr naprawdę pokazuje.
   */
  about: DescInput;
}

interface Frame {
  W: number;
  H: number;
  /** Największa skala. */
  kmax: number;
  /** Miniatura: obiekt zajmuje najwyżej taki ułamek szerokości kadru. */
  fill?: number;
  fs: number;
  lh: number;
  /** Odstęp liter (em). */
  ls: number;
  /** Znaki w wierszu etykiety: prawa i lewa kolumna. */
  maxR: number;
  maxL: number;
  pad: number;
  gap: number;
  /** Etykiet razem (z wlotami i czerwoną). */
  maxLabels: number;
  /** Ruch przy wejściu w widok (nagłówek). */
  motion: boolean;
}

export const FRAMES: Record<FrameKind, Frame> = {
  w: { W: 560, H: 340, kmax: 1, fs: 11, lh: 14, ls: 0.06, maxR: 26, maxL: 13, pad: 12, gap: 22, maxLabels: 4, motion: true },
  n: { W: 330, H: 250, kmax: 0.8, fs: 10, lh: 12.5, ls: 0.04, maxR: 16, maxL: 10, pad: 6, gap: 12, maxLabels: 4, motion: true },
  t: { W: 360, H: 190, kmax: 0.75, fill: 0.66, fs: 9.5, lh: 11.5, ls: 0.05, maxR: 17, maxL: 11, pad: 14, gap: 14, maxLabels: 3, motion: false },
};

/** Kierunek odsunięcia części „out” na rysunku (jednostki sceny). */
const OUT_V: Record<NonNullable<Scene['outDir']>, V2> = {
  x: [C30 * OUT0, S30 * OUT0],
  '-x': [-C30 * OUT0, -S30 * OUT0],
  y: [-C30 * OUT0, S30 * OUT0],
  '-y': [C30 * OUT0, -S30 * OUT0],
};

/** Spokojna scena: błękit i czerwień → tusz. */
const CALM: Partial<Record<Role, Role>> = {
  'top-hi': 'top',
  'side-hi': 'side-r',
  'top-sig': 'top',
  'side-sig': 'side-r',
  'solid-hi': 'solid',
  'solid-sig': 'solid',
  'trace-hi': 'edge',
  'edge-sig': 'edge',
  fault: 'fine-d',
  proj: 'fine-d',
  'hatch-sig': 'hatch',
};

/* ---------- scena ---------- */

export function sceneFor(spec: IsoSpec, kind: FrameKind): Scene {
  const f = FRAMES[kind];
  const mod = MOTIFS[spec.motif];
  if (!mod) throw new Error(`iso: nieznany motyw „${spec.motif}”`);
  const scene = mod.build({
    variant: spec.variant,
    labels: spec.calm ? [] : spec.labels,
    inputs: spec.calm ? [] : spec.inputs,
    fault: spec.calm ? undefined : spec.fault,
    plate: spec.calm ? undefined : spec.plate,
    calm: spec.calm,
    frame: kind,
    thumb: kind === 't',
    maxLabels: f.maxLabels,
  });
  if (!scene.items.length) throw new Error(`iso: motyw ${spec.motif}:${spec.variant} nie narysował nic`);
  checkStretch(scene, `${spec.motif}:${spec.variant}`);
  return scene;
}

/* ---------- układ etykiet ---------- */

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  // jednoznakowe spójniki nie zostają na końcu wiersza
  for (let i = 0; i < out.length - 1; i++) {
    const m = /^(.*) (\S)$/.exec(out[i]);
    if (m && m[1]) {
      out[i] = m[1];
      out[i + 1] = `${m[2]} ${out[i + 1]}`;
    }
  }
  // bez sierot: krótkie ostatnie słowo („AI”) schodzi razem z poprzednim
  const n = out.length;
  if (n > 1 && out[n - 1].length <= 3) {
    const m = /^(.*) (\S+)$/.exec(out[n - 2]);
    if (m && m[1]) {
      out[n - 2] = m[1];
      out[n - 1] = `${m[2]} ${out[n - 1]}`;
    }
  }
  if (out.length > 3) throw new Error(`iso: podpis „${text}” nie mieści się w 3 wierszach po ${max} znaków — skróć go`);
  return out;
}

interface Row {
  lines: string[];
  side: 'r' | 'l';
  tone: Tone;
  g: number;
  out: boolean;
  /** Kotwica (kadr) i środek pierwszego wiersza tekstu (kadr). */
  ax: number;
  ay: number;
  cy: number;
  colX: number;
  /** Przesunięcie w stanie otwartym (kadr). */
  dx: number;
  dy: number;
}

export interface Layout {
  W: number;
  H: number;
  k: number;
  ox: number;
  oy: number;
  items: Item[];
  marks: Mark[];
  rows: Row[];
  frame: Frame;
  scene: Scene;
  calm: boolean;
  motion: boolean;
}

/** Etykiety w budżecie kadru: czerwona zawsze (po prawej), potem pozostałe w kolejności motywu. */
function pickLabels(labels: LabelReq[], max: number): LabelReq[] {
  const sig = labels.filter((l) => l.tone === 'sig').slice(0, 1).map((l) => ({ ...l, side: 'r' as const }));
  const rest = labels.filter((l) => l.tone !== 'sig').slice(0, Math.max(0, max - sig.length));
  return [...rest, ...sig];
}

export function layout(spec: IsoSpec, kind: FrameKind): Layout {
  const f = FRAMES[kind];
  const scene = sceneFor(spec, kind);
  const calm = spec.calm || !!scene.calm;
  const motion = f.motion && !calm;
  const step: V2 = scene.axis === 'x' ? [C30 * STEP0, S30 * STEP0] : [0, -STEP0];
  const ov = OUT_V[scene.outDir ?? 'x'];
  const disp = (g: number, out?: boolean): V2 =>
    motion ? [g * step[0] + (out ? ov[0] : 0), g * step[1] + (out ? ov[1] : 0)] : [0, 0];

  // kadrowanie: obrys w stanie zamkniętym i otwartym (jednostki rysunku)
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const it of scene.items) {
    if (it.nobox) continue;
    const [dx, dy] = disp(it.g, it.out);
    for (const [x, y] of it.bb)
      for (const [px, py] of dx || dy ? [[x, y], [x + dx, y + dy]] : [[x, y]]) {
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
      }
  }
  const bw = Math.max(1, x1 - x0);
  const bh = Math.max(1, y1 - y0);

  const reqs = calm ? [] : pickLabels(scene.labels, f.maxLabels);
  const cw = f.fs * (0.6 + f.ls);
  const lines = reqs.map((l) => wrap(l.text, l.wrap ?? (l.side === 'r' ? f.maxR : f.maxL)));
  const textW = (ls: string[]) => Math.max(...ls.map((t) => t.length * cw - f.ls * f.fs));
  const colW = (side: 'r' | 'l') => Math.max(0, ...reqs.map((l, i) => (l.side === side ? textW(lines[i]) : 0)));
  const wR = colW('r');
  const wL = colW('l');
  // zapas na przesunięcie etykiet w stanie otwartym (jednostki sceny → ×k), na zewnątrz kolumn
  const resR = Math.max(0, ...reqs.filter((l) => l.side === 'r').map((l) => disp(l.g, l.out)[0]));
  const resL = Math.max(0, ...reqs.filter((l) => l.side === 'l').map((l) => -disp(l.g, l.out)[0]));
  const sideW = (wR ? wR + f.gap : 0) + (wL ? wL + f.gap : 0);
  const W = f.W;
  const H = f.H;

  const place = (kCap: number): Layout => {
    let k = Math.min(
      kCap,
      f.kmax * (scene.zoom ?? 1),
      scene.k?.[kind] ?? Infinity,
      f.fill ? (f.fill * f.W) / bw : Infinity,
      (f.H - 2 * f.pad) / bh,
      (f.W - 2 * f.pad - sideW) / (bw + resR + resL),
    );
    k = Math.max(0.05, Math.floor(k * 1000) / 1000);
    const total = sideW + (bw + resR + resL) * k;
    const left = (W - total) / 2;
    const ox = left + resL * k + (wL ? wL + f.gap : 0) - x0 * k;
    const oy = (H - bh * k) / 2 - y0 * k;
    const drawL = ox + x0 * k;
    const drawR = ox + x1 * k;
    const rows: Row[] = reqs.map((l, i) => {
      const [dx, dy] = disp(l.g, l.out);
      return {
        lines: lines[i],
        side: l.side,
        tone: l.tone,
        g: l.g,
        out: !!l.out,
        ax: ox + l.at[0] * k,
        ay: oy + l.at[1] * k,
        cy: 0,
        colX: l.side === 'r' ? drawR + f.gap : drawL - f.gap,
        dx: dx * k,
        dy: dy * k,
      };
    });
    for (const side of ['r', 'l'] as const) {
      const list = rows.filter((r) => r.side === side).sort((a, c) => a.ay - c.ay);
      // odstęp także w stanie otwartym (etykiety różnych grup przesuwają się o różne odcinki)
      // odstęp między podpisami = pół wiersza (wyraźnie większy niż interlinia jednego podpisu)
      const minAfter = (p: Row, r: Row) => p.cy + p.lines.length * f.lh + Math.round(f.lh * 0.5) + Math.max(0, p.dy - r.dy);
      list.forEach((r, i) => {
        r.cy = r.ay;
        if (i > 0) r.cy = Math.max(r.cy, minAfter(list[i - 1], r));
      });
      if (list.length) {
        const last = list[list.length - 1];
        const over = last.cy + Math.max(0, last.dy) + (last.lines.length - 0.4) * f.lh - (H - f.pad);
        if (over > 0) for (const r of list) r.cy -= over;
        list.forEach((r, i) => {
          const min = i === 0 ? f.pad + f.lh * 0.6 - Math.min(0, r.dy) : minAfter(list[i - 1], r);
          if (r.cy < min) r.cy = min;
        });
      }
    }
    return { W, H, k, ox, oy, items: scene.items, marks: scene.marks, rows, frame: f, scene, calm, motion };
  };

  // etykieta poza kadrem (np. długi podpis przy szerokim rysunku) → mniejsza skala, aż się zmieści
  let L = place(Infinity);
  for (let i = 0; i < 12 && clips(L).length; i++) L = place(L.k * 0.93);
  const bad = clips(L);
  if (bad.length) throw new Error(`iso: ${spec.motif}:${spec.variant} (kadr ${kind}) — ${bad.join('; ')}`);
  return L;
}

/**
 * Linie konstrukcyjne rozciągane przy rozstrzeleniu (Item.stretch, CSS .iso-cl): skala 1 + STEP0/G0 zgadza się
 * z ruchem grup tylko dla odcinka o długości n·G0 wzdłuż osi rozstrzelenia — pionowego (oś z, punkt stały na dole)
 * albo równoległego do osi x sceny (oś x, punkt stały w lewym górnym rogu obrysu = początek odcinka).
 */
function checkStretch(scene: Scene, id: string) {
  for (const it of scene.items) {
    if (!it.stretch) continue;
    const pts = it.d.filter((c) => c[0] === 'M' || c[0] === 'L') as (readonly ['M' | 'L', number, number])[];
    const fail = (why: string) => {
      throw new Error(`iso: ${id} — linia konstrukcyjna ${why}`);
    };
    if (pts.length !== 2 || it.d.length !== 2) fail('musi być jednym odcinkiem');
    const dx = pts[1][1] - pts[0][1];
    const dy = pts[1][2] - pts[0][2];
    const l = Math.hypot(dx, dy);
    if (scene.axis === 'x' ? Math.abs(dx * S30 - dy * C30) > 0.01 * l : Math.abs(dx) > 0.01 * l)
      fail(`nie biegnie wzdłuż osi rozstrzelenia (${scene.axis ?? 'z'})`);
    const n = l / G0;
    if (Math.abs(n - Math.round(n)) > 0.01 || n < 0.99) fail(`ma długość ${fx(l)} — nie wielokrotność G0 = ${G0}`);
  }
}

/** Etykiety poza ramką kadru w stanie zamkniętym i otwartym. */
function clips(L: Layout): string[] {
  const f = L.frame;
  const cw = f.fs * (0.6 + f.ls);
  const out: string[] = [];
  for (const r of L.rows) {
    const w = Math.max(...r.lines.map((t) => t.length * cw));
    const xa = r.side === 'r' ? r.colX : r.colX - w;
    const xb = xa + w;
    const ya = r.cy - 0.62 * f.fs;
    const yb = r.cy + (r.lines.length - 1) * f.lh + 0.3 * f.fs;
    for (const [dx, dy] of [[0, 0], [r.dx, r.dy]])
      if (xa + dx < 0 || xb + dx > L.W || ya + dy < 0 || yb + dy > L.H)
        out.push(`„${r.lines.join(' ')}” poza kadrem (${fx(xa + dx)}…${fx(xb + dx)} × ${fx(ya + dy)}…${fx(yb + dy)})`);
  }
  return out;
}

/** Kontrola kadru (arkusz przeglądu, testy): etykiety poza ramką po dopasowaniu skali. */
export function clipReport(spec: IsoSpec, kind: FrameKind): string[] {
  return clips(layout(spec, kind)).map((c) => `${kind}: ${c}`);
}

/* ---------- ścieżki ---------- */

type Map2 = (x: number, y: number) => V2;

function segsD(d: Seg[], map: Map2, k: number): string {
  let s = '';
  for (const c of d) {
    if (c[0] === 'Z') s += 'Z';
    else if (c[0] === 'A') {
      const [x, y] = map(c[6], c[7]);
      s += `A${fx(c[1] * k)} ${fx(c[2] * k)} ${fx(c[3])} ${c[4]} ${c[5]} ${fx(x)} ${fx(y)}`;
    } else {
      const [x, y] = map(c[1], c[2]);
      s += `${c[0]}${fx(x)} ${fx(y)}`;
    }
  }
  return s;
}

const polyD = (pts: V2[], map: Map2) =>
  pts.map((p, i) => {
    const [x, y] = map(p[0], p[1]);
    return `${i ? 'L' : 'M'}${fx(x)} ${fx(y)}`;
  }).join('') + 'Z';

function leaderD(r: Row): { d: string; tx: number } {
  const dir = r.side === 'r' ? 1 : -1;
  const tx = r.colX - dir * 5;
  const dy = r.cy - r.ay;
  if (Math.abs(dy) < 0.6) return { d: `M${fx(r.ax)} ${fx(r.ay)}H${fx(tx)}`, tx };
  let ex = r.ax + dir * Math.abs(dy) * 1.2;
  if (dir * (ex - (tx - dir * 8)) > 0) ex = tx - dir * 8;
  return { d: `M${fx(r.ax)} ${fx(r.ay)}L${fx(ex)} ${fx(r.cy)}H${fx(tx)}`, tx };
}

interface Part {
  role: Role;
  dash: boolean;
  eo: boolean;
  stretch: boolean;
  items: Item[];
}
/** Przebiegi (grupa, „out”) w kolejności malowania; kolejne elementy tej samej roli łączone w jedną ścieżkę. */
function runs(items: Item[], calm: boolean) {
  const out: { g: number; out: boolean; parts: Part[] }[] = [];
  for (const it of items) {
    const role = (calm && CALM[it.role]) || it.role;
    let grp = out[out.length - 1];
    if (!grp || grp.g !== it.g || grp.out !== !!it.out) out.push((grp = { g: it.g, out: !!it.out, parts: [] }));
    const last = grp.parts[grp.parts.length - 1];
    if (last && last.role === role && last.dash === !!it.dash && last.eo === !!it.eo && !it.stretch && !last.stretch) last.items.push(it);
    else grp.parts.push({ role, dash: !!it.dash, eo: !!it.eo, stretch: !!it.stretch, items: [it] });
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n: number) => String(+n.toFixed(4));

/** Rozmiar napisu na tabliczce (zmniejszony, gdy za długi). */
function markSize(m: Mark): number {
  const width = m.text.length * (0.6 + 0.08) * m.size;
  return width > m.max ? (m.size * m.max) / width : m.size;
}

/** Tabliczki widoczne w kadrze: napis ma co najmniej MIN_MARK px (skala kadru × rozmiar napisu). */
const shownMarks = (L: Layout) => L.marks.filter((m) => markSize(m) * L.k >= MIN_MARK - 1e-6);

/** Opis dostępny kadru: tylko podpisy, które ten kadr pokazuje (sloty bez podpisu — pusty napis). */
function descFor(spec: IsoSpec, L: Layout): string {
  const a = spec.about;
  if (a.calm) return describeMotif(spec.motif, a);
  const up = (t: string) => t.toLocaleUpperCase('pl');
  const shown = new Set(L.rows.map((r) => r.lines.join(' ')));
  const has = (t?: string) => !!t && shown.has(up(t));
  return describeMotif(spec.motif, {
    ...a,
    labels: a.labels.map((l) => (has(l) ? l : '')),
    inputs: a.inputs.filter(has),
    fault: has(a.fault) ? a.fault : undefined,
  });
}

/* ---------- SVG w HTML ---------- */

export function renderInline(spec: IsoSpec, kind: 'w' | 'n', uid: string): string {
  const L = layout(spec, kind);
  const f = L.frame;
  const cls = ['iso-svg', `iso-svg--${kind}`];
  if (L.motion && L.scene.axis === 'x') cls.push('iso-ax-x');
  if (L.motion && L.scene.outDir && L.scene.outDir !== 'x') cls.push(`iso-od-${L.scene.outDir.replace('-', 'n')}`);
  const out: string[] = [];
  out.push(
    `<svg class="${cls.join(' ')}" viewBox="0 0 ${L.W} ${L.H}" role="img" aria-labelledby="${uid}-t" aria-describedby="${uid}-d" focusable="false" data-motif="${spec.motif}:${spec.variant}">`,
    `<title id="${uid}-t">${esc(spec.title)}</title><desc id="${uid}-d">${esc(descFor(spec, L))}</desc>`,
    `<g aria-hidden="true" transform="matrix(${num(L.k)} 0 0 ${num(L.k)} ${fx(L.ox)} ${fx(L.oy)})">`,
  );
  const id: Map2 = (x, y) => [x, y];
  const open = (g: number, o: boolean) =>
    (L.motion && g ? `<g class="iso-e${g}">` : '<g>') + (L.motion && o ? '<g class="iso-out">' : '');
  const close = (o: boolean) => (L.motion && o ? '</g></g>' : '</g>');
  for (const run of runs(L.items, L.calm)) {
    out.push(open(run.g, run.out));
    for (const p of run.parts) {
      const c = [`i-${p.role}`, ...(p.dash ? ['i-d'] : []), ...(p.stretch && L.motion ? ['iso-cl'] : [])].join(' ');
      out.push(`<path class="${c}"${p.eo ? ' fill-rule="evenodd"' : ''} d="${p.items.map((it) => segsD(it.d, id, 1)).join('')}"/>`);
    }
    out.push(close(run.out));
  }
  for (const m of shownMarks(L)) {
    const size = markSize(m);
    const mat = [num(m.u[0]), num(m.u[1]), num(m.v[0]), num(m.v[1]), fx(m.at[0]), fx(m.at[1])].join(' ');
    const plate = m.plate ? `<path class="i-fine-ink" d="${polyD(m.plate, id)}"/>` : '';
    out.push(
      `${open(m.g, !!m.out)}${plate}<text class="i-m" transform="matrix(${mat})" x="0" y="${fx(size * 0.36)}" font-size="${fx(size)}" text-anchor="middle">${esc(m.text)}</text>${close(!!m.out)}`,
    );
  }
  // etykiety w jednostkach kadru: odwrotna macierz pod skalą sceny (ruch grupy nadal w jednostkach sceny)
  const inv = `matrix(${num(1 / L.k)} 0 0 ${num(1 / L.k)} ${num(-L.ox / L.k)} ${num(-L.oy / L.k)})`;
  for (const r of L.rows) {
    const { d, tx } = leaderD(r);
    const tone = r.tone === 'ink' ? '' : ` i-${r.tone}`;
    const anchor = r.side === 'l' ? ' text-anchor="end"' : '';
    const x = r.side === 'r' ? tx + 5 : tx - 5;
    const text = r.lines
      .map((t, i) => `<text class="i-t${tone}" x="${fx(x)}" y="${fx(r.cy + f.fs * 0.36 + i * f.lh)}"${anchor}>${esc(t)}</text>`)
      .join('');
    out.push(
      `${open(r.g, r.out)}<g transform="${inv}"><path class="i-ld${tone}" d="${d}"/><circle class="i-dot${tone}" cx="${fx(r.ax)}" cy="${fx(r.ay)}" r="1.7"/>${text}</g>${close(r.out)}`,
    );
  }
  out.push('</g></svg>');
  return out.join('');
}

/* ---------- samodzielny plik (miniatura) ---------- */

/** Tokeny (src/styles/tokens.css, iso.css): tusz, grafit, błękit, czerwień i odcienie ścian. */
const INK2 = '#3b424c';
const GRAPHITE = '#9aa0a8';
const BLUE = '#1f4bc2';
const WASH = '#eef3fc';
const SIG = '#cc3d0a';
const SIG_WASH = '#fdf1ec';
const SIDE_R = '#f4f6f8';
const SIDE_L = '#e7ebef';
/** Jedyny odcień boku części błękitnej i jedyny boku części czerwonej (iso.css: --iso-side-hi, --iso-side-sig). */
const SIDE_HI = '#dde6f8';
const SIDE_SIG = '#f8e1d7';

const J = 'stroke-linejoin="round" stroke-linecap="round"';
const face = (fill: string, stroke = INK2) => `fill="${fill}" stroke="${stroke}" stroke-width=".9" ${J}`;
const line = (stroke: string, w: number, dash?: string) =>
  `fill="none" stroke="${stroke}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ` ${J}`}`;
const ROLE_ATTR: Record<Role, string> = {
  top: face('#fff'),
  'side-r': face(SIDE_R),
  'side-l': face(SIDE_L),
  'top-hi': face(WASH),
  'side-hi': face(SIDE_HI),
  'top-sig': face(SIG_WASH, SIG),
  'side-sig': face(SIDE_SIG, SIG),
  bore: face(SIDE_L),
  mask: 'fill="#fff" stroke="none"',
  solid: `fill="${INK2}" stroke="${INK2}" stroke-width=".5" ${J}`,
  'solid-hi': `fill="${BLUE}" stroke="${BLUE}" stroke-width=".5" ${J}`,
  'solid-sig': `fill="${SIG}" stroke="${SIG}" stroke-width=".5" ${J}`,
  edge: line(INK2, 0.9),
  fine: line(GRAPHITE, 0.6),
  'fine-ink': line(INK2, 0.6),
  'fine-d': line(GRAPHITE, 0.6, '2 2'),
  cl: line(GRAPHITE, 0.6, '2.5 2.5'),
  axis: line(GRAPHITE, 0.6, '8 2 1.5 2'),
  proj: line(BLUE, 0.6, '2 2'),
  'trace-hi': line(BLUE, 1.1),
  'edge-sig': line(SIG, 1.2),
  fault: line(SIG, 1.2, '3 2'),
  hatch: line(GRAPHITE, 0.6),
  'hatch-sig': line(SIG, 0.6),
};
const DASH = ' stroke-dasharray="3 2.2"';
const TONE_COLOR: Record<Tone, string> = { ink: INK2, hi: BLUE, sig: SIG };
/** Kolor tekstu etykiety: błękit tylko na odnośniku, czerwień także w tekście (jedyny akcent). */
const TEXT_COLOR: Record<Tone, string> = { ink: INK2, hi: INK2, sig: SIG };

export async function renderFile(spec: IsoSpec): Promise<string> {
  const L = layout(spec, 't');
  const f = L.frame;
  const marks = shownMarks(L);
  const chars = [...L.rows.flatMap((r) => r.lines.join('')), ...marks.map((m) => m.text)].join('');
  const gl = await glyphs(chars);
  const ids = new Map<string, string>();
  const defs: string[] = [];
  for (const [ch, d] of gl) {
    if (!d) continue;
    const id = `c${ids.size.toString(36)}`;
    ids.set(ch, id);
    defs.push(`<path id="${id}" d="${d}"/>`);
  }
  const adv = GLYPH_ADVANCE + f.ls * 100;
  const word = (t: string, a: number) =>
    [...t].map((ch, i) => (ids.has(ch) ? `<use href="#${ids.get(ch)}" x="${fx(i * a)}"/>` : '')).join('');
  const map: Map2 = (x, y) => [L.ox + x * L.k, L.oy + y * L.k];

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.W} ${L.H}" width="${L.W}" height="${L.H}" data-motif="${spec.motif}:${spec.variant}">`,
    `<defs><pattern id="gr" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#eef1f4" stroke-width=".6"/></pattern>${defs.join('')}</defs>`,
    `<rect width="${L.W}" height="${L.H}" fill="#fff"/><rect width="${L.W}" height="${L.H}" fill="url(#gr)"/>`,
  );
  for (const run of runs(L.items, L.calm))
    for (const p of run.parts)
      out.push(
        `<path ${ROLE_ATTR[p.role]}${p.dash ? DASH : ''}${p.eo ? ' fill-rule="evenodd"' : ''} d="${p.items.map((it) => segsD(it.d, map, L.k)).join('')}"/>`,
      );
  for (const m of marks) {
    const size = markSize(m);
    if (m.plate) out.push(`<path ${ROLE_ATTR['fine-ink']} d="${polyD(m.plate, map)}"/>`);
    const [ex, ey] = map(m.at[0], m.at[1]);
    const mat = [num(m.u[0] * L.k), num(m.u[1] * L.k), num(m.v[0] * L.k), num(m.v[1] * L.k), fx(ex), fx(ey)].join(' ');
    const s = size / 100;
    const w = m.text.length * (GLYPH_ADVANCE + 8) * s - 8 * s;
    out.push(`<g fill="${INK2}" transform="matrix(${mat}) translate(${fx(-w / 2)} ${fx(size * 0.36)}) scale(${num(s)})">${word(m.text, GLYPH_ADVANCE + 8)}</g>`);
  }
  const s = f.fs / 100;
  for (const r of L.rows) {
    const { d, tx } = leaderD(r);
    const c = TONE_COLOR[r.tone];
    out.push(`<path fill="none" stroke="${c}" stroke-width=".6" d="${d}"/><circle cx="${fx(r.ax)}" cy="${fx(r.ay)}" r="1.5" fill="${c}"/>`);
    r.lines.forEach((t, i) => {
      const w = t.length * adv * s - f.ls * f.fs;
      const x = r.side === 'r' ? tx + 5 : tx - 5 - w;
      out.push(`<g fill="${TEXT_COLOR[r.tone]}" transform="translate(${fx(x)} ${fx(r.cy + f.fs * 0.36 + i * f.lh)}) scale(${num(s)})">${word(t, adv)}</g>`);
    });
  }
  out.push('</svg>');
  return out.join('');
}
