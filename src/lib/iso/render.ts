/**
 * Kadrowanie i rysowanie scen izometrycznych:
 *   renderInline — SVG w HTML (klasy CSS z src/styles/iso.css, tekst <text> w Plex Mono strony),
 *   renderFile   — samodzielny plik SVG (atrybuty prezentacji, etykiety jako kontury znaków; bez <style>).
 * Kadry: „w” szeroki i „n” wąski (rysunek w nagłówku; stała skala, więc rozsunięcie warstw w CSS jest
 * jednakowe), „t” miniatura 360×190 (skala dopasowana, bez ruchu).
 */
import { AXIS_X, AXIS_Y, STEP0, fx, iso, rng, type V2 } from './geom.ts';
import { MOTIFS, type Item, type Mark, type Motif, type Role, type Scene, type Tone } from './motifs.ts';
import { glyphs, GLYPH_ADVANCE } from './glyphs.ts';

export interface IsoSpec {
  /** Ziarno (adres strony): układ, wyróżnienia i przebieg ścieżek. */
  seed: string;
  motif: Motif;
  labels: string[];
  inputs: string[];
  chip?: string;
  fault?: string;
  calm?: boolean;
  /** Nazwa dostępna rysunku i opis (po polsku). */
  title: string;
  desc: string;
}

export type FrameKind = 'w' | 'n' | 't';

interface Frame {
  /** Stała skala kadru wg motywu (rysunek w nagłówku) — klasa .iso-k{100·k} ustawia krok rozsunięcia w CSS. */
  k?: Record<Motif, number>;
  fs: number;
  lh: number;
  /** Odstęp liter (em). */
  ls: number;
  maxR: number;
  maxL: number;
  minW: number;
  W?: number;
  H?: number;
  pad: number;
  gap: number;
  maxLabels: number;
  maxInputs: number;
}

const FRAMES: Record<FrameKind, Frame> = {
  w: { k: { stack: 0.84, qfp: 0.84, bga: 0.9, pcb: 0.84 }, fs: 11, lh: 14, ls: 0.06, maxR: 26, maxL: 13, minW: 520, pad: 12, gap: 22, maxLabels: 4, maxInputs: 2 },
  n: { k: { stack: 0.58, qfp: 0.56, bga: 0.6, pcb: 0.42 }, fs: 10, lh: 12.5, ls: 0.04, maxR: 16, maxL: 10, minW: 330, pad: 6, gap: 12, maxLabels: 4, maxInputs: 2 },
  t: { fs: 9.5, lh: 11.5, ls: 0.05, maxR: 17, maxL: 11, minW: 360, W: 360, H: 190, pad: 14, gap: 14, maxLabels: 3, maxInputs: 1 },
};

/* ---------- układ etykiet ---------- */

interface Placed {
  lines: string[];
  side: 'r' | 'l';
  tone: Tone;
  g: number;
  ax: number;
  ay: number;
  cy: number;
}

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
  return out.slice(0, 3);
}

interface Layout {
  W: number;
  H: number;
  k: number;
  map: (p: V2) => V2;
  items: Item[];
  marks: Mark[];
  labels: (Placed & { colX: number })[];
  frame: Frame;
}

