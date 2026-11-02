// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import { resolve } from 'node:path';
import aura from './src/integrations/aura.ts';
import { rehypePolish, rehypeTables } from './src/lib/typography/polish.ts';
import { rehypeHeadingSlugs } from './src/lib/typography/slug.ts';

// Równoległe buildy (wielu agentów): każdy ustawia własne katalogi.
//   ASTRO_OUT_DIR=/tmp/.../build-<klucz> ASTRO_CACHE_DIR=/tmp/.../cache-<klucz> npm run build
const outDir = process.env.ASTRO_OUT_DIR || './dist';
const cacheDir = process.env.ASTRO_CACHE_DIR || './.astro';
const preview = process.env.PREVIEW === '1' || process.env.PREVIEW === 'true';

export default defineConfig({
  site: 'https://www.auraconsulting.pl',
  trailingSlash: 'always',
  outDir,
  cacheDir,
  output: 'static',
  compressHTML: true,
  prefetch: false, // prefetch robi Speculation-Rules (nagłówek w public/_headers)
  devToolbar: { enabled: false },
  build: {
    format: 'directory',
    // CSP bez 'unsafe-inline': żadnych inline <style>/<script>
    inlineStylesheets: 'never',
    assets: '_astro',
  },
  markdown: {
    processor: unified({
      // kotwice nagłówków PRZED typografią (twarde spacje nie mogą skleić wyrazów w id)
      rehypePlugins: [rehypeHeadingSlugs, rehypePolish, rehypeTables],
      smartypants: {
        openingQuotes: { double: '„', single: '‚' },
        closingQuotes: { double: '”', single: '’' },
        dashes: 'oldschool',
        ellipses: true,
        backticks: false,
      },
    }),
  },
  integrations: [mdx(), aura({ preview })],
  vite: {
    cacheDir: resolve(cacheDir, 'vite'),
    build: {
      // żadnych skryptów/arkuszy inline (CSP); assety zawsze jako pliki
      assetsInlineLimit: 0,
    },
  },
});
