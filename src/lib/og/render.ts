/**
 * Render OG: satori (drzewo → SVG) + @resvg/resvg-js (SVG → PNG 1200×630).
 * Fonty z @fontsource (woff; satori nie obsługuje woff2). Infrastruktura — plik współdzielony.
 * Polskie znaki są w podzbiorze latin-ext, który ładujemy pod OSOBNĄ nazwą („Archivo Ext”, „Plex Mono Ext”) —
 * satori nie łączy podzbiorów o tej samej nazwie. W szablonie używaj list: OG_SANS / OG_MONO z template.ts.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { ogTemplate, type OgInput } from './template.ts';

type SatoriFont = { name: string; data: Buffer; weight: 400 | 600; style: 'normal' };

let fonts: SatoriFont[] | null = null;

function loadFonts(): SatoriFont[] {
  if (fonts) return fonts;
  // rozwiązywanie z katalogu projektu (build może mieć outDir poza repo)
  const req = createRequire(join(process.cwd(), 'package.json'));
  const file = (spec: string) => readFileSync(req.resolve(spec));
  fonts = [
    { name: 'Archivo', weight: 600, style: 'normal', data: file('@fontsource/archivo/files/archivo-latin-600-normal.woff') },
    { name: 'Archivo Ext', weight: 600, style: 'normal', data: file('@fontsource/archivo/files/archivo-latin-ext-600-normal.woff') },
    { name: 'Archivo', weight: 400, style: 'normal', data: file('@fontsource/archivo/files/archivo-latin-400-normal.woff') },
    { name: 'Archivo Ext', weight: 400, style: 'normal', data: file('@fontsource/archivo/files/archivo-latin-ext-400-normal.woff') },
    { name: 'Plex Mono', weight: 400, style: 'normal', data: file('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff') },
    { name: 'Plex Mono Ext', weight: 400, style: 'normal', data: file('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-400-normal.woff') },
  ];
  return fonts;
}

export async function renderOgPng(input: OgInput): Promise<Uint8Array> {
  const svg = await satori(ogTemplate(input) as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: loadFonts(),
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, background: '#ffffff' }).render().asPng();
  return new Uint8Array(png);
}

/**
 * Logo rastrowe dla JSON-LD (Organization.logo): kwadrat 512×512, tekst zamieniony na ścieżki przez satori,
 * więc nie zależy od fontów u konsumenta (Google wymaga ≥ 112 px i formatu rastrowego lub SVG z krzywymi).
 */
export async function renderLogoPng(size = 512): Promise<Uint8Array> {
  const el = (style: Record<string, unknown>, children: unknown) => ({ type: 'div', props: { style, children } });
  const tree = el(
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
    },
    el(
      {
        width: size - 80,
        height: size - 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '6px solid #16191d',
        color: '#16191d',
        fontFamily: 'Archivo, Archivo Ext',
      },
      [
        el({ fontSize: 112, fontWeight: 600, letterSpacing: 14, lineHeight: 1, paddingLeft: 14 }, 'AURA'),
        el({ width: 280, height: 3, background: '#16191d', marginTop: 24, marginBottom: 24 }, ''),
        el({ fontSize: 40, fontWeight: 600, letterSpacing: 8, lineHeight: 1, paddingLeft: 8 }, 'CONSULTING'),
      ],
    ),
  );
  const svg = await satori(tree as Parameters<typeof satori>[0], { width: size, height: size, fonts: loadFonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: '#ffffff' }).render().asPng();
  return new Uint8Array(png);
}
