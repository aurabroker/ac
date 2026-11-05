/**
 * toPublicMarkdown — JEDEN serializer bliźniaków `.md` (oraz llms-full.txt).
 *
 * Zasada: bliźniak powstaje z wyrenderowanego HTML tej samej strony, więc treść
 * HTML i `.md` jest zawsze zgodna. Serializer:
 *  - bierze tylko obszar `[data-md-root]` (zwykle <main>),
 *  - pomija elementy `[data-md-skip]`, `[aria-hidden="true"]`, `<svg>`, `<script>`, `<button>` itp.,
 *  - zamienia `<details>` na nagłówek/akapit + treść, `<aside class="note">` na cytat,
 *    podpis tabeli na pogrubiony akapit nad tabelą,
 *  - robi linki i obrazy absolutnymi (`https://www.auraconsulting.pl/...`),
 *  - dokleja frontmatter (z <head> i JSON-LD) oraz stopkę brokera.
 *
 * Strony z `noindex` nie dostają bliźniaka (funkcja zwraca null).
 */
import type { Root, Element, ElementContent, RootContent, Nodes } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { select, selectAll } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toMdast } from 'hast-util-to-mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { stringify as yamlStringify } from 'yaml';
import { SITE, PUBLISHER_LINE, REGISTRY_LINE, mdPathFor } from '../site.ts';
import { FORMULA_C } from '../compliance.ts';

export interface PublicMarkdownResult {
  markdown: string;
  canonical: string;
  title: string;
  description: string;
  updated?: string;
}

const DROP_TAGS = new Set([
  'svg', 'script', 'style', 'template', 'button', 'noscript', 'dialog', 'input', 'select', 'textarea',
  'form', 'iframe', 'video', 'audio', 'canvas', 'link', 'meta',
]);

const BLOCK_TAGS = new Set(['ol', 'ul', 'p', 'div', 'table', 'blockquote', 'pre', 'dl', 'h2', 'h3', 'h4', 'section']);

function isElement(n: unknown): n is Element {
  return !!n && typeof n === 'object' && (n as Element).type === 'element';
}

function classList(el: Element): string[] {
  const c: unknown = el.properties?.className;
  if (Array.isArray(c)) return c.map(String);
  return typeof c === 'string' ? c.split(/\s+/) : [];
}

function shouldDrop(el: Element): boolean {
  const p = el.properties ?? {};
  if (DROP_TAGS.has(el.tagName)) return true;
  if (p.dataMdSkip !== undefined && p.dataMdSkip !== false) return true;
  if (String(p.ariaHidden) === 'true') return true;
  if (p.hidden !== undefined && p.hidden !== false) return true;
  return false;
}

function absolutize(href: string, canonical: string): string {
  if (!href) return href;
  if (/^(mailto:|tel:|https?:|data:)/i.test(href)) return href;
  if (href.startsWith('#')) return canonical + href;
  if (href.startsWith('//')) return 'https:' + href;
  if (href.startsWith('/')) return SITE.url + href;
  try {
    return new URL(href, canonical).toString();
  } catch {
    return href;
  }
}

function p(children: ElementContent[]): Element {
  return { type: 'element', tagName: 'p', properties: {}, children };
}
function strong(text: string): Element {
  return { type: 'element', tagName: 'strong', properties: {}, children: [{ type: 'text', value: text }] };
}
function em(children: ElementContent[]): Element {
  return { type: 'element', tagName: 'em', properties: {}, children };
}

