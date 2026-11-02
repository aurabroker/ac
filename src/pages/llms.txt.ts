/**
 * llms.txt (≤ 10 KB): encja + kuratorowana lista stron. Każdy wpis linkuje najpierw kanoniczny HTML,
 * potem bliźniaka .md. Tylko strony indeksowalne. Kolejność wyznacza też kolejność w llms-full.txt.
 */
import type { APIRoute } from 'astro';
import { getRoutes, type SiteRoute, type PageEntry } from '../lib/routes.ts';
import { SITE, ADDRESS_LINE, mdPathFor } from '../lib/site.ts';

/**
 * Krótki opis (≤ 140 znaków) — llms.txt musi zmieścić się w 10 KB przy rosnącej liczbie stron.
 * Zdania dzielimy tylko przed wielką literą (nie po „sp. z o.o.”, „np.”, „m.in.”); zbyt krótkie
 * pierwsze zdanie (np. pytanie) uzupełniamy następnym.
 */
function shortDesc(d: string): string {
  const sentences = d.split(/(?<=[.!?…])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„"(])/);
  let out = sentences[0] ?? d;
  for (let i = 1; i < sentences.length && out.length < 60; i++) out += ' ' + sentences[i];
  if (out.length <= 140) return out;
  const cut = out.slice(0, 138);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,:;—–-]\s*$/, '') + '…';
}

const line = (r: SiteRoute, compact = false) =>
  `- [${r.entry.data.machineTitle ?? r.entry.data.title}](${SITE.url}${r.path}) ([md](${SITE.url}${mdPathFor(r.path)}))` +
  (compact ? '' : `: ${shortDesc(r.entry.data.description)}`);

const LIMIT = 10 * 1024;

export const GET: APIRoute = async () => {
  const routes = (await getRoutes()).filter((r) => r.indexable);
  const byOrder = (a: SiteRoute, b: SiteRoute) =>
    ((a.entry.data as { order?: number }).order ?? 100) - ((b.entry.data as { order?: number }).order ?? 100) ||
    a.path.localeCompare(b.path, 'pl');
  const pages = routes.filter((r) => r.kind === 'page');
  const layoutOf = (r: SiteRoute) => (r.entry as PageEntry).data.template;
  const home = pages.filter((r) => r.path === '/');
  const pillars = routes.filter((r) => r.kind === 'pillar').sort(byOrder);
  const hubs = pages.filter((r) => ['catalogue-index', 'wiedza-index', 'glossary', 'hub'].includes(layoutOf(r))).sort(byOrder);
  const cards = routes.filter((r) => r.kind === 'solution').sort(byOrder);
  const knowledge = routes.filter((r) => r.kind === 'article' || r.kind === 'regulation');
  const company = pages.filter((r) => r.path !== '/' && !hubs.includes(r)).sort(byOrder);
  const hasFeedItems = knowledge.length > 0;

  const render = (compactSecondary: boolean) => {
    const out: string[] = [
      `# ${SITE.name}`,
      '',
      `> ${SITE.legalName} — broker ubezpieczeniowy (zezwolenie KNF nr ${SITE.knfPermit}, rejestr brokerów ${SITE.brokerRegister}, KRS ${SITE.krs}, NIP ${SITE.nip}). Analizujemy oferty z rynku krajowego i zagranicznego, w tym londyńskiego: OC zawodowe i cyber dla firm IT, ubezpieczenie AI, ubezpieczenie cyber dla firm, OC zawodowe dla firm usługowych.`,
      '',
      `Kontakt: ${SITE.email} · ${SITE.phone} · ${ADDRESS_LINE}. Wersją kanoniczną każdej strony jest HTML; pliki .md to czyste wersje tekstowe tych samych stron. Treści mają charakter informacyjny — zakres ochrony określają dokumenty ubezpieczenia.`,
      '',
    ];
    const section = (title: string, list: SiteRoute[], compact = false) => {
      if (!list.length) return;
      out.push(`## ${title}`, '', ...list.map((r) => line(r, compact)), '');
    };
    section('Start', home);
    section('Główne obszary', pillars);
    section('Katalog i wiedza', hubs);
    section('Katalog ubezpieczeń', cards, compactSecondary);
    section('Arkusze wiedzy i regulacje', knowledge);
    section('Firma i informacje prawne', company, compactSecondary);
    // „## Optional” — jedyna nazwa sekcji, której specyfikacja llms.txt nadaje znaczenie (można pominąć)
    out.push('## Optional', '', `- [Pełna treść serwisu](${SITE.url}/llms-full.txt): wszystkie strony w jednym pliku Markdown`);
    if (hasFeedItems) out.push(`- [Kanał RSS](${SITE.url}/rss.xml): nowe arkusze wiedzy`);
    out.push('');
    return out.join('\n');
  };

  // ≤ 10 KB: przy przekroczeniu karty i strony firmowe tracą opisy
  let body = render(false);
  if (Buffer.byteLength(body) > LIMIT) body = render(true);
  if (Buffer.byteLength(body) > LIMIT) console.warn(`[llms.txt] ${Buffer.byteLength(body)} B > 10 KB — skróć listę lub opisy.`);
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
