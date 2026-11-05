// TYMCZASOWE (sesja poprawek): zrzut specyfikacji rysunków do podglądu bez builda. Usunąć przed CI.
import type { APIRoute } from 'astro';
import { getRoutes } from '../lib/routes.ts';
import { isoSpecFor, showsHeaderIso } from '../lib/iso/spec.ts';

export const GET: APIRoute = async () => {
  const out: Record<string, unknown> = {};
  for (const r of await getRoutes()) out[r.path] = { ...(await isoSpecFor(r)), header: showsHeaderIso(r) };
  return new Response(JSON.stringify(out, null, 1), { headers: { 'Content-Type': 'application/json' } });
};
