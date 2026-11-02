/** Obraz OG 1200×630 dla każdej strony: /og/<ścieżka>.png (np. /og/index.png, /og/wiedza/llmjacking.png). */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getRoutes, type SiteRoute } from '../../lib/routes.ts';
import { ogKeyFor } from '../../lib/site.ts';
import { fmtDate } from '../../lib/format.ts';
import { renderOgPng } from '../../lib/og/render.ts';

const KIND_LABEL: Record<SiteRoute['kind'], string> = {
  page: 'ARKUSZ',
  pillar: 'FILAR',
  solution: 'KARTA',
  article: 'ARTYKUŁ',
  regulation: 'REGULACJA',
};

export const getStaticPaths: GetStaticPaths = async () => {
  const routes = await getRoutes();
  return routes.map((route) => ({ params: { key: ogKeyFor(route.path) }, props: { route } }));
};

export const GET: APIRoute = async ({ props }) => {
  const route = (props as { route: SiteRoute }).route;
  const d = route.entry.data;
  const png = await renderOgPng({
    title: d.ogTitle ?? d.title,
    sheet: d.sheet,
    revision: d.revision,
    date: fmtDate(d.updated),
    kind: route.path === '/' ? 'BROKER' : KIND_LABEL[route.kind],
    path: route.path,
  });
  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
};