function ul(items: Element[]): Element {
  return { type: 'element', tagName: 'ul', properties: {}, children: items };
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Karta arkusza (SheetCard) → punkt listy: „[Tytuł](url) — NUMER · opis · meta”.
 * Link z tytułu zostaje (w HTML tytuł jest nagłówkiem z linkiem, a nagłówki w .md są samym tekstem).
 */
function sheetCardItem(card: Element, canonical: string): Element {
  const text = (sel: string) => {
    const n = select(sel, card);
    return n ? squash(toString(n)) : '';
  };
  const link = select('.sheet-card__title a', card);
  const title = text('.sheet-card__title');
  const href = typeof link?.properties?.href === 'string' ? absolutize(link.properties.href, canonical) : '';
  const children: ElementContent[] = href
    ? [{ type: 'element', tagName: 'a', properties: { href }, children: [{ type: 'text', value: title }] }]
    : [strong(title)];
  const rest = [text('.sheet-card__sheet'), text('.sheet-card__summary'), text('.sheet-card__meta')].filter(Boolean);
  if (rest.length) children.push({ type: 'text', value: ` — ${rest.join(' · ')}` });
  return { type: 'element', tagName: 'li', properties: {}, children };
}

/** Przekształca drzewo w miejscu (rekurencyjnie), zwraca nową listę dzieci. */
function transformChildren(children: (RootContent | ElementContent)[], canonical: string): ElementContent[] {
  const out: ElementContent[] = [];
  for (const node of children) {
    if (node.type === 'comment' || node.type === 'doctype') continue;
    if (!isElement(node)) {
      out.push(node as ElementContent);
      continue;
    }
    const el = node;
    if (shouldDrop(el)) continue;

    // linki i obrazy absolutne
    if (el.tagName === 'a' && typeof el.properties?.href === 'string') {
      el.properties.href = absolutize(el.properties.href, canonical);
    }
    if (el.tagName === 'img' && typeof el.properties?.src === 'string') {
      el.properties.src = absolutize(el.properties.src, canonical);
    }

    // <details>: summary → nagłówek (jeśli zawiera) lub pogrubiony akapit, reszta bez zmian
    if (el.tagName === 'details') {
      for (const c of el.children) {
        if (isElement(c) && c.tagName === 'summary') {
          const heading = c.children.find((x) => isElement(x) && /^h[1-6]$/.test(x.tagName));
          if (heading) out.push(...transformChildren([heading], canonical));
          else out.push(p([strong(toString(c).trim())]));
        } else {
          out.push(...transformChildren([c], canonical));
        }
      }
      continue;
    }

    // notatki (NoteBlock: <div class="note" role="note">, dawniej <aside class="note">) → cytat;
    // inne <aside> → bez opakowania
    if (el.tagName === 'aside' || (el.tagName === 'div' && classList(el).includes('note'))) {
      const kids = transformChildren(el.children, canonical);
      if (classList(el).includes('note')) {
        el.tagName = 'blockquote';
        el.children = kids;
        out.push(el);
      } else {
        out.push(...kids);
      }
      continue;
    }

    // siatka kart (CardGrid) → lista punktowana; pojedyncza karta poza siatką → lista z jednym punktem.
    // Karty mogą być opakowane (katalog: <div class="cat-item"> z atrybutami filtra) — opakowanie pomijamy.
    if (el.tagName === 'div' && classList(el).includes('card-grid')) {
      const cardOf = (c: unknown): Element | undefined => {
        if (!isElement(c)) return undefined;
        if (classList(c).includes('sheet-card')) return c;
        if (classList(c).includes('cat-item')) {
          const inner = c.children.filter(isElement);
          return inner.length === 1 && classList(inner[0]).includes('sheet-card') ? inner[0] : undefined;
        }
        return undefined;
      };
      const items = el.children.map(cardOf).filter((c): c is Element => !!c);
      const others = el.children.filter((c) => !cardOf(c));
      if (items.length) out.push(ul(items.map((c) => sheetCardItem(c, canonical))));
      out.push(...transformChildren(others, canonical));
      continue;
    }
    if (el.tagName === 'article' && classList(el).includes('sheet-card')) {
      out.push(ul([sheetCardItem(el, canonical)]));
      continue;
    }

    // nagłówki: sam tekst (bez kursywy akcentu, linków-kotwic itp.)
    if (/^h[1-6]$/.test(el.tagName)) {
      el.children = [{ type: 'text', value: toString(el).replace(/\s+/g, ' ').trim() }];
      out.push(el);
      continue;
    }

    // etykiety (Plex Mono, klasa „label”) → pogrubienie
    if (el.tagName === 'p' && classList(el).includes('label')) {
      out.push(p([strong(toString(el).replace(/\s+/g, ' ').trim())]));
      continue;
    }

    // tabela: podpis jako akapit nad tabelą
    if (el.tagName === 'table') {
      const caption = el.children.find((c) => isElement(c) && c.tagName === 'caption') as Element | undefined;
      if (caption) {
        el.children = el.children.filter((c) => c !== caption);
        const label = toString(caption).replace(/\s+/g, ' ').trim();
        if (label) out.push(p([strong(label)]));
      }
      el.children = transformChildren(el.children, canonical);
      out.push(el);
      continue;
    }

    // rysunek: tylko podpis (kursywą) i legenda; rysunek SVG jest pomijany
    if (el.tagName === 'figure') {
      const kept: ElementContent[] = [];
      for (const c of el.children) {
        if (!isElement(c)) continue;
        if (c.tagName === 'figcaption') {
          const inline: ElementContent[] = [];
          const blocks: ElementContent[] = [];
          for (const fc of transformChildren(c.children, canonical)) {
            if (isElement(fc) && BLOCK_TAGS.has(fc.tagName)) blocks.push(fc);
            else if (fc.type === 'text' && !fc.value.trim()) continue;
            else {
              if (inline.length) inline.push({ type: 'text', value: ' ' });
              inline.push(fc);
            }
          }
          if (inline.length) kept.push(p([em(inline)]));
          kept.push(...blocks);
        } else {
          kept.push(...transformChildren([c], canonical));
        }
      }
      out.push(...kept);
      continue;
    }

    // lista definicji → lista punktowana „**termin**: definicja”
    if (el.tagName === 'dl') {
      const items: Element[] = [];
      let current: Element | null = null;
      for (const c of el.children) {
        if (!isElement(c)) continue;
        const pairs = c.tagName === 'div' ? c.children.filter(isElement) : [c];
        for (const d of pairs) {
          if (d.tagName === 'dt') {
            current = { type: 'element', tagName: 'li', properties: {}, children: [strong(toString(d).trim()), { type: 'text', value: ': ' }] };
            items.push(current);
          } else if (d.tagName === 'dd' && current) {
            current.children.push(...transformChildren(d.children, canonical));
          }
        }
      }
      out.push({ type: 'element', tagName: 'ul', properties: {}, children: items });
      continue;
    }

    el.children = transformChildren(el.children, canonical);
    out.push(el);
  }
  return out;
}

function metaContent(tree: Root, selector: string): string | undefined {
  const el = select(selector, tree);
  const v = el?.properties?.content ?? el?.properties?.href;
  return typeof v === 'string' ? v : undefined;
}

interface JsonLdNode {
  '@id'?: string;
  '@type'?: string | string[];
  [k: string]: unknown;
}

function readGraph(tree: Root): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  for (const s of selectAll('script[type="application/ld+json"]', tree)) {
    try {
      const data = JSON.parse(toString(s));
      const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [data];
      nodes.push(...graph);
    } catch {
      /* walidacja JSON-LD zgłosi błąd osobno */
    }
  }
  return nodes;
}

