/**
 * Miniatura każdej strony: rysunek izometryczny 360×190 (/fig/<ścieżka>.svg), do kart-odnośników jako <img>.
 * Plik samodzielny: atrybuty prezentacji zamiast stylów, etykiety jako kontury znaków (bez fontów i sieci).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getRoutes, type SiteRoute } from '../../lib/routes.ts';
import { ogKeyFor } from '../../lib/site.ts';
import { isoSpecFor } from '../../lib/iso/spec.ts';
import { renderFile } from '../../lib/iso/render.ts';

export const getStaticPaths: GetStaticPaths = async () => {
  const routes = await getRoutes();
  return routes.map((route) => ({ params: { key: ogKeyFor(route.path) }, props: { route } }));
};

export const GET: APIRoute = async ({ props }) => {
  const route = (props as { route: SiteRoute }).route;
  const svg = await renderFile(await isoSpecFor(route));
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