function bbox(items: Item[]) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const it of items) {
    if (it.shape.t === 'poly') for (const [x, y] of it.shape.pts) add(x, y);
    else {
      add(it.shape.c[0] - it.shape.rx, it.shape.c[1] - it.shape.ry);
      add(it.shape.c[0] + it.shape.rx, it.shape.c[1] + it.shape.ry);
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

export function sceneFor(spec: IsoSpec, kind: FrameKind): Scene {
  const f = FRAMES[kind];
  return MOTIFS[spec.motif](
    {
      labels: spec.labels,
      inputs: spec.inputs,
      chip: spec.chip,
      fault: spec.fault,
      calm: spec.calm,
      maxLabels: f.maxLabels,
      maxInputs: f.maxInputs,
    },
    rng(spec.seed + '|' + spec.motif),
  );
}

function layout(spec: IsoSpec, kind: FrameKind): Layout {
  const f = FRAMES[kind];
  const scene = sceneFor(spec, kind);
  const b = bbox(scene.items);
  const cw = f.fs * (0.6 + f.ls);
  const rows: Placed[] = scene.labels.map((l) => ({
    lines: wrap(l.text, l.side === 'r' ? f.maxR : f.maxL),
    side: l.side,
    tone: l.tone,
    g: l.g,
    ax: l.at[0],
    ay: l.at[1],
    cy: 0,
  }));
  const colW = (side: 'r' | 'l') =>
    Math.max(0, ...rows.filter((r) => r.side === side).flatMap((r) => r.lines.map((t) => t.length * cw - f.ls * f.fs)));
  const wR = colW('r');
  const wL = colW('l');
  const sideW = (wR ? wR + f.gap : 0) + (wL ? wL + f.gap : 0);
  const k = f.k?.[spec.motif] ?? Math.min((f.H! - 2 * f.pad) / b.h, (f.W! - 2 * f.pad - sideW) / b.w, 0.75);
  const gmax = Math.max(0, ...scene.items.map((i) => i.g));
  const head = f.k ? gmax * STEP0 * k : 0;

  const total = sideW + b.w * k;
  const W = f.W ?? Math.max(f.minW, Math.ceil(total + 2 * f.pad));
  const left = (W - total) / 2;
  const ox = left + (wL ? wL + f.gap : 0) - b.x0 * k;
  // pionowo: najpierw rysunek od 0 (+ zapas na rozsunięcie), potem etykiety, potem przesunięcie całości
  let oy = head - b.y0 * k;
  if (f.H) oy = (f.H - b.h * k) / 2 - b.y0 * k;
  const mapY = (y: number) => oy + y * k;
  const mapX = (x: number) => ox + x * k;
  for (const r of rows) {
    r.ax = mapX(r.ax);
    r.ay = mapY(r.ay);
  }
  const drawL = mapX(b.x0);
  const drawR = mapX(b.x1);

  const placed: (Placed & { colX: number })[] = [];
  for (const side of ['r', 'l'] as const) {
    const list = rows.filter((r) => r.side === side).sort((a, c) => a.ay - c.ay);
    list.forEach((r, i) => {
      r.cy = r.ay;
      if (i > 0) {
        const p = list[i - 1];
        const min = p.cy + p.lines.length * f.lh + 3 + (f.k ? Math.max(0, r.g - p.g) * STEP0 * k : 0);
        if (r.cy < min) r.cy = min;
      }
    });
    if (f.H && list.length) {
      const last = list[list.length - 1];
      const over = last.cy + (last.lines.length - 0.5) * f.lh - (f.H - f.pad);
      if (over > 0) for (const r of list) r.cy -= over;
      for (let i = 0; i < list.length; i++) {
        const min = i === 0 ? f.pad + f.lh * 0.5 : list[i - 1].cy + list[i - 1].lines.length * f.lh + 2;
        if (list[i].cy < min) list[i].cy = min;
      }
    }
    const colX = side === 'r' ? drawR + f.gap : drawL - f.gap;
    for (const r of list) placed.push({ ...r, colX });
  }

  let H = f.H ?? 0;
  let shift = 0;
  if (!f.H) {
    const top = Math.min(0, ...placed.map((r) => r.cy - f.lh * 0.6));
    const bottom = Math.max(mapY(b.y1), ...placed.map((r) => r.cy + (r.lines.length - 0.4) * f.lh));
    shift = f.pad - top;
    H = Math.ceil(bottom - top + 2 * f.pad);
    for (const r of placed) {
      r.ay += shift;
      r.cy += shift;
    }
  }
  const map = (p: V2): V2 => [ox + p[0] * k, oy + shift + p[1] * k];
  return { W, H, k, map, items: scene.items, marks: scene.marks, labels: placed, frame: f };
}

/* ---------- ścieżki ---------- */

function shapeD(it: Item, map: (p: V2) => V2, k: number): string {
  const s = it.shape;
  if (s.t === 'poly') {
    const pts = s.pts.map(map);
    return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${fx(x)} ${fx(y)}`).join('') + (s.closed ? 'Z' : '');
  }
  const [cx, cy] = map(s.c);
  const rx = s.rx * k;
  const ry = s.ry * k;
  return `M${fx(cx - rx)} ${fx(cy)}a${fx(rx)} ${fx(ry)} 0 1 0 ${fx(2 * rx)} 0a${fx(rx)} ${fx(ry)} 0 1 0 ${fx(-2 * rx)} 0Z`;
}

function leaderD(r: Placed & { colX: number }): { d: string; tx: number } {
  const dir = r.side === 'r' ? 1 : -1;
  const tx = r.colX - dir * 5;
  const dy = r.cy - r.ay;
  if (Math.abs(dy) < 0.6) return { d: `M${fx(r.ax)} ${fx(r.ay)}H${fx(tx)}`, tx };
  let ex = r.ax + dir * Math.abs(dy) * 1.2;
  if (dir * (ex - (tx - dir * 8)) > 0) ex = tx - dir * 8;
  return { d: `M${fx(r.ax)} ${fx(r.ay)}L${fx(ex)} ${fx(r.cy)}H${fx(tx)}`, tx };
}

/** Grupy w kolejności malowania: kolejne elementy tej samej grupy i roli łączone w jedną ścieżkę. */
function runs(items: Item[]) {
  const out: { g: number; parts: { role: Role; stretch: boolean; items: Item[] }[] }[] = [];
  for (const it of items) {
    let grp = out[out.length - 1];
    if (!grp || grp.g !== it.g) out.push((grp = { g: it.g, parts: [] }));
    const last = grp.parts[grp.parts.length - 1];
    if (last && last.role === it.role && !it.stretch && !last.stretch) last.items.push(it);
    else grp.parts.push({ role: it.role, stretch: !!it.stretch, items: [it] });
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Macierz napisu leżącego na górnej ścianie: oś tekstu = oś x sceny, „w dół” tekstu = oś y sceny. */
function markMatrix(m: Mark, map: (p: V2) => V2, k: number, ls: number) {
  const [ex, ey] = map(iso(...m.at));
  const width = m.text.length * (0.6 + ls) * m.size;
  const size = width > m.max ? (m.size * m.max) / width : m.size;
  const c = (n: number) => String(+n.toFixed(4));
  return { mat: [c(AXIS_X[0] * k), c(AXIS_X[1] * k), c(AXIS_Y[0] * k), c(AXIS_Y[1] * k), fx(ex), fx(ey)].join(' '), size };
}

/* ---------- SVG w HTML ---------- */

/** Skale z regułą .iso-k… w src/styles/iso.css (krok rozsunięcia) — nowa wartość w FRAMES wymaga reguły. */
const K_CLASSES = new Set([42, 56, 58, 60, 84, 90]);

export function renderInline(spec: IsoSpec, kind: 'w' | 'n', uid: string): string {
  const L = layout(spec, kind);
  if (!K_CLASSES.has(Math.round(L.k * 100))) throw new Error(`iso: brak reguły .iso-k${Math.round(L.k * 100)} w src/styles/iso.css`);
  const f = L.frame;
  const out: string[] = [];
  out.push(
    `<svg class="iso-svg iso-svg--${kind} iso-k${Math.round(L.k * 100)}" viewBox="0 0 ${L.W} ${L.H}" role="img" aria-labelledby="${uid}-t ${uid}-d" focusable="false">`,
    `<title id="${uid}-t">${esc(spec.title)}</title><desc id="${uid}-d">${esc(spec.desc)}</desc><g aria-hidden="true">`,
  );
  const open = (g: number) => (g ? `<g class="iso-e${g}">` : '<g>');
  for (const run of runs(L.items)) {
    out.push(open(run.g));
    for (const part of run.parts) {
      const d = part.items.map((it) => shapeD(it, L.map, L.k)).join('');
      out.push(`<path class="i-${part.role}${part.stretch ? ' iso-cl' : ''}" d="${d}"/>`);
    }
    out.push('</g>');
  }
  // napisy na obudowach — po geometrii swojej grupy
  for (const m of L.marks) {
    const { mat, size } = markMatrix(m, L.map, L.k, 0.08);
    out.push(
      `${open(m.g)}<text class="i-m" transform="matrix(${mat})" x="0" y="${fx(size * 0.36)}" font-size="${fx(size)}" text-anchor="middle">${esc(m.text)}</text></g>`,
    );
  }
  for (const r of L.labels) {
    const { d, tx } = leaderD(r);
    const tone = r.tone === 'ink' ? '' : ` i-${r.tone}`;
    const anchor = r.side === 'l' ? ' text-anchor="end"' : '';
    const x = r.side === 'r' ? tx + 5 : tx - 5;
    const text = r.lines
      .map((t, i) => `<text class="i-t${tone}" x="${fx(x)}" y="${fx(r.cy + f.fs * 0.36 + i * f.lh)}"${anchor}>${esc(t)}</text>`)
      .join('');
    out.push(
      `${open(r.g)}<path class="i-ld${tone}" d="${d}"/><circle class="i-dot${tone}" cx="${fx(r.ax)}" cy="${fx(r.ay)}" r="1.7"/>${text}</g>`,
    );
  }
  out.push('</g></svg>');
  return out.join('');
}

/* ---------- samodzielny plik (miniatura) ---------- */

const INK2 = '#3b424c';
const GRAPHITE = '#9aa0a8';
const BLUE = '#1f4bc2';
const WASH = '#eef3fc';
const SIG = '#cc3d0a';
const SIG_WASH = '#fdf1ec';
const SIDE_R = '#f4f6f8';
const SIDE_L = '#e7ebef';

const join = 'stroke-linejoin="round" stroke-linecap="round"';
const ROLE_ATTR: Record<Role, string> = {
  top: `fill="#fff" stroke="${INK2}" stroke-width=".9" ${join}`,
  'top-hi': `fill="${WASH}" stroke="${INK2}" stroke-width=".9" ${join}`,
  'side-r': `fill="${SIDE_R}" stroke="${INK2}" stroke-width=".9" ${join}`,
  'side-l': `fill="${SIDE_L}" stroke="${INK2}" stroke-width=".9" ${join}`,
  edge: `fill="none" stroke="${INK2}" stroke-width=".9"`,
  fine: `fill="none" stroke="${GRAPHITE}" stroke-width=".6"`,
  'fine-d': `fill="none" stroke="${GRAPHITE}" stroke-width=".6" stroke-dasharray="2 2"`,
  cl: `fill="none" stroke="${GRAPHITE}" stroke-width=".6" stroke-dasharray="2.5 2.5"`,
  proj: `fill="none" stroke="${BLUE}" stroke-width=".6" stroke-dasharray="2 2"`,
  trace: `fill="none" stroke="${INK2}" stroke-width=".75" ${join}`,
  'trace-hi': `fill="none" stroke="${BLUE}" stroke-width="1.1" ${join}`,
  fault: `fill="none" stroke="${SIG}" stroke-width="1.2" stroke-dasharray="3 2"`,
  pad: `fill="#fff" stroke="${INK2}" stroke-width=".6"`,
  'pad-hi': `fill="${WASH}" stroke="${BLUE}" stroke-width=".8"`,
  'pad-sig': `fill="${SIG_WASH}" stroke="${SIG}" stroke-width=".8"`,
  ball: `fill="#fff" stroke="${INK2}" stroke-width=".6"`,
  'ball-hi': `fill="${WASH}" stroke="${BLUE}" stroke-width=".9"`,
  'ball-sig': `fill="${SIG_WASH}" stroke="${SIG}" stroke-width=".9"`,
  pin: `fill="none" stroke="${INK2}" stroke-width=".9" ${join}`,
  'pin-hi': `fill="none" stroke="${BLUE}" stroke-width="1.2" ${join}`,
  'pin-sig': `fill="none" stroke="${SIG}" stroke-width="1.2" ${join}`,
  via: `fill="#fff" stroke="${INK2}" stroke-width=".6"`,
  'die-line': `fill="none" stroke="${BLUE}" stroke-width=".6"`,
};
const TONE_COLOR: Record<Tone, string> = { ink: INK2, hi: BLUE, sig: SIG };
/** Kolor tekstu etykiety: błękit tylko na odnośniku, czerwień także w tekście (jedyny akcent). */
const TEXT_COLOR: Record<Tone, string> = { ink: INK2, hi: INK2, sig: SIG };

export async function renderFile(spec: IsoSpec): Promise<string> {
  const L = layout(spec, 't');
  const f = L.frame;
  const chars = [...L.labels.flatMap((r) => r.lines.join('')), ...L.marks.map((m) => m.text)].join('');
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
  const word = (t: string) =>
    [...t]
      .map((ch, i) => (ids.has(ch) ? `<use href="#${ids.get(ch)}" x="${fx(i * adv)}"/>` : ''))
      .join('');

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.W} ${L.H}" width="${L.W}" height="${L.H}">`,
    `<defs><pattern id="gr" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="#eef1f4" stroke-width=".6"/></pattern>${defs.join('')}</defs>`,
    `<rect width="${L.W}" height="${L.H}" fill="#fff"/><rect width="${L.W}" height="${L.H}" fill="url(#gr)"/>`,
  );
  for (const run of runs(L.items))
    for (const part of run.parts) out.push(`<path ${ROLE_ATTR[part.role]} d="${part.items.map((it) => shapeD(it, L.map, L.k)).join('')}"/>`);
  for (const m of L.marks) {
    const { mat, size } = markMatrix(m, L.map, L.k, 0.08);
    const s = size / 100;
    const w = m.text.length * (GLYPH_ADVANCE + 8) * s - 8 * s;
    out.push(
      `<g fill="${INK2}" transform="matrix(${mat}) translate(${fx(-w / 2)} ${fx(size * 0.36)}) scale(${+s.toFixed(4)})">${[...m.text]
        .map((ch, i) => (ids.has(ch) ? `<use href="#${ids.get(ch)}" x="${i * (GLYPH_ADVANCE + 8)}"/>` : ''))
        .join('')}</g>`,
    );
  }
  const s = f.fs / 100;
  for (const r of L.labels) {
    const { d, tx } = leaderD(r);
    const c = TONE_COLOR[r.tone];
    out.push(`<path fill="none" stroke="${c}" stroke-width=".6" d="${d}"/><circle cx="${fx(r.ax)}" cy="${fx(r.ay)}" r="1.5" fill="${c}"/>`);
    r.lines.forEach((t, i) => {
      const w = t.length * adv * s - f.ls * f.fs;
      const x = r.side === 'r' ? tx + 5 : tx - 5 - w;
      out.push(`<g fill="${TEXT_COLOR[r.tone]}" transform="translate(${fx(x)} ${fx(r.cy + f.fs * 0.36 + i * f.lh)}) scale(${+s.toFixed(4)})">${word(t)}</g>`);
    });
  }
  out.push('</svg>');
  return out.join('');
}
