/**
 * Mini-renderer inline Markdown dla pól frontmattera (FAQ, definicje, komórki tabel).
 * Obsługuje: [tekst](/link/), **pogrubienie**, *kursywa* / _kursywa_, `kod`.
 * Najpierw polska typografia, potem escape HTML, potem znaczniki — bezpieczne dla set:html.
 */
import { polishText } from './typography/polish.ts';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(h)) return h;
  return null;
}

export function inlineMd(input: string): string {
  if (!input) return '';
  let s = escapeHtml(polishText(input));
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const decoded = href.replace(/&amp;/g, '&');
    const ok = safeHref(decoded);
    if (!ok) return text;
    const ext = /^https?:\/\//i.test(ok) && !ok.startsWith('https://www.auraconsulting.pl');
    return `<a href="${escapeHtml(ok)}"${ext ? ' rel="noopener"' : ''}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  return s;
}

/** Akapity rozdzielone pustą linią → <p>…</p>. */
export function blockMd(input: string): string {
  return input
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${inlineMd(para.replace(/\n/g, ' '))}</p>`)
    .join('');
}
