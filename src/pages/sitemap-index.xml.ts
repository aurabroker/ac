/** Indeks sitemap (jedna mapa stron; bez .md, bez noindex i szkiców). */
import type { APIRoute } from 'astro';
import { getRoutes, lastModified } from '../lib/routes.ts';
import { SITE } from '../lib/site.ts';

export const GET: APIRoute = async () => {
  const routes = (await getRoutes()).filter((r) => r.indexable);
  const dates = await Promise.all(routes.map(lastModified));
  const last = dates.reduce((m, d) => (d > m ? d : m), new Date(0));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE.url}/sitemap-pages.xml</loc>${routes.length ? `\n    <lastmod>${last.toISOString().slice(0, 10)}</lastmod>` : ''}
  </sitemap>
</sitemapindex>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
