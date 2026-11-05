/**
 * Kontury znaków IBM Plex Mono do samodzielnych plików SVG (/fig/*.svg). Obraz SVG w <img> nie widzi
 * fontów strony, więc etykiety miniatur są ścieżkami. Kontury daje satori (już używany do OG) — jeden
 * znak na raz, w jednostkach: em = 100, linia bazowa y = 0, szerokość znaku 60 (krój o stałej szerokości).
 */
import satori from 'satori';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const BASELINE = 87; // linia bazowa przy fontSize 100 i lineHeight 1 (zmierzona na „H”)
export const GLYPH_ADVANCE = 60;

type SatoriFont = { name: string; data: Buffer; weight: 500; style: 'normal' };
let fonts: SatoriFont[] | null = null;
const cache = new Map<string, string>();

/**
 * Plik fontu z node_modules: najpierw względem tego modułu (działa z każdego katalogu roboczego, np. walidator
 * uruchomiony spoza repo), potem względem katalogu roboczego (build Astro: moduł bywa w paczce poza repo).
 */
function fontFile(spec: string): Buffer {
  let err: unknown;
  for (const base of [import.meta.url, join(process.cwd(), 'package.json')]) {
    try {
      return readFileSync(createRequire(base).resolve(spec));
    } catch (e) {
      err = e;
    }
  }
  throw err;
}

function loadFonts(): SatoriFont[] {
  if (fonts) return fonts;
  const file = fontFile;
  fonts = [
    { name: 'Plex Mono', weight: 500, style: 'normal', data: file('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff') },
    { name: 'Plex Mono Ext', weight: 500, style: 'normal', data: file('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-500-normal.woff') },
  ];
  return fonts;
}

/**
 * Przesuwa współrzędne ścieżki (tylko M/L/Q/C/Z — tak zapisuje satori) tak, by linia bazowa była w y = 0,
 * zaokrągla do całych jednostek (em = 100: przy 9,5 px to < 0,05 px) i usuwa odcinki zerowej długości.
 */
function rebase(d: string): string {
  const out: string[] = [];
  let cx = NaN;
  let cy = NaN;
  for (const m of d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
    const cmd = m[1];
    const n = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
    if (cmd === 'Z') {
      out.push('Z');
      continue;
    }
    const pts: string[] = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push(`${Math.round(n[i])} ${Math.round(n[i + 1] - BASELINE)}`);
    const [ex, ey] = pts[pts.length - 1].split(' ').map(Number);
    if (cmd === 'L' && ex === cx && ey === cy) continue;
    out.push(cmd + pts.join(' '));
    cx = ex;
    cy = ey;
  }
  return out.join('').replace(/ -/g, '-');
}

/** Kontur znaku (pusta ścieżka dla spacji). */
export async function glyph(ch: string): Promise<string> {
  if (ch === ' ') return '';
  const hit = cache.get(ch);
  if (hit !== undefined) return hit;
  const svg = await satori(
    { type: 'div', props: { style: { display: 'flex', fontFamily: 'Plex Mono, Plex Mono Ext', fontWeight: 500, fontSize: 100, lineHeight: 1, color: '#000' }, children: ch } } as Parameters<typeof satori>[0],
    { width: 100, height: 120, fonts: loadFonts() },
  );
  const d = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => rebase(m[1])).join('');
  cache.set(ch, d);
  return d;
}

/** Kontury dla zestawu znaków: mapa znak → ścieżka. */
export async function glyphs(chars: Iterable<string>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const ch of new Set(chars)) out.set(ch, await glyph(ch));
  return out;
}