function dateOnly(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  return v.slice(0, 10);
}

/**
 * Serializuje stronę HTML do publicznego Markdown. Zwraca null dla stron
 * z `noindex` (chyba że force — podgląd szkiców w `astro dev`) lub bez obszaru `[data-md-root]`.
 */
export function toPublicMarkdown(html: string, opts: { force?: boolean } = {}): PublicMarkdownResult | null {
  const tree = fromHtml(html);
  const robots = metaContent(tree, 'meta[name="robots"]') ?? '';
  if (/noindex/i.test(robots) && !opts.force) return null;
  const root = select('[data-md-root]', tree);
  if (!root) return null;

  const canonical = metaContent(tree, 'link[rel="canonical"]');
  if (!canonical) throw new Error('toPublicMarkdown: brak <link rel="canonical">');
  const description = metaContent(tree, 'meta[name="description"]') ?? '';
  const author = metaContent(tree, 'meta[name="author"]') ?? 'Zespół Aura Consulting';
  const h1 = select('h1', root);
  const graph = readGraph(tree);
  const page = graph.find((n) => n['@id'] === `${canonical}#webpage`);
  // tytuł opisowy z WebPage.name (machineTitle), gdy H1 jest hasłem — np. strona główna
  const h1Text = h1 ? toString(h1) : (metaContent(tree, 'meta[property="og:title"]') ?? '');
  const title = plainText(typeof page?.name === 'string' && page.name ? page.name : h1Text);
  const updated = dateOnly(page?.dateModified);
  const published = dateOnly(page?.datePublished);

  const children = transformChildren(root.children as ElementContent[], canonical);
  const mdast = toMdast({ type: 'root', children } as Nodes);
  let body = toMarkdown(mdast, {
    extensions: [gfmToMarkdown()],
    bullet: '-',
    emphasis: '_',
    strong: '*',
    rule: '-',
    fences: true,
    listItemIndent: 'one',
    resourceLink: true,
  });
  body = plainText(
    body
      .replace(/\\&(?!#?\w+;)/g, '&')
      // e-mail i nawiasy kwadratowe bez zbędnych ucieczek (autolink GFM / tematy „[IT-000]”)
      .replace(/\\@/g, '@')
      .replace(/\\\[([^\]\n]*?)\\?\](?!\()/g, '[$1]'),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const path = new URL(canonical).pathname;
  const fm: Record<string, unknown> = {
    title,
    description,
    canonical,
    markdown: SITE.url + mdPathFor(path),
    lang: SITE.lang,
    ...(published ? { published } : {}),
    ...(updated ? { updated } : {}),
    author,
    publisher: PUBLISHER_LINE,
  };
  const front = yamlStringify(fm, { lineWidth: 0 }).trim();
  const lead =
    `> Wersja kanoniczna (HTML): ${canonical} · Analiza ryzyka: tel. ${SITE.phone} albo formularz ${SITE.formUrl}`;
  const footer = ['---', '', REGISTRY_LINE, '', FORMULA_C].join('\n');

  const markdown = `---\n${front}\n---\n\n${lead}\n\n${body}\n\n${footer}\n`;
  return { markdown, canonical, title, description, updated };
}

/**
 * Tekst „czysty” dla maszyn: twarde spacje z typografii HTML → zwykłe spacje, apostrof typograficzny
 * między literami → prosty (jedna pisownia nazw typu Lloyd's w .md, JSON-LD i meta).
 */
export function plainText(s: string): string {
  return s.replace(/[\u00A0\u202F]/g, ' ').replace(/(\p{L})\u2019(\p{L})/gu, "$1'$2");
}

/** Wyciąga canonical z frontmattera bliźniaka (walidacja). */
export function readTwinCanonical(md: string): string | undefined {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!m) return undefined;
  const line = m[1].split('\n').find((l) => l.startsWith('canonical:'));
  return line?.slice('canonical:'.length).trim().replace(/^["']|["']$/g, '');
}

export { classList };
