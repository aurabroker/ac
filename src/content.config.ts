/**
 * Kolekcje treści + schematy Zod. Zły frontmatter = błąd builda.
 * Opis pól i przykłady: docs/CONVENTIONS.md.
 *
 * Adresy (trailingSlash: always):
 *   pages        → pole `path` (np. "/", "/o-nas/")
 *   pillars      → /<id>/
 *   solutions    → /ubezpieczenia/<id>/
 *   wiedza       → /wiedza/<id>/
 *   regulations  → /regulacje/<id>/
 * id = nazwa pliku bez rozszerzenia (lub pole `slug`, jeśli podane).
 */
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { COVERAGE_KEYS } from './lib/coverage.ts';

const PATH_RE = /^\/(?:[a-z0-9-]+\/)*$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const faqItem = z.object({
  /** Pytanie prostym językiem. */
  q: z.string().min(5),
  /** Odpowiedź (inline Markdown: **pogrubienie**, *kursywa*, [link](/sciezka/)). */
  a: z.string().min(5),
});

const source = z.object({
  title: z.string().min(3),
  url: z.url(),
  publisher: z.string().optional(),
  /** Data dostępu (YYYY-MM-DD). */
  accessed: z.coerce.date(),
  /** T1 prawo/regulatorzy · T2 oficjalne źródła rynkowe · T3 prasa/raporty. */
  tier: z.enum(['T1', 'T2', 'T3']).optional(),
});

const coverageRow = z.object({
  event: z.string().min(2),
  module: z.string().optional(),
  label: z.enum(COVERAGE_KEYS),
  conditions: z.string().optional(),
  basis: z.string().optional(),
});

const changelogItem = z.object({
  rev: z.string().min(1),
  date: z.coerce.date(),
  note: z.string().min(2),
});

/** Pola wspólne każdej strony indeksowalnej. */
const base = z.object({
  /** H1 (≤ 65 znaków; dla artykułów brzmi jak zapytanie). */
  title: z.string().min(3).max(110),
  /** Meta description (≈ 120–160 znaków). */
  description: z.string().min(50).max(200),
  /** Pełny <title>, jeśli inny niż „{title} · Aura Consulting”. */
  seoTitle: z.string().max(70).optional(),
  /**
   * Tytuł opisowy dla maszyn (WebPage.name, tytuł bliźniaka .md, wpis w llms.txt), gdy H1 jest hasłem,
   * np. na stronie głównej. Domyślnie title.
   */
  machineTitle: z.string().min(3).max(110).optional(),
  /** Tytuł na obrazie OG (domyślnie title). */
  ogTitle: z.string().max(90).optional(),
  /** Opcjonalny slug (nadpisuje nazwę pliku jako id). */
  slug: z.string().regex(SLUG_RE).optional(),
  /** Numer arkusza w tabliczce rysunkowej, np. „IT-000”, „K-01”, „B2-06”. */
  sheet: z.string().min(2).max(16),
  /** Rewizja (A, B, C…). */
  revision: z.string().default('A'),
  published: z.coerce.date(),
  updated: z.coerce.date(),
  /** Szkic: nie trafia do produkcji (ani sitemap/llms/RSS); buduje się tylko z PREVIEW=1 (noindex). */
  draft: z.boolean().default(false),
  /** noindex dla stron poniżej progu treści (bez bliźniaka .md, poza sitemapą). */
  noindex: z.boolean().default(false),
  /** id osoby z src/content/people.yaml. */
  author: z.string().default('marek-ciesla'),
  /** „W skrócie”: 40–60 słów samodzielnej odpowiedzi. */
  summary: z.string().min(10),
  /** Do 3 punktów pod „W skrócie”. */
  summaryPoints: z.array(z.string()).max(3).default([]),
  keywords: z
    .object({
      primary: z.string().optional(),
      secondary: z.array(z.string()).default([]),
    })
    .default({ secondary: [] }),
  faq: z.array(faqItem).default([]),
  sources: z.array(source).default([]),
  /** Tabela zakresu (BOM z etykietami warunkowymi). */
  coverage: z.array(coverageRow).default([]),
  /** 'auto' = layout wstawia tabelę zakresu po treści; 'manual' = autor wstawia <BOM rows={frontmatter.coverage} /> sam. */
  coveragePlacement: z.enum(['auto', 'manual']).default('auto'),
  coverageCaption: z.string().optional(),
  /** id rysunku z src/components/figures/index.ts (np. „FigPillarIT”). */
  figure: z.string().optional(),
  figureCaption: z.string().optional(),
  /** Rejestr zmian (najnowsze na końcu). */
  changelog: z.array(changelogItem).default([]),
  /** Powiązane arkusze — ścieżki stron, np. „/wiedza/llmjacking/”. */
  related: z.array(z.string().regex(PATH_RE)).default([]),
  /** Stan prawny na (tematy regulacyjne). */
  legalStateAsOf: z.coerce.date().optional(),
  /** Co ile dni weryfikować treść. */
  reviewEvery: z.number().int().positive().optional(),
  /**
   * Nota „Jak powstał ten tekst” (pomoc AI). Domyślnie TAK — teksty serwisu powstawały z pomocą agentów AI.
   * `false` tylko dla tekstu napisanego od zera przez autora (bez narzędzi AI).
   * Przegląd i zatwierdzenie przez autora każdej publikowanej strony blokuje start (docs/TODO-wlasciciel.md §3).
   */
  aiAssistance: z.boolean().default(true),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: base.extend({
    /** Adres strony, np. "/", "/o-nas/", "/zespol/marek-ciesla/". */
    path: z.string().regex(PATH_RE),
    /** Szablon strony (nie „layout” — to słowo zastrzeżone przez MDX). */
    template: z.enum(['home', 'page', 'legal', 'contact', 'person', 'catalogue-index', 'wiedza-index', 'glossary', 'hub']),
    /** Słowo-akcent w H1 (Newsreader Italic), musi występować w title. */
    titleAccent: z.string().optional(),
    /** Lead pod H1 (strona główna, huby). */
    lead: z.string().optional(),
    /** Dla template: person — id osoby z people.yaml. */
    person: z.string().optional(),
    /** Rodzic w okruszkach (domyślnie tylko „Start”). */
    breadcrumbParent: z.object({ title: z.string(), path: z.string().regex(PATH_RE) }).optional(),
    /** Pokaż blok kontaktowy na końcu strony. */
    showContact: z.boolean().default(false),
    /** Kolejność w nawigacji/llms.txt (mniejsza = wyżej). */
    order: z.number().default(100),
  }),
});

