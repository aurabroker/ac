/**
 * Kotwice nagłówków: `#jak-to-wyglada-w-praktyce` (ASCII, bez sklejania wyrazów).
 *
 * `rehypeHeadingSlugs` musi działać PRZED `rehypePolish` (astro.config.ts): twarde spacje
 * po „w”, „i”, „z”… nie mogą skleić wyrazów w identyfikatorze. Astro zachowuje istniejące `id`,
 * więc spis treści (`headings` z render()) używa tych samych kotwic.
 */
import type { Root, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

const PL: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };

/** „Jak działa ochrona w USA i Kanadzie?” → „jak-dziala-ochrona-w-usa-i-kanadzie”. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Identyfikatory używane przez layouty i komponenty — nagłówek treści nie może ich zająć. */
export const RESERVED_IDS = [
  'tresc', 'h1', 'w-skrocie', 'faq', 'zrodla', 'kontakt', 'tabela-zakresu', 'rynki', 'rejestr-zmian', 'profil',
  'powiazane', 'menu-dialog', 'mapa-serwisu', 'filary', 'autor', 'arkusze-szczegolowe',
  'arkusze-autora', 'w-przygotowaniu', 'spis-tresci', 'karty-katalogu',
];

type AnyNode = { type: string; value?: unknown; properties?: Record<string, unknown>; children?: AnyNode[] };

/** Tekst nagłówka (także z komponentów MDX w nagłówku, np. <Term>). */
function textOf(node: Element | ElementContent | AnyNode): string {
  const n = node as AnyNode;
  if (n.type === 'text') return String(n.value ?? '');
  // pomijamy ozdobniki (aria-hidden) — nie są częścią nazwy nagłówka
  if (n.type === 'element' && String(n.properties?.ariaHidden) === 'true') return '';
  return Array.isArray(n.children) ? n.children.map(textOf).join('') : '';
}

export function rehypeHeadingSlugs() {
  return (tree: Root) => {
    const used = new Set(RESERVED_IDS);
    // najpierw identyfikatory nadane ręcznie (np. <h2 id="…">), żeby ich nie zdublować
    visit(tree, 'element', (el: Element) => {
      if (typeof el.properties?.id === 'string') used.add(el.properties.id);
    });
    visit(tree, 'element', (el: Element) => {
      if (!/^h[1-6]$/.test(el.tagName) || el.properties?.id) return;
      const base = slugify(textOf(el).replace(/\s+/g, ' ').trim()) || 'sekcja';
      let id = base;
      for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      el.properties = { ...el.properties, id };
    });
  };
}
