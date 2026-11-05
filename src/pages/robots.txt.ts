import type { APIRoute } from 'astro';
import { BOT_RULES, DISALLOW_PATHS, CONTENT_SIGNAL, PREVIEW_USER_AGENTS, PREVIEW_CONTENT_SIGNAL } from '../lib/seo/bots.ts';
import { SITE } from '../lib/site.ts';
import { PREVIEW } from '../lib/env.ts';

export const GET: APIRoute = () => {
  const lines: string[] = [`# robots.txt — ${SITE.host}`, '# Polityka: PLAN §4.2 (src/lib/seo/bots.ts).', ''];
  if (PREVIEW) {
    // podgląd: noindex (nagłówek X-Robots-Tag) + tylko pobrania na prośbę użytkownika (samokontrola przez agentów AI)
    lines.push('# PREVIEW — nie indeksować; agenci AI mogą pobrać stronę na prośbę użytkownika');
    for (const a of PREVIEW_USER_AGENTS) lines.push(`User-agent: ${a}`);
    lines.push('Allow: /', `Content-Signal: ${PREVIEW_CONTENT_SIGNAL}`, '');
    lines.push('# Wyszukiwarki, boty treningowe i pozostałe', 'User-agent: *', 'Disallow: /', '');
  } else {
    for (const rule of BOT_RULES) {
      lines.push(`# ${rule.role}`);
      for (const a of rule.agents) lines.push(`User-agent: ${a}`);
      if (rule.allow) {
        lines.push('Allow: /');
        for (const p of DISALLOW_PATHS) lines.push(`Disallow: ${p}`);
        // boty z własną grupą czytają tylko ją — sygnał musi być w każdej grupie Allow
        lines.push(`Content-Signal: ${CONTENT_SIGNAL}`);
      } else {
        lines.push('Disallow: /');
      }
      lines.push('');
    }
    lines.push('# Pozostałe boty', 'User-agent: *', 'Allow: /');
    for (const p of DISALLOW_PATHS) lines.push(`Disallow: ${p}`);
    lines.push(`Content-Signal: ${CONTENT_SIGNAL}`, '');
  }
  lines.push(`Sitemap: ${SITE.url}/sitemap-index.xml`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
