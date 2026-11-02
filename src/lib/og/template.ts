/**
 * Szablon obrazu OG 1200×630 w stylu arkusza rysunkowego: biel, podwójna ramka ze strefami (1–6, A–C),
 * nagłówek ze znakiem słownym, tytuł, mały rysunek złożeniowy (motyw F-00) i tabliczka rysunkowa.
 * WŁAŚCICIEL WIZUALNY: agent „figures” (kontrakt: ogTemplate(input) → drzewo satori).
 * Satori obsługuje flexbox i podzbiór CSS; bez <style>, tylko obiekty style. Rysunek to SVG w <img> (data URI).
 */
import { arc, cylinder, dimV, ellipse, ep, f, hatch, p, poly, seg, type Pt } from '../../components/figures/draw.ts';
import { polishText } from '../typography/polish.ts';

export interface OgInput {
  title: string;
  sheet: string;
  revision: string;
  /** Data w formacie DD.MM.RRRR. */
  date: string;
  /** Etykieta rodzaju strony, np. „FILAR”, „ARTYKUŁ”, „KARTA”. */
  kind: string;
  /** Ścieżka strony (np. „/oc-cyber-dla-it/”). */
  path: string;
}

export interface OgNode {
  type: string;
  props: { style?: Record<string, unknown>; children?: unknown; [k: string]: unknown };
}

/** Listy fontów z fallbackiem na podzbiór latin-ext (polskie znaki). */
export const OG_SANS = 'Archivo, "Archivo Ext"';
export const OG_MONO = '"Plex Mono", "Plex Mono Ext"';

const INK = '#16191D';
const INK2 = '#3B424C';
const INK3 = '#5E6672';
const INK4 = '#8A919C';
const GRAPHITE = '#9AA0A8';
const BLUE = '#1F4BC2';
const GRID = '#F0F2F5';

const W = 1200;
const H = 630;
const OUT = 18; // ramka zewnętrzna
const IN = 40; // ramka wewnętrzna

const h = (type: string, style: Record<string, unknown>, children?: unknown): OgNode => ({
  type,
  props: { style, children },
});

