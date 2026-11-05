/** RSS: opublikowane arkusze wiedzy i regulacje (50 najnowszych). Drafty nigdy. */
import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getRoutes } from '../lib/routes.ts';
import { SITE } from '../lib/site.ts';
import { displayName, getPerson } from '../lib/people.ts';
import { escapeHtml, inlineMd } from '../lib/inline-md.ts';

export const GET: APIRoute = async () => {
  const items = (await getRoutes())
    .filter((r) => (r.kind === 'article' || r.kind === 'regulation') && r.indexable)
    .sort((a, b) => b.entry.data.published.getTime() - a.entry.data.published.getTime())
    .slice(0, 50);
  return rss({
    title: `${SITE.name} — Wiedza`,
    description: 'Arkusze wiedzy brokera ubezpieczeniowego: OC zawodowe, cyber, AI, regulacje.',
    // <link> kanału = indeks arkuszy; linki pozycji są ścieżkami absolutnymi od korzenia domeny
    site: `${SITE.url}/wiedza/`,
    trailingSlash: true,
    xmlns: { atom: 'http://www.w3.org/2005/Atom', dc: 'http://purl.org/dc/elements/1.1/' },
    customData: `<language>pl-pl</language><atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>`,
    items: await Promise.all(
      items.map(async (r) => {
        const d = r.entry.data;
        const author = displayName(await getPerson(d.author));
        const points = d.summaryPoints.map((p) => `<li>${inlineMd(p)}</li>`).join('');
        return {
          title: d.title,
          link: r.path,
          pubDate: d.published,
          description: d.description,
          // autor bez adresu e-mail (RSS <author> wymaga adresu) — kontakt publiczny: telefon i formularz
          customData: `<dc:creator>${escapeHtml(author)}</dc:creator>`,
          content: `<p><strong>W skrócie:</strong> ${inlineMd(d.summary)}</p>${points ? `<ul>${points}</ul>` : ''}<p><a href="${SITE.url}${r.path}">Czytaj cały arkusz</a></p>`,
        };
      }),
    ),
  });
};
