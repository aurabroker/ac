/** Logo rastrowe 512×512 (PNG) dla Organization.logo w JSON-LD: /brand/logo.png. */
import type { APIRoute } from 'astro';
import { renderLogoPng } from '../../lib/og/render.ts';

export const GET: APIRoute = async () => {
  const png = await renderLogoPng(512);
  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
};
