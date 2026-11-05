/**
 * Polska typografia: twarde spacje po jednoliterowych spójnikach i przyimkach,
 * między liczbą a jednostką, w grupach tysięcy, między dniem a nazwą miesiąca, przed pauzą i półpauzą
 * (myślnik nie zaczyna wiersza); cudzysłowy „…”, apostrof ’, wielokropek, półpauza.
 *
 * - `polishText(s)` — dla zwykłych napisów (frontmatter, propsy komponentów).
 * - `rehypePolish()` — plugin rehype dla treści MD/MDX (skonfigurowany w astro.config.ts).
 */
import type { Root, Element, Text, Parents } from 'hast';
import { visitParents } from 'unist-util-visit-parents';

export const NBSP = ' ';

const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'kbd', 'samp', 'textarea', 'svg', 'math']);

const UNITS = [
  'zł', 'PLN', 'EUR', 'USD', 'GBP', '%', 'proc\\.', 'mln', 'mld', 'tys\\.', 'km', 'kg', 'h', 'godz\\.',
  'min', 'dni', 'dnia', 'lat', 'lata', 'r\\.', 'KB', 'MB', 'GB', 'TB', 'mies\\.', 'tyg\\.',
];
const UNIT_RE = new RegExp(`(\\d)[ ](?=(?:${UNITS.join('|')})(?=$|[\\s.,;:!?)\\]…”]))`, 'g');
const THOUSANDS_RE = /(\d)[ ](?=\d{3}(?!\d))/g;
const ABBR_RE = /(^|[\s(])(§|nr|art\.|ust\.|pkt|poz\.|s\.|ok\.|tj\.|np\.|m\.in\.|tzw\.|ww\.)[ ](?=\S)/g;
// jednoliterowe wyrazy: a, i, o, u, w, z (oraz wielkie litery)
const ORPHAN_RE = /(^|[\s („"'[–—-])([aiouwzAIOUWZ])[ ](?=\S|$)/g;
const QUOTES_RE = /"([^"\n]+)"/g;
// dzień i nazwa miesiąca w dopełniaczu: „2 sierpnia 2028 r.” bez łamania po liczbie
const MONTHS = 'stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia';
const DAY_MONTH_RE = new RegExp(`(\\b\\d{1,2})[ ](?=(?:${MONTHS})(?![\\p{L}]))`, 'gu');
// apostrof między literami (deepfake'a, Lloyd's) → ’ (jak smartypants w treści MDX)
const APOSTROPHE_RE = /(\p{L})'(\p{L})/gu;

export function polishText(input: string, opts: { quotes?: boolean } = {}): string {
  if (!input) return input;
  let s = input;
  if (opts.quotes !== false) s = s.replace(QUOTES_RE, '„$1”');
  s = s.replace(APOSTROPHE_RE, '$1’$2');
  s = s.replace(/\.\.\./g, '…');
  s = s.replace(/ - /g, ' – ');
  s = s.replace(/ ([–—])(?=\s|$)/g, `${NBSP}$1`);
  // dwa przebiegi, by objąć sekwencje typu „a w”, „i z”
  s = s.replace(ORPHAN_RE, `$1$2${NBSP}`).replace(ORPHAN_RE, `$1$2${NBSP}`);
  s = s.replace(THOUSANDS_RE, `$1${NBSP}`).replace(THOUSANDS_RE, `$1${NBSP}`);
  s = s.replace(UNIT_RE, `$1${NBSP}`);
  s = s.replace(DAY_MONTH_RE, `$1${NBSP}`);
  s = s.replace(ABBR_RE, `$1$2${NBSP}`);
  return s;
}

function insideSkipped(ancestors: Parents[]): boolean {
  return ancestors.some(
    (a) => a.type === 'element' && (SKIP_TAGS.has((a as Element).tagName) || (a as Element).properties?.translate === 'no'),
  );
}

/** Plugin rehype: stosuje polishText do węzłów tekstowych (poza kodem). */
export function rehypePolish() {
  return (tree: Root) => {
    visitParents(tree, 'text', (node: Text, ancestors: Parents[]) => {
      if (insideSkipped(ancestors)) return;
      node.value = polishText(node.value);
    });
  };
}

/**
 * Plugin rehype: owija tabele w przewijalny kontener (mobile) z dostępną etykietą.
 * `<div class="table-wrap" role="region" tabindex="0" aria-label="Tabela">`
 */
export function rehypeTables() {
  return (tree: Root) => {
    visitParents(tree, 'element', (node: Element, ancestors: Parents[]) => {
      if (node.tagName !== 'table') return;
      const parent = ancestors[ancestors.length - 1];
      if (!parent || !('children' in parent)) return;
      if (parent.type === 'element' && (parent as Element).properties?.className?.toString().includes('table-wrap')) return;
      const idx = parent.children.indexOf(node);
      const caption = node.children.find((c) => c.type === 'element' && c.tagName === 'caption');
      const label = caption ? textOf(caption as Element) : 'Tabela';
      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'], role: 'region', tabIndex: 0, ariaLabel: label },
        children: [node],
      };
      (parent.children as Element[])[idx] = wrapper;
    });
  };
}

function textOf(el: Element): string {
  let out = '';
  for (const c of el.children) {
    if (c.type === 'text') out += c.value;
    else if (c.type === 'element') out += textOf(c);
  }
  return out.trim();
}
