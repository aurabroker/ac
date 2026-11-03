/**
 * Integracja „aura” — post-processing builda:
 *  1. bliźniaki `.md` dla każdej indeksowalnej strony HTML (toPublicMarkdown),
 *  2. `llms-full.txt` (wszystkie bliźniaki w kolejności z llms.txt),
 *  3. dopisanie do `_headers` reguł `Link: rel=canonical` dla bliźniaków najwyższego poziomu
 *     (sekcje /wiedza/, /ubezpieczenia/, /regulacje/, /zespol/ obsługują reguły ze splatem w public/_headers),
 *  4. w trybie PREVIEW: `X-Robots-Tag: noindex, nofollow` na wszystkim.
 * W `astro dev` serwuje `/<ścieżka>.md` w locie (ten sam serializer).
 */
import type { AstroIntegration } from 'astro';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPublicMarkdown } from '../lib/markdown/public-md.ts';
import { SITE, mdPathFor, pagePathForMd } from '../lib/site.ts';
import { CONDITIONAL_REDIRECTS } from '../lib/redirects.ts';

const SECTION_SPLAT = /^\/(wiedza|ubezpieczenia|regulacje|zespol)\/.+\.md$/;
const MAX_HEADER_RULES = 100;

async function* walkHtml(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '_astro' || e.name === 'og') continue;
      yield* walkHtml(p);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      yield p;
    }
  }
}

function pagePathFromFile(outDir: string, file: string): string | null {
  const rel = relative(outDir, file).split(sep).join('/');
  if (rel === '404.html' || rel === '500.html') return null;
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '/');
}

function countRules(headers: string): number {
  return headers.split('\n').filter((l) => l.length > 0 && !/^\s/.test(l) && !l.startsWith('#')).length;
}

