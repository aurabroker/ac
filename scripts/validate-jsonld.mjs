#!/usr/bin/env node
// Walidacja JSON-LD w każdej stronie HTML:
//  - każdy blok <script type="application/ld+json"> parsuje się jako JSON,
//  - @graph zawiera #org (InsuranceAgency + Organization), #website i <url>#webpage z dateModified,
//  - wymagane typy wg rodzaju strony (data-kind na <body>):
//      pillar/solution → Service; article → BlogPosting; regulation → Article; glossary → DefinedTermSet,
//      każda strona poza główną → BreadcrumbList; widoczne FAQ (<section class="faq">) ↔ FAQPage,
//  - referencje {"@id": …} do węzłów lokalnych istnieją w grafie,
//  - zakazy (PLAN §4.4): bez HowTo, speakable, aggregateRating/review, Offer/price, memberOf, „Lloyd's” w serviceType.
import { outDir, walk, pagePathOf, read, report, SITE } from './lib/dist.mjs';

const root = outDir();
const errors = [];
const warnings = [];
let pages = 0;
let blocks = 0;

const typesOf = (n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]);
const FORBIDDEN_TYPES = new Set(['HowTo', 'Offer', 'AggregateOffer', 'AggregateRating', 'Review']);
const FORBIDDEN_KEYS = ['speakable', 'aggregateRating', 'review', 'offers', 'price', 'priceRange', 'memberOf'];

function collectRefs(value, refs) {
  if (Array.isArray(value)) value.forEach((v) => collectRefs(v, refs));
  else if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === '@id') refs.add(value['@id']);
    else for (const k of keys) collectRefs(value[k], refs);
  }
}
function walkKeys(value, fn, path = '') {
  if (Array.isArray(value)) value.forEach((v, i) => walkKeys(v, fn, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      fn(k, v, path);
      walkKeys(v, fn, `${path}.${k}`);
    }
  }
}

for (const file of walk(root, new Set(['_astro', 'og']))) {
  if (!file.endsWith('.html')) continue;
  const pagePath = pagePathOf(root, file);
  const html = read(file);
  const label = pagePath ?? file;
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (!pagePath) continue; // 404
  pages++;
  // długości dla wyników wyszukiwania (ostrzeżenie, nie błąd): <title> ≤ 60, description ≤ 160 znaków
  {
    const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const t = dec(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '');
    const d = dec(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '');
    if ([...t].length > 60) warnings.push(`${label}: <title> ma ${[...t].length} znaków (> 60)`);
    if ([...d].length > 160) warnings.push(`${label}: description ma ${[...d].length} znaków (> 160)`);
  }
  if (!scripts.length) {
    errors.push(`${label}: brak JSON-LD`);
    continue;
  }
  const nodes = [];
  for (const s of scripts) {
    blocks++;
    try {
      const data = JSON.parse(s[1]);
      if (data['@context'] !== 'https://schema.org') errors.push(`${label}: @context ≠ https://schema.org`);
      nodes.push(...(Array.isArray(data['@graph']) ? data['@graph'] : [data]));
    } catch (e) {
      errors.push(`${label}: JSON-LD nie parsuje się (${e.message})`);
    }
  }
  const url = SITE + pagePath;
  const byId = new Map(nodes.filter((n) => n['@id']).map((n) => [n['@id'], n]));
  const has = (t) => nodes.some((n) => typesOf(n).includes(t));

  const org = byId.get(`${SITE}/#org`);
  if (!org) errors.push(`${label}: brak węzła #org`);
  else {
    for (const t of ['InsuranceAgency', 'Organization']) if (!typesOf(org).includes(t)) errors.push(`${label}: #org bez typu ${t}`);
    for (const k of ['legalName', 'address', 'telephone', 'email', 'taxID', 'identifier']) if (!org[k]) errors.push(`${label}: #org bez pola ${k}`);
  }
  if (!byId.get(`${SITE}/#website`)) errors.push(`${label}: brak węzła #website`);
  const page = byId.get(`${url}#webpage`);
  if (!page) errors.push(`${label}: brak węzła ${url}#webpage`);
  else {
    if (page.url !== url) errors.push(`${label}: WebPage.url ≠ ${url}`);
    if (!page.dateModified) errors.push(`${label}: WebPage bez dateModified`);
  }

  const kind = /<body[^>]*data-kind="([^"]+)"/.exec(html)?.[1] ?? '';
  const need = [];
  if (kind === 'pillar' || kind === 'solution') need.push('Service');
  if (kind === 'article') need.push('BlogPosting');
  if (kind === 'regulation') need.push('Article');
  if (kind === 'glossary') need.push('DefinedTermSet');
  if (kind === 'contact') need.push('ContactPage');
  if (kind === 'person') need.push('ProfilePage');
  if (pagePath !== '/') need.push('BreadcrumbList');
  for (const t of need) if (!has(t)) errors.push(`${label}: brak wymaganego typu ${t} (data-kind=${kind})`);

  const faqVisible = /<section[^>]*class="[^"]*\bfaq\b/.test(html);
  if (faqVisible && !has('FAQPage')) errors.push(`${label}: widoczne FAQ bez FAQPage`);
  if (!faqVisible && has('FAQPage')) errors.push(`${label}: FAQPage bez widocznego FAQ`);
  if (faqVisible) {
    const faqNode = nodes.find((n) => typesOf(n).includes('FAQPage'));
    const qs = (faqNode?.mainEntity ?? []).length;
    const ds = (html.match(/class="faq__item"/g) ?? []).length;
    if (qs !== ds) errors.push(`${label}: FAQPage ma ${qs} pytań, a strona ${ds}`);
  }

  // referencje lokalne
  const refs = new Set();
  nodes.forEach((n) => collectRefs(n, refs));
  for (const r of refs) {
    if (r.startsWith(SITE) && !byId.has(r)) errors.push(`${label}: odwołanie do nieistniejącego @id ${r}`);
  }

  // zakazy
  for (const n of nodes) {
    for (const t of typesOf(n)) if (FORBIDDEN_TYPES.has(t)) errors.push(`${label}: zakazany typ ${t}`);
    walkKeys(n, (k, v) => {
      if (FORBIDDEN_KEYS.includes(k)) errors.push(`${label}: zakazane pole ${k}`);
      if ((k === 'serviceType' || k === 'areaServed') && /lloyd/i.test(JSON.stringify(v))) errors.push(`${label}: „Lloyd's” w ${k}`);
      if (k === '@type' && (v === 'HowTo' || (Array.isArray(v) && v.includes('HowTo')))) errors.push(`${label}: HowTo`);
    });
  }
}

for (const w of warnings) console.warn(`  ! ${w}`);
report('JSON-LD', errors, `${pages} stron, ${blocks} bloków`);