/** Motyw F-00: zespół w widoku rozstrzelonym (uproszczony) — SVG z atrybutami (bez klas). */
function motifSvg(): string {
  const X = 170;
  const K = 0.3;
  const obj = `fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const paper = `fill="#FFFFFF" stroke="none"`;
  const parts: string[] = [];
  const disc = (rx: number, cy: number, hh: number) => {
    const c = cylinder(X, cy, rx, rx * K, hh);
    parts.push(`<path ${paper} d="${c.fill}"/><path ${obj} d="${c.edges}"/>`);
  };
  // konstrukcja i oś
  parts.push(`<path fill="none" stroke="${GRAPHITE}" stroke-width="1" d="M${p(X - 90, 30)}V${f(345)}M${p(X + 90, 30)}V${f(345)}"/>`);
  // podstawa z otworami
  disc(124, 292, 14);
  const holes = [30, 90, 150, 210, 270, 330].map((a) => ep(X, 292, 110, 110 * K, a)).map(([x, y]) => ellipse(x, y, 5, 5 * K)).join('');
  parts.push(`<path fill="none" stroke="${INK2}" stroke-width="1.3" d="${holes}"/>`);
  // tarcze
  disc(90, 226, 32);
  disc(90, 172, 22);
  // pierścień z otworem
  const rr = 100;
  const ri = 78;
  const ry = 128;
  const rh = 10;
  const ring = cylinder(X, ry, rr, rr * K, rh);
  const s = (Math.asin(rh / (2 * ri * K)) * 180) / Math.PI;
  const lens = arc(X, ry, ri, ri * K, s, 180 - s) + arc(X, ry + rh, ri, ri * K, 180 + s, 360 - s, false) + 'Z';
  parts.push(
    `<path ${paper} fill-rule="evenodd" d="${ring.fill + lens}"/>` +
      `<path ${obj} d="${ring.edges + ellipse(X, ry, ri, ri * K) + arc(X, ry + rh, ri, ri * K, 180 + s, 360 - s)}"/>`,
  );
  // pokrywa z wyciętą ćwiartką
  const cr = 70;
  const cy = 76;
  const ch = 20;
  const cry = cr * K;
  const a0 = 18;
  const a1 = 132;
  const C: Pt = [X, cy];
  const face = (a: number): Pt[] => {
    const t = ep(X, cy, cr, cry, a);
    return [C, t, [t[0], t[1] + ch], [X, cy + ch]];
  };
  const F0 = face(a0);
  const F1 = face(a1);
  const capFill =
    `M${p(X - cr, cy)}` +
    arc(X, cy, cr, cry, 180, 360, false) +
    `V${f(cy + ch)}` +
    arc(X, cy + ch, cr, cry, 0, a0, false) +
    `L${p(X, cy + ch)}L${p(F1[2][0], F1[2][1])}` +
    arc(X, cy + ch, cr, cry, a1, 180, false) +
    'Z';
  const capEdges =
    arc(X, cy, cr, cry, a1, 360 + a0) +
    poly([F0[1], C, F1[1]]) +
    seg([X - cr, cy], [X - cr, cy + ch]) +
    seg([X + cr, cy], [X + cr, cy + ch]) +
    arc(X, cy + ch, cr, cry, 0, a0) +
    arc(X, cy + ch, cr, cry, a1, 180) +
    poly([F0[1], F0[2], F0[3], C]) +
    poly([F1[1], F1[2], F1[3]]);
  parts.push(
    `<path ${paper} d="${capFill}"/>` +
      `<path fill="none" stroke="${INK4}" stroke-width="0.8" d="${hatch(F0, 4, -45) + hatch(F1, 4, -45)}"/>` +
      `<path ${obj} d="${capEdges}"/>`,
  );
  // oś (kreska-kropka) i wymiar całkowity
  parts.push(`<path fill="none" stroke="${INK4}" stroke-width="1" stroke-dasharray="14 3 2 3" d="M${p(X, 18)}V${f(362)}"/>`);
  const d = dimV(20, cy, 292, 9);
  parts.push(
    `<path fill="none" stroke="${GRAPHITE}" stroke-width="1" d="${seg([X - cr - 6, cy], [12, cy]) + seg([X - 124 - 6, 292], [12, 292])}"/>` +
      `<path fill="none" stroke="${BLUE}" stroke-width="1.2" d="${d.line}"/><path fill="${BLUE}" d="${d.heads}"/>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="380" viewBox="0 0 340 380">${parts.join('')}</svg>`;
}

let motifUri: string | null = null;
const motif = () => (motifUri ??= `data:image/svg+xml;base64,${Buffer.from(motifSvg()).toString('base64')}`);

function cell(label: string, value: string, grow: number, last = false): OgNode {
  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: grow,
      flexBasis: 0,
      padding: '10px 16px 12px',
      borderRight: last ? 'none' : `1px solid ${INK}`,
    },
    [
      h('div', { fontFamily: OG_MONO, fontSize: 13, letterSpacing: 1.6, color: INK3 }, label),
      h('div', { fontFamily: OG_MONO, fontSize: 21, color: INK, marginTop: 4 }, value),
    ],
  );
}

/** Znaczniki stref między ramkami (jak na arkuszu rysunkowym): 1–6 u góry i dołu, A–C po bokach. */
function zones(): OgNode[] {
  const out: OgNode[] = [];
  const cols = 6;
  const rows = 3;
  const zw = (W - 2 * OUT) / cols;
  const zh = (H - 2 * OUT) / rows;
  const label = (x: number, y: number, t: string) =>
    h('div', { position: 'absolute', left: x - 10, top: y - 9, width: 20, height: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: OG_MONO, fontSize: 12, color: INK3 }, t);
  const line = (x: number, y: number, w: number, hh: number) => h('div', { position: 'absolute', left: x, top: y, width: w, height: hh, backgroundColor: INK2 });
  for (let i = 0; i < cols; i++) {
    const cx = OUT + zw * (i + 0.5);
    out.push(label(cx, (OUT + IN) / 2, String(i + 1)), label(cx, H - (OUT + IN) / 2, String(i + 1)));
    if (i > 0) {
      const x = OUT + zw * i;
      out.push(line(x, OUT, 1, IN - OUT), line(x, H - IN, 1, IN - OUT));
    }
  }
  for (let j = 0; j < rows; j++) {
    const cy = OUT + zh * (j + 0.5);
    const t = String.fromCharCode(65 + j);
    out.push(label((OUT + IN) / 2, cy, t), label(W - (OUT + IN) / 2, cy, t));
    if (j > 0) {
      const y = OUT + zh * j;
      out.push(line(OUT, y, IN - OUT, 1), line(W - IN, y, IN - OUT, 1));
    }
  }
  return out;
}

export function ogTemplate(i: OgInput): OgNode {
  // polska typografia: twarde spacje po spójnikach jednoliterowych, myślnik nie zaczyna wiersza
  const title = polishText(i.title).replace(/ ([—–]) /g, '\u00A0$1 ');
  const len = title.length;
  const titleSize = len > 80 ? 44 : len > 56 ? 50 : len > 36 ? 56 : 64;

  // siatka kreślarska wewnątrz arkusza (co 40 px, bardzo jasna)
  const grid: OgNode[] = [];
  for (let x = IN + 40; x < W - IN; x += 40)
    grid.push(h('div', { position: 'absolute', left: x, top: IN, width: 1, height: H - 2 * IN, backgroundColor: GRID }));
  for (let y = IN + 40; y < H - IN; y += 40)
    grid.push(h('div', { position: 'absolute', top: y, left: IN, height: 1, width: W - 2 * IN, backgroundColor: GRID }));

  return h(
    'div',
    { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#FFFFFF', fontFamily: OG_SANS, color: INK },
    [
      ...grid,
      // ramka zewnętrzna i strefy
      h('div', { position: 'absolute', left: OUT, top: OUT, width: W - 2 * OUT, height: H - 2 * OUT, border: `1px solid ${INK2}` }),
      ...zones(),
      // arkusz (ramka wewnętrzna)
      h(
        'div',
        {
          position: 'absolute',
          left: IN,
          top: IN,
          width: W - 2 * IN,
          height: H - 2 * IN,
          display: 'flex',
          flexDirection: 'column',
          border: `2px solid ${INK}`,
        },
        [
          // nagłówek
          h(
            'div',
            { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 30px 0' },
            [
              h('div', { display: 'flex', flexDirection: 'column' }, [
                h('div', { fontFamily: OG_SANS, fontWeight: 600, fontSize: 25, letterSpacing: 5, color: INK }, 'AURA CONSULTING'),
                h('div', { fontFamily: OG_MONO, fontSize: 13, letterSpacing: 2, color: INK3, marginTop: 4 }, 'BROKER UBEZPIECZENIOWY · KNF 1972/13'),
              ]),
              h('div', { fontFamily: OG_MONO, fontSize: 15, letterSpacing: 2, color: INK3, marginTop: 6 }, `${i.kind} · ${i.sheet}`),
            ],
          ),
          // tytuł + rysunek
          h('div', { display: 'flex', flexGrow: 1, alignItems: 'center', padding: '0 0 0 30px' }, [
            h('div', { display: 'flex', flexDirection: 'column', width: 730 }, [
              h('div', { width: 64, height: 2, backgroundColor: INK, marginBottom: 22 }),
              h(
                'div',
                { fontFamily: OG_SANS, fontWeight: 600, fontSize: titleSize, lineHeight: 1.08, letterSpacing: -1, color: INK, textWrap: 'balance' },
                title,
              ),
            ]),
            h('div', { display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, [
              { type: 'img', props: { src: motif(), width: 300, height: 335, style: { width: 300, height: 335 } } },
            ]),
          ]),
          // tabliczka rysunkowa
          h('div', { display: 'flex', borderTop: `2px solid ${INK}` }, [
            cell('ARKUSZ', i.sheet, 1),
            cell('REW.', i.revision, 0.6),
            cell('DATA', i.date, 1.1),
            cell('BROKER UBEZPIECZENIOWY', 'KNF 1972/13', 1.9),
            cell('ADRES', 'www.auraconsulting.pl', 1.9, true),
          ]),
        ],
      ),
    ],
  );
}