const pillars = defineCollection({
  loader: glob({ base: './src/content/pillars', pattern: '**/*.{md,mdx}' }),
  schema: base.extend({
    pillar: z.enum(['it', 'ai', 'cyber', 'pi']),
    /** Service.serviceType w JSON-LD (domyślnie wg filaru; pod-huby nadpisują). */
    serviceType: z.string().optional(),
    lead: z.string().optional(),
    titleAccent: z.string().optional(),
    markets: z.array(z.enum(['krajowy', 'zagraniczny'])).default(['krajowy', 'zagraniczny']),
    /** Krótki opis na kartach w indeksach. */
    cardSummary: z.string().optional(),
    order: z.number().default(100),
  }),
});

const solutions = defineCollection({
  loader: glob({ base: './src/content/solutions', pattern: '**/*.{md,mdx}' }),
  schema: base.extend({
    /** Kod karty z PLAN §7.2, np. „K-01”, „R-00”. */
    code: z.string().regex(/^[A-Z]-\d{2}$/),
    /** Grupa w indeksie katalogu (np. „Odpowiedzialność zarządu i finanse”). */
    group: z.string().min(2),
    markets: z.array(z.enum(['krajowy', 'zagraniczny'])).min(1),
    priority: z.enum(['P1', 'P2', 'P3']),
    /** Dostępność dla ryzyk z PL potwierdzona. */
    availabilityConfirmed: z.boolean().default(false),
    /** Ubezpieczyciel / udział Lloyd's / dokument potwierdzone — tylko wtedy formuła (b) z Lloyd's. */
    securityConfirmed: z.boolean().default(false),
    lloydsShare: z.enum(['full', 'partial']).optional(),
    /** Zawód z obowiązkowym OC → blok „obowiązkowe a nadwyżka”. */
    mandatoryOC: z.boolean().default(false),
    cardSummary: z.string().optional(),
    order: z.number().default(100),
  }),
});

const wiedza = defineCollection({
  loader: glob({ base: './src/content/wiedza', pattern: '**/*.{md,mdx}' }),
  schema: base.extend({
    /** Hub artykułu — ścieżka filaru/karty, np. „/oc-cyber-dla-it/”. Hub listuje artykuł. */
    hub: z.string().regex(PATH_RE),
    /** Klaster z PLAN §3.2, np. „A1”, „C4”. */
    cluster: z.string().optional(),
    /** ID tematu z PLAN §6.2, np. „B2-06”. */
    articleId: z.string().optional(),
    aiAssistance: z.boolean().default(true),
  }),
});

const regulations = defineCollection({
  loader: glob({ base: './src/content/regulations', pattern: '**/*.{md,mdx}' }),
  schema: base.extend({
    /** Krótka nazwa aktu, np. „AI Act”, „PLD”. */
    act: z.string().min(2),
    officialName: z.string().optional(),
    /** Wymagane dla regulacji. */
    legalStateAsOf: z.coerce.date(),
    timeline: z.array(z.object({ date: z.string(), event: z.string() })).default([]),
    hub: z.string().regex(PATH_RE).optional(),
    aiAssistance: z.boolean().default(true),
  }),
});

const glossary = defineCollection({
  loader: file('./src/content/glossary/terms.yaml'),
  schema: z.object({
    /** Kotwica na /slownik/#<id>. */
    id: z.string().regex(SLUG_RE),
    term: z.string().min(2),
    /** Termin angielski (alternateName). */
    termEn: z.string().optional(),
    /** Definicja ≤ 35 słów (inline Markdown). */
    definition: z.string().min(10),
    /** Artykuł-właściciel terminu lub strona z rozwinięciem. */
    see: z.string().regex(PATH_RE).optional(),
    related: z.array(z.string()).default([]),
  }),
});

const people = defineCollection({
  loader: file('./src/content/people.yaml'),
  schema: z.object({
    id: z.string().regex(SLUG_RE),
    /** Dopóki zaczyna się od „TODO”, strony pokazują „Zespół Aura Consulting”, a JSON-LD używa Organization. */
    name: z.string(),
    role: z.string(),
    /** Funkcja w spółce (JSON-LD `jobTitle`) — tylko potwierdzona przez osobę; brak = pole pominięte. */
    jobTitle: z.string().optional(),
    /** Jedno zdanie o osobie (JSON-LD `description`), zgodne z jej stroną. */
    bio: z.string().optional(),
    /** Specjalizacje (JSON-LD `knowsAbout`). */
    knowsAbout: z.array(z.string()).default([]),
    linkedin: z.string().default(''),
    photo: z.string().nullable().default(null),
    sameAs: z.array(z.url()).default([]),
    /** Ścieżka strony osoby. */
    path: z.string().regex(PATH_RE).optional(),
  }),
});

export const collections = { pages, pillars, solutions, wiedza, regulations, glossary, people };