export default function aura(opts: { preview: boolean }): AstroIntegration {
  return {
    name: 'aura',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            if (!url.pathname.endsWith('.md') || url.pathname.startsWith('/@')) return next();
            const addr = server.httpServer?.address();
            const port = addr && typeof addr === 'object' ? addr.port : 4321;
            const pagePath = pagePathForMd(decodeURIComponent(url.pathname));
            const r = await fetch(`http://localhost:${port}${pagePath}`, { headers: { accept: 'text/html' } });
            if (!r.ok) return next();
            // w dev także szkice (noindex) — podgląd bliźniaka dla autora
            const out = toPublicMarkdown(await r.text(), { force: true });
            if (!out) return next();
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader('X-Robots-Tag', 'noindex');
            res.end(out.markdown);
          } catch (e) {
            logger.warn(`bliźniak .md (dev): ${(e as Error).message}`);
            next();
          }
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const twins: string[] = [];
        let skipped = 0;
        for await (const file of walkHtml(outDir)) {
          const pagePath = pagePathFromFile(outDir, file);
          if (!pagePath) continue;
          const html = await readFile(file, 'utf8');
          // w PREVIEW (cały serwis noindex) także bliźniaki — autor sprawdza „Pobierz .md” na podglądzie
          const result = toPublicMarkdown(html, { force: opts.preview });
          if (!result) {
            skipped++;
            continue;
          }
          const expected = SITE.url + pagePath;
          if (result.canonical !== expected) {
            throw new Error(`Bliźniak .md: canonical ${result.canonical} ≠ ${expected} (${file})`);
          }
          const mdPath = mdPathFor(pagePath);
          const target = join(outDir, mdPath);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, result.markdown, 'utf8');
          twins.push(mdPath);
        }
        twins.sort();
        logger.info(`bliźniaki .md: ${twins.length} (pominięte noindex: ${skipped})`);

        // llms-full.txt — kolejność jak w llms.txt, potem pozostałe
        const llmsPath = join(outDir, 'llms.txt');
        const order: string[] = [];
        if (existsSync(llmsPath)) {
          const llms = await readFile(llmsPath, 'utf8');
          const re = /\(\s*https:\/\/www\.auraconsulting\.pl(\/[^)\s]*\.md)\s*\)/g;
          for (const m of llms.matchAll(re)) if (!order.includes(m[1])) order.push(m[1]);
        }
        for (const t of twins) if (!order.includes(t)) order.push(t);
        const parts: string[] = [
          `# ${SITE.name} — pełna treść serwisu (llms-full.txt)`,
          '',
          `> Wszystkie publiczne strony ${SITE.host} w formacie Markdown. Wersją kanoniczną każdej strony jest HTML (adres w polu \`canonical\`). Kontakt: ${SITE.email} · ${SITE.phone}.`,
          '',
        ];
        // Każdy dokument: jednolinijkowy nagłówek zamiast frontmattera YAML (w środku pliku YAML + „---”
        // parsowałby się jako nagłówek setext) i bez powtarzanej stopki — stopka raz, na końcu pliku.
        let sharedFooter = '';
        for (const mdPath of order) {
          const f = join(outDir, mdPath);
          if (!existsSync(f)) continue;
          const raw = (await readFile(f, 'utf8')).trim();
          const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
          const field = (k: string) =>
            (fm ? (new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(fm[1])?.[1] ?? '') : '').trim().replace(/^["']|["']$/g, '');
          let body = fm ? raw.slice(fm[0].length).trim() : raw;
          const footAt = body.lastIndexOf('\n---\n');
          if (footAt >= 0) {
            sharedFooter ||= body.slice(footAt + 5).trim();
            body = body.slice(0, footAt).trim();
          }
          const updated = field('updated');
          const header = `Źródło: ${field('canonical') || SITE.url + pagePathForMd(mdPath)} · Markdown: ${SITE.url}${mdPath}${updated ? ` · Zaktualizowano: ${updated}` : ''}`;
          parts.push('', '* * *', '', header, '', body, '');
        }
        if (sharedFooter) parts.push('', '* * *', '', sharedFooter, '');
        const full = parts.join('\n') + '\n';
        await writeFile(join(outDir, 'llms-full.txt'), full, 'utf8');
        const kb = Buffer.byteLength(full) / 1024;
        if (kb > 2048) logger.warn(`llms-full.txt ma ${kb.toFixed(0)} KB (> 2 MB) — podziel plik.`);
        else if (kb > 1024) logger.warn(`llms-full.txt ma ${kb.toFixed(0)} KB (> 1 MB).`);

        // _headers — canonical dla bliźniaków najwyższego poziomu + PREVIEW
        const headersPath = join(outDir, '_headers');
        let headers = existsSync(headersPath) ? await readFile(headersPath, 'utf8') : '';
        const generated: string[] = ['', '# --- wygenerowane w buildzie (src/integrations/aura.ts) ---'];
        for (const mdPath of twins) {
          // HTML → bliźniak (rel=alternate) tylko dla stron, które go mają
          generated.push(pagePathForMd(mdPath), `  Link: <${mdPath}>; rel="alternate"; type="text/markdown"`);
          if (SECTION_SPLAT.test(mdPath)) continue;
          generated.push(mdPath, `  Link: <${SITE.url}${pagePathForMd(mdPath)}>; rel="canonical"`);
        }
        if (opts.preview) {
          headers = ['# PREVIEW: cały serwis noindex', '/*', '  X-Robots-Tag: noindex, nofollow', '', headers].join('\n');
        }
        headers = headers.trimEnd() + '\n' + generated.join('\n') + '\n';
        const rules = countRules(headers);
        if (rules > MAX_HEADER_RULES) {
          throw new Error(
            `_headers ma ${rules} reguł (limit Cloudflare: ${MAX_HEADER_RULES}). Przenieś nagłówki .md do Workera (docs/adr/001-negocjacja-markdown.md).`,
          );
        }
        await writeFile(headersPath, headers, 'utf8');
        logger.info(`_headers: ${rules}/${MAX_HEADER_RULES} reguł${opts.preview ? ' (PREVIEW: noindex)' : ''}`);

        // _redirects — reguły zależne od publikacji (src/lib/redirects.ts) na początku pliku,
        // przed regułami ogólnymi (splat) z public/_redirects
        const redirectsPath = join(outDir, '_redirects');
        const staticRules = existsSync(redirectsPath) ? await readFile(redirectsPath, 'utf8') : '';
        const staticFrom = new Set(
          staticRules
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith('#'))
            .map((l) => l.split(/\s+/)[0]),
        );
        const dyn: string[] = ['# --- wygenerowane w buildzie (src/lib/redirects.ts) ---'];
        for (const r of CONDITIONAL_REDIRECTS) {
          const published = existsSync(join(outDir, r.to, 'index.html'));
          const target = published ? r.to : r.fallback;
          // cel zastępczy tymczasowo (302) — 301 zostałby w cache przeglądarek po publikacji artykułu
          const status = published ? 301 : 302;
          if (!existsSync(join(outDir, target, 'index.html'))) {
            throw new Error(`_redirects: cel ${target} nie istnieje w buildzie (src/lib/redirects.ts)`);
          }
          for (const from of r.from) {
            if (staticFrom.has(from)) throw new Error(`_redirects: ${from} jest już w public/_redirects — usuń duplikat`);
            dyn.push(`${from.padEnd(40)} ${target.padEnd(24)} ${status}`);
          }
        }
        const [head, ...rest] = staticRules.split(/\n(?=[^#\n])/);
        const merged = staticRules.startsWith('#')
          ? [head.trimEnd(), ...dyn, '# --- reguły stałe (public/_redirects) ---', rest.join('\n').trimEnd()].join('\n')
          : [...dyn, '# --- reguły stałe (public/_redirects) ---', staticRules.trimEnd()].join('\n');
        await writeFile(redirectsPath, merged + '\n', 'utf8');
        logger.info(`_redirects: ${dyn.length - 1} reguł zależnych od publikacji`);
      },
    },
  };
}
