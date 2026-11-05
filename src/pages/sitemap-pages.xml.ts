/** Mapa stron: lastmod = lastModified() (to samo co WebPage.dateModified). Tylko strony indeksowalne. */
import type { APIRoute } from 'astro';
import { getRoutes, lastModified } from '../lib/routes.ts';
import { SITE } from '../lib/site.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async () => {
  const routes = (await getRoutes()).filter((r) => r.indexable);
  const urls = (
    await Promise.all(
      routes.map(
        async (r) => `  <url>
    <loc>${esc(SITE.url + r.path)}</loc>
    <lastmod>${(await lastModified(r)).toISOString().slice(0, 10)}</lastmod>
  </url>`,
      ),
    )
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
