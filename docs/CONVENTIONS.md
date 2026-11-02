# Konwencje projektu aura-web (dla ludzi i agentów)

Serwis `https://www.auraconsulting.pl` — Astro 7 (statyczny build), TypeScript strict, treść w kolekcjach MD/MDX z walidacją Zod, hosting Cloudflare Workers Static Assets. Ten dokument jest wiążący dla wszystkich agentów budujących treść. Specyfikacja nadrzędna: `BUILD-SPEC.md` → `PLAN.md` (scratchpad planu).

Spis: [1. Zasady twarde](#1-zasady-twarde) · [2. Mapa własności plików](#2-mapa-własności-plików) · [3. Build równoległy i walidacja](#3-build-równoległy-i-walidacja) · [4. Jak dodać stronę](#4-jak-dodać-stronę) · [5. Frontmatter](#5-frontmatter) · [6. Komponenty](#6-katalog-komponentów) · [7. Etykiety zakresu](#7-etykiety-zakresu) · [8. Bliźniaki .md, SEO/GEO](#8-bliźniaki-md-seo-i-geo) · [9. Design „Arkusz”](#9-design-arkusz) · [10. Pułapki MDX](#10-pułapki-mdx)

---

## 1. Zasady twarde

1. **Poufność.** Nigdy nie wpisuj nazwy londyńskiego MGA, nazw jego produktów i wordingów, numerów ofert, nazw klientów ani charakterystycznych liczb z broszur MGA — nigdzie (treść, komentarze, nazwy plików, commity). Strażnik: `npm run guard` (opis w §3). Fałszywy alarm = przeredaguj tekst; allowlisty nie ma.
2. **Lloyd's** tylko jako „plasowane na rynku Lloyd's” lub „Lloyd's Insurance Company S.A. oraz inni ubezpieczyciele wskazani w ofercie i polisie”. Nigdy: „bezpośredni dostęp do Lloyd's”, „broker Lloyd's”, „coverholder”, logo, odznaka. Na kartach formułę z Lloyd's wstawia layout tylko przy `securityConfirmed: true` + `lloydsShare` — nie pisz jej ręcznie.
3. **Twierdzenia o zakresie** tylko ze źródeł (`scratchpad/pdftext/*.txt`, wcześniej zweryfikowane strony w historii git: `git show HEAD:oc-cyber.html`, `git show HEAD:ubezpieczenie-ai.html`; copy decki `scratchpad/copy_deck*.md`) i zawsze warunkowo: „zwykle w zakresie — zależy od polisy”, „zgodnie z warunkami polisy”, „zakres potwierdzamy w ofercie”. Bez gwarancji, bez „najlepszy”, „nr 1”, „jedyny”, „pełna ochrona”, „100%”, „gwarantujemy”. Bez twierdzeń absolutnych o „polskich polisach” i „ubezpieczycielach” („wiele polis…, sprawdź…” — tak).
4. **Bez cen i kwot z ofert.** Liczby w formacie „1 000 000 zł”.
5. **Każda strona:** „W skrócie” (answer-first, 40–60 słów), H2 jako pytania prostym językiem (tam, gdzie naturalne), tabela zakresu z etykietami warunkowymi, FAQ, źródła (artykuły), data aktualizacji, autor. Scenariusze zawsze z etykietą „scenariusz ilustracyjny” (`<NoteBlock variant="scenario">`).
6. **Autor** = właściciel, Marek Cieśla (`author: marek-ciesla`, domyślne; strona `/zespol/marek-ciesla/`). Zabezpieczenie w kodzie: osoba z nazwą „TODO…” byłaby pokazana jako „Zespół Aura Consulting”. Nie wymyślaj innych osób, numerów RPU ani recenzentów.
7. **Szkice:** artykuły (`wiedza/`) i regulacje (`regulations/`) tworzone przez agentów mają `draft: true`. Strony stałe (główna, filary, karty, słownik, firmowe) mają `draft: false`.
8. **Polszczyzna naturalna**, bez kalek z angielskiego; terminy EN w nawiasie przy pierwszej wzmiance (`<Term en="claims made">…</Term>`).
9. **Bez commitów i pushy** w sesjach agentów, bez zmian na innych gałęziach.

---

## 2. Mapa własności plików

Każdy agent edytuje **wyłącznie** swoje pliki. Pliki współdzielone są **ZAMROŻONE**: zamiast je zmieniać, dopisz prośbę do
`/tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/build-notes/<twój-klucz>.md`
(co, gdzie, dlaczego, propozycja diffu). Koordynator scala prośby.

| Agent (klucz) | Pliki (wyłącznie) |
|---|---|
| `home` | `src/content/pages/home.mdx`, `o-nas.mdx`, `zespol-wlasciciel.mdx` (adres `/zespol/marek-ciesla/`), `informacje-o-brokerze.mdx`, `reklamacje.mdx`, `polityka-prywatnosci.mdx`, `kontakt.mdx`; treść `src/pages/404.astro`; NOWE strony firmowe/prawne jako nowe pliki w `src/content/pages/` (np. `regulamin.mdx`, `o-nas-zasady-redakcyjne.mdx`) |
| `pillar-it` | `src/content/pillars/oc-cyber-dla-it.mdx` oraz segmenty `src/content/pillars/oc-cyber-dla-it/*.mdx` (URL `/oc-cyber-dla-it/<segment>/`) |
| `pillar-ai` | `src/content/pillars/ubezpieczenie-ai.mdx` oraz `src/content/pillars/ubezpieczenie-ai/*.mdx` (np. pod-hub `ai-w-firmie`) |
| `pillars-cyber-pi` | `src/content/pillars/ubezpieczenie-cyber.mdx`, `src/content/pillars/oc-zawodowe.mdx` (+ ich podkatalogi) |
| `catalogue` | `src/content/solutions/*` (karty), `src/content/pages/ubezpieczenia.mdx`, `src/content/pages/rynek-lloyds.mdx` |
| `glossary` | `src/content/glossary/terms.yaml`, `src/content/pages/slownik.mdx`, `src/content/regulations/*` (`ai-act.mdx`, `pld.mdx`) |
| `articles-a` | `src/content/wiedza/ransomware-2-0.mdx`, `pld-a-oc-software-house.mdx`, `ai-act-a-ubezpieczenie.mdx`, `oc-programisty-b2b.mdx`; `src/content/pages/wiedza.mdx` (wstęp indeksu) |
| `articles-b` | `src/content/wiedza/tech-eo-a-oc-zawodowe.mdx`, `klient-wymaga-oc-od-kontraktora.mdx`, `usa-kanada-w-polisie.mdx`, `llmjacking.mdx` |
| `figures` | `src/components/figures/*` (rysunki + `index.ts` z rejestrem i legendami), `src/lib/og/template.ts` (wygląd obrazów OG) |

**Zamrożone (współdzielone):** `astro.config.ts`, `src/content.config.ts`, `src/layouts/*`, `src/components/*` (poza `figures/`), `src/lib/*` (poza `og/template.ts`), `src/styles/*`, `src/pages/*` (poza treścią `404.astro`), `src/integrations/*`, `src/content/people.yaml`, `src/lib/nav.ts`, `public/*`, `scripts/*`, `.github/*`, `wrangler.jsonc`, `package.json`, `docs/*`.

Plik-stub zaczyna się komentarzem `{/* Właściciel: agent „…”. STUB … */}` — usuń go razem z tekstem „W przygotowaniu”, gdy wstawiasz treść. Możesz zmieniać frontmatter swoich plików (w granicach schematu), ale **nie zmieniaj** `path`, `template`, `sheet` ani nazwy pliku (adres URL) bez prośby w build-notes — inni linkują do tych adresów.

### Adresy stron MVP (stałe)

```
/                          pages/home.mdx                 home
/oc-cyber-dla-it/          pillars/oc-cyber-dla-it.mdx    pillar-it
/ubezpieczenie-ai/         pillars/ubezpieczenie-ai.mdx   pillar-ai
/ubezpieczenie-cyber/      pillars/ubezpieczenie-cyber.mdx  pillars-cyber-pi
/oc-zawodowe/              pillars/oc-zawodowe.mdx        pillars-cyber-pi
/ubezpieczenia/            pages/ubezpieczenia.mdx        catalogue
/ubezpieczenia/<karta>/    solutions/<karta>.mdx          catalogue
/rynek-lloyds/             pages/rynek-lloyds.mdx         catalogue
/slownik/                  pages/slownik.mdx + glossary/terms.yaml   glossary
/regulacje/ai-act/         regulations/ai-act.mdx (draft) glossary
/regulacje/pld/            regulations/pld.mdx (draft)    glossary
/wiedza/                   pages/wiedza.mdx               articles-a
/wiedza/<slug>/            wiedza/<slug>.mdx (draft)      articles-a / articles-b
/o-nas/ /zespol/marek-ciesla/ /informacje-o-brokerze/ /reklamacje/ /polityka-prywatnosci/ /kontakt/   home
```

---

## 3. Build równoległy i walidacja

Każdy agent buduje do **własnych** katalogów (inaczej buildy się nadpisują):

```bash
cd /home/user/ac
export ASTRO_OUT_DIR=/tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/build-<twój-klucz>
export ASTRO_CACHE_DIR=/tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/cache-<twój-klucz>
npm run build                 # produkcja (bez szkiców)
PREVIEW=1 npm run build       # podgląd: szkice widoczne, wszystko noindex, bez bliźniaków .md
npm run validate              # bliźniaki + JSON-LD + CSP + linki (czyta ASTRO_OUT_DIR)
npm run guard                 # strażnik: repo + ASTRO_OUT_DIR
```

| Komenda | Co robi |
|---|---|
| `npm run dev` | serwer deweloperski; szkice widoczne; `/<ścieżka>.md` generowane w locie (także dla szkiców) |
| `npm run build` | `astro build` + bliźniaki `.md`, `llms-full.txt`, reguły `_headers` (integracja `src/integrations/aura.ts`) |
| `npm run check` | `astro check` — TypeScript strict + schematy treści |
| `npm run guard` | strażnik poufności (`scripts/guard.mjs`) |
| `npm run validate:twins` | każda indeksowalna strona ma `.md` i odwrotnie; canonical; nagłówki HTML ↔ `.md` |
| `npm run validate:jsonld` | JSON-LD parsuje się; `#org`, `#website`, `#webpage`; typy wg rodzaju strony; FAQ ↔ FAQPage; zakazy |
| `npm run validate:csp` | brak inline `<script>`/`<style>`/`style=`; `_headers` ≤ 100 reguł |
| `npm run links` | linki i kotwice wewnętrzne w HTML, `.md`, `llms.txt`, sitemapach (offline) |
| `npm run validate` | cztery powyższe |
| `npm run ci` | guard → check → build → guard → validate (domyślnie do `dist/`) |

Uwagi:
- Węzeł: w tym środowisku Node 22.22 → Astro przypięte do 7.4.1 (nowsze 7.4.x wymagają Node ≥ 22.23.4). CI używa Node 24.
- Katalog `.astro/` (typy) w korzeniu repo jest wspólny dla wszystkich buildów. Jeśli trafisz na przejściowy błąd czytania `.astro/*.d.ts` przy równoległych buildach — powtórz komendę.
- Strażnik skanuje całe repo (także pliki innych agentów). Komunikat wskazuje plik:linia; jeśli to nie Twój plik, zgłoś w build-notes.
- `.guard/forbidden.local.txt` (git-ignored) — lokalna lista jawnych fraz (po jednej w linii), jeśli właściciel ją przekaże.

---

## 4. Jak dodać stronę

Wszystkie strony są sterowane treścią: jedna trasa `src/pages/[...slug].astro` renderuje wpisy z kolekcji. Dzięki temu HTML, bliźniak `.md`, OG, sitemap, `llms.txt` i RSS powstają z tych samych danych. **Nie twórz nowych plików w `src/pages/`.**

### Artykuł (`/wiedza/<slug>/`)

`src/content/wiedza/<slug>.mdx`:

```mdx
---
title: "Czy polisa OC obejmuje błędy AI?"          # H1 ≤ 65 znaków, jak zapytanie
description: "Krótki opis 120–160 znaków do wyników wyszukiwania i OG."
sheet: "C1-05"                 # numer arkusza (ID z PLAN §6.2)
articleId: "C1-05"
cluster: "C1"
hub: "/ubezpieczenie-ai/"      # ścieżka huba (musi istnieć); hub listuje artykuł w „Arkuszach szczegółowych”
published: 2026-11-02
updated: 2026-11-02
draft: true
summary: "40–60 słów samodzielnej odpowiedzi…"
summaryPoints: ["do 3 punktów", "…"]
keywords: { primary: "czy oc obejmuje błędy ai", secondary: ["halucynacje ai odpowiedzialność"] }
legalStateAsOf: 2026-11-02     # tematy regulacyjne → blok „Stan prawny na”
coverage:
  - { event: "Roszczenie klienta za błędną odpowiedź systemu", module: "OC zawodowe", label: typical, conditions: "jeśli usługa jest w opisie działalności", basis: "≥ 3 wordingi rynkowe" }
faq:
  - { q: "Czy …?", a: "Zwykle … — zależy od polisy. [Słownik](/slownik/#claims-made)." }
sources:
  - { title: "Rozporządzenie (UE) 2024/1689", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", publisher: "EUR-Lex", accessed: 2026-11-02, tier: T1 }
related: ["/wiedza/llmjacking/"]
changelog:
  - { rev: "A", date: 2026-11-02, note: "Pierwsze wydanie." }
---

Pierwszy akapit z linkiem do [huba](/ubezpieczenie-ai/) w pierwszych 150 słowach.

<SectionView label="Przekrój A–A" />
## Co obejmuje OC zawodowe przy błędzie AI?

Odpowiedź w 1–2 zdaniach, potem szczegóły.

<NoteBlock variant="scenario">
Software house wdraża chatbota… (scenariusz ilustracyjny)
</NoteBlock>

## Czego polisa nie obejmuje?
…
```

Layout dokłada automatycznie: okruszki, tabliczkę, „W skrócie”, „Stan prawny na”, tabelę zakresu (z `coverage`), kontakt z numerem arkusza w temacie maila, FAQ, źródła, autora z notą „Jak powstał ten tekst”, rejestr zmian, powiązane arkusze, pełną tabliczkę, formułę (c), JSON-LD (BlogPosting, FAQPage, BreadcrumbList) i OG. **Nie powtarzaj tych bloków w treści.**

### Filar / segment filaru

`src/content/pillars/<id>.mdx` → `/<id>/`; segment: `src/content/pillars/<filar>/<segment>.mdx` → `/<filar>/<segment>/` (pole `pillar` jak u rodzica). Layout: „W skrócie” → rysunek hero (`figure`, z ploterem) → treść (BOM-y, scenariusze, SpecTable, USA i Kanada, „Czego nie obejmuje”) → tabela zakresu → FAQ → „Arkusze szczegółowe” (automatycznie: artykuły z `hub` = ścieżka filaru) → formuły (d), (c) → kontakt → autor → rejestr → źródła.

### Karta katalogu

`src/content/solutions/<slug>.mdx` → `/ubezpieczenia/<slug>/`. Wymagane: `code` (`K-01`…, `R-00`), `group` (grupa w indeksie), `markets`, `priority`. Layout dokłada sekcję „Gdzie szukamy ochrony?” z formułą (b) wg `securityConfirmed`/`lloydsShare`, blok „obowiązkowe a nadwyżka” przy `mandatoryOC: true`, „IPID z ofertą”, formuły (d), (c). Indeks `/ubezpieczenia/` buduje się sam z kart (kolejność `order`).

### Hasło słownika

Dopisz do `src/content/glossary/terms.yaml`:

```yaml
- id: udzial-wlasny            # kotwica: /slownik/#udzial-wlasny
  term: "Udział własny"
  termEn: "deductible"
  definition: "≤ 35 słów, inline Markdown dozwolony."
  see: "/wiedza/…/"            # opcjonalnie: arkusz-właściciel terminu (musi istnieć w buildzie produkcyjnym!)
  related: [suma-gwarancyjna]
```

Linkuj do hasła: `[udział własny](/slownik/#udzial-wlasny)`.

### Strona firmowa / prawna

`src/content/pages/<nazwa>.mdx` z polami `path: "/<adres>/"` i `template:` jednym z: `page`, `legal`, `contact`, `person`, `hub`, `catalogue-index`, `wiedza-index`, `glossary`, `home`. Opcjonalnie `breadcrumbParent: { title, path }`, `showContact: true`. Nowa pozycja w nawigacji/stopce = prośba w build-notes (`src/lib/nav.ts` jest zamrożony).

---

## 5. Frontmatter

Pola wspólne (wszystkie kolekcje stron; schemat: `src/content.config.ts`):

| Pole | Typ | Uwagi |
|---|---|---|
| `title` | string 3–110 | H1. Artykuły ≤ 65 znaków, jak zapytanie |
| `description` | string 50–200 | meta description, OG, llms.txt |
| `seoTitle` | string ≤ 70 | pełny `<title>`; domyślnie „{title} · Aura Consulting” |
| `ogTitle` | string ≤ 90 | tytuł na obrazie OG |
| `slug` | slug | opcjonalnie nadpisuje nazwę pliku (nie używaj bez potrzeby) |
| `sheet` | string | numer arkusza w tabliczce i temacie maila |
| `revision` | string | „A”, „B”… (domyślnie „A”) |
| `published`, `updated` | data | `updated` = `dateModified` w JSON-LD i sitemapie |
| `draft` | bool | szkic (patrz §1.7) |
| `noindex` | bool | strona poniżej progu treści: bez `.md`, poza sitemapą |
| `author` | id osoby | domyślnie `marek-ciesla` |
| `summary`, `summaryPoints` | string, ≤ 3× string | „W skrócie” |
| `keywords` | `{ primary, secondary[] }` | rejestr fraz (PLAN §3.6) |
| `faq` | `[{ q, a }]` | FAQ + FAQPage; `a` = inline Markdown, akapity pustą linią |
| `sources` | `[{ title, url, publisher?, accessed, tier? }]` | numerowane źródła z datą dostępu |
| `coverage` | `[{ event, module?, label, conditions?, basis? }]` | tabela zakresu; `label` — §7 |
| `coveragePlacement` | `auto` / `manual` | `manual` = sam wstawiasz `<BOM rows={frontmatter.coverage} />` |
| `coverageCaption` | string | podpis tabeli zakresu |
| `figure`, `figureCaption` | id rysunku, string | rysunek pod „W skrócie” (filary: z ploterem) |
| `changelog` | `[{ rev, date, note }]` | rejestr zmian (najnowsze na końcu) |
| `related` | ścieżki | „Powiązane arkusze” (nieistniejące w buildzie są pomijane) |
| `legalStateAsOf` | data | blok „Stan prawny na” |
| `reviewEvery` | liczba dni | cykl weryfikacji |
| `aiAssistance` | bool | nota „Jak powstał ten tekst” (domyślnie true dla wiedza/regulacje) |

Pola specyficzne: `pages` — `path`, `template`, `titleAccent`, `lead`, `person`, `breadcrumbParent`, `showContact`, `order`; `pillars` — `pillar` (`it|ai|cyber|pi`), `lead`, `titleAccent`, `markets`, `cardSummary`, `order`; `solutions` — `code`, `group`, `markets`, `priority`, `availabilityConfirmed`, `securityConfirmed`, `lloydsShare`, `mandatoryOC`, `cardSummary`, `order`; `wiedza` — `hub`, `cluster`, `articleId`; `regulations` — `act`, `officialName`, `legalStateAsOf` (wymagane), `timeline[]`, `hub`.

Dane w YAML: daty bez cudzysłowów (`2026-11-02`), teksty z dwukropkiem w cudzysłowach.

---

## 6. Katalog komponentów

W plikach `.mdx` poniższe komponenty są dostępne **bez importu** (mapa: `src/components/mdx.ts`). W treści MDX możesz używać `frontmatter.<pole>`.

| Komponent | Props | Przykład / uwagi |
|---|---|---|
| `NoteBlock` | `variant?: 'note'\|'scenario'\|'legal'\|'warning'\|'exclusion'`, `label?`, `date?` | `<NoteBlock variant="scenario">…</NoteBlock>` — w `.md` staje się cytatem z etykietą |
| `SectionView` | `label`, `title?`, `id?` | nadetykieta dekoracyjna (aria-hidden, nie trafia do `.md`). W MDX: `<SectionView label="Przekrój A–A" />` + w następnej linii `## Pytanie?` |
| `BOM` | `caption`, `rows: CoverageRow[]`, `headers?`, `prefix?`, `id?` | tabela elementów/zakresu z odznakami: `<BOM caption="Moduły polisy cyber" rows={[{ event: "Koszty reakcji na incydent", label: "typical" }]} />` |
| `CoverageBadge` | `label: 'typical'\|'optional'\|'underwriting'\|'excluded'` | `<CoverageBadge label="optional" />` |
| `SpecTable` | `caption`, `columns: string[]`, `rows: string[][]`, `note?`, `id?`, `rowHeaders?` | `<SpecTable caption="Od czego zależy składka" columns={["Parametr","Dlaczego"]} rows={[["Przychód","skala"]]} />` — komórki: inline Markdown |
| `AnnotatedFigure` | `figure?` (id z rejestru), `code?`, `caption?`, `legend?: string[]`, `plotter?`, `grid?`, `uid?` | `<AnnotatedFigure figure="FigPillarIT" />`; `plotter` tylko w hero |
| `Figure` | `id`, `labelledby?`, `title?` | sam rysunek z rejestru |
| `F00Home`, `FigPillarIT`, `FigPillarAI`, `FigPillarCyber`, `FigPillarPI`, `FigLloyds`, `FigCatalogue` | `labelledby?`, `title?` | rysunki techniczne (właściciel `figures`) |
| `PlotterHero` | `grid?`, `class?` | jednorazowe rysowanie dzieci-SVG (elementy z `pathLength="1"`) |
| `DimensionLine` | `label`, `value?` | ozdobna linia wymiarowa (data-md-skip) |
| `Term` | `en?`, `href?` | `<Term en="claims made" href="/slownik/#claims-made">zasada zgłoszenia roszczenia</Term>` |
| `ContactChannels` | `sheet?`, `heading?`, `lead?`, `signal?`, `checklist?`, `id?` | tel, mailto z tematem `[sheet]`, „Kopiuj adres”, „Kopiuj szablon”. Layouty już go dodają — nie duplikuj |
| `SheetCard` | `href`, `title`, `sheet?`, `summary?`, `meta?`, `level?`, `draft?` | karta arkusza |
| `CardGrid` | `columns?: 2\|3`, `label?` | siatka kart: `<CardGrid columns={3}><SheetCard …/></CardGrid>` |
| `AnswerBox` | `summary`, `points?`, `heading?` | „W skrócie” — layouty dodają z frontmattera; w MDX tylko wyjątkowo |

Komponenty layoutów (nie używaj w MDX): `Breadcrumbs`, `TitleBlock`, `SheetHead`, `SheetFoot`, `TOC`, `FAQ`, `Sources`, `AuthorCard`, `RevisionLog`, `Disclosure` (formuły b/c/d z `src/lib/compliance.ts`), `SiteHeader`, `SiteFooter`, `DocBody`, `lists/*`.

### Rysunki (agent `figures`)

Kontrakt pliku `src/components/figures/<Nazwa>.astro`: props `labelledby?`, `title?`; korzeń `<svg class="fig-svg" viewBox="…" role="img" aria-labelledby={labelledby}>`; całe wnętrze w `<g aria-hidden="true">`; tekst w SVG tylko jako etykiety techniczne (treść merytoryczna = legenda HTML w `FIGURE_META` w `index.ts`). Klasy linii (bez atrybutów `style` — CSP): `.c` konstrukcyjna, `.o`/`.o2` obiektu, `.h` ukryta, `.ax` osiowa, `.d` wymiarowa, `.l` odnośnik, `.x` kreskowanie, `.b` balon, `.f` zasłona, `.sig` sygnał (maks. 1), `.t`/`.t-num`/`.t-dim` tekst. Ploter animuje elementy z `pathLength="1"` (≤ 40 na rysunek, nie na liniach kreskowych), kolejność warstw `.c → .o → .l/.d/.b → .t`, ≤ 1,6 s, `prefers-reduced-motion` i brak JS = stan końcowy. Bez zębatek, parasoli, tarcz, ludzi, stocków. Obraz OG: `src/lib/og/template.ts` (satori: tylko flexbox; fonty `OG_SANS`/`OG_MONO`, polskie znaki działają).

Nowy rysunek: korzeń przez `<FigFrame viewBox title desc labelledby>` (role="img", `<title>`/`<desc>`, wnętrze w `<g aria-hidden>`), geometria z `figures/draw.ts` (elipsy rzutu, walce, kreskowanie przycięte do wielokąta, groty ISO, wymiary, chmurka rewizyjna). Klasy dodatkowe z FigFrame: `.ah`/`.ah2` grot tuszem, `.t-b`/`.t-s` etykieta główna/pomocnicza, `.t-m`/`.t-e` wyrównanie, `.t-sig` czerwony podpis przy redline, `.bal` grupa balonu, `.fx` wypełnienia dochodzące w ploterze po liniach, `.t-keep` etykieta zostająca na wąskim ekranie. Na ekranach ≤ 640 px etykiety tekstowe znikają (treść jest w legendzie HTML), balony rosną ×1,75, linie grubieją.

---

## 7. Etykiety zakresu

Zawsze w wersji warunkowej (`src/lib/coverage.ts`):

| Klucz (`label`) | Wyświetlana etykieta | Styl odznaki |
|---|---|---|
| `typical` | ZWYKLE W ZAKRESIE – ZALEŻY OD POLISY | ramka ciągła |
| `optional` | ROZSZERZENIE OPCJONALNE | ramka kreskowa |
| `underwriting` | ZALEŻY OD OCENY RYZYKA | ramka kropkowa |
| `excluded` | ZWYKLE WYŁĄCZONE – ZALEŻY OD POLISY | kreskowanie |

Każde „zwykle” opiera się na ≥ 3 wordingach (w tym ≥ 1 publicznych polskich OWU); warunki stoją obok etykiety (`conditions`). Wording jednego dostawcy nie wystarcza do uogólnienia. Kolejność i nazwy modułów — własne, nie z wordingu.

---

## 8. Bliźniaki .md, SEO i GEO

- **Bliźniak `.md`** powstaje w buildzie z wyrenderowanego HTML (`src/lib/markdown/public-md.ts` — jeden serializer dla `.md` i `llms-full.txt`). Do `.md` trafia obszar `<main data-md-root>` poza elementami `data-md-skip`, `aria-hidden="true"`, `<svg>`, `<button>`. Frontmatter (title, description, canonical, published, updated, author, publisher) pochodzi z `<head>` i JSON-LD. Linki są absolutne. Nie edytuj `.md` ręcznie.
- `/x/` → `/x.md`, `/` → `/index.md`, `/wiedza/a/` → `/wiedza/a.md`. Strony `noindex`/szkice nie mają bliźniaka.
- **Ozdobniki w treści** (nadetykiety, linie wymiarowe) oznaczaj `aria-hidden="true"` lub `data-md-skip`. Treść merytoryczna zawsze w HTML (nie w SVG).
- **JSON-LD** buduje `src/lib/page.ts` + `src/lib/seo/jsonld.ts` (stabilne `@id`: `https://www.auraconsulting.pl/#org`, `#website`, `<url>#webpage`, `#breadcrumb`, `#service`, `#faq`, `#article`, `/slownik/#termset`). FAQPage powstaje tylko z widocznego FAQ (`faq` we frontmatterze). Nie wstawiaj własnych bloków JSON-LD.
- **`llms.txt`**, **`llms-full.txt`**, **`robots.txt`** (polityka botów: `src/lib/seo/bots.ts`, deny tylko Bytespider), **`rss.xml`** (opublikowane artykuły i regulacje), **`sitemap-index.xml`** → `sitemap-pages.xml` (lastmod = `updated`) i **OG** (`/og/<ścieżka>.png`) generują się same.
- **Linkowanie:** do huba w pierwszych 150 słowach; słownik przy pierwszym użyciu terminu; zawsze ścieżki od `/` z ukośnikiem na końcu (`/oc-cyber-dla-it/`, nie `/oc-cyber-dla-it`), kotwice muszą istnieć (sprawdza `npm run links`). Linki do szkiców nie przejdą w buildzie produkcyjnym — w tekstach opublikowanych linkuj tylko do stron opublikowanych (szkic → `related`, tam nieistniejące są pomijane).
- `_headers`/`_redirects` (Cloudflare): `public/` + reguły dopisywane w buildzie. Limit 100 reguł nagłówków pilnuje build.

---

## 9. Design „Arkusz”

Kierunek B — precyzyjny szkicownik ołówkowy, biel `#FFFFFF`, premium, bez gimmicków (PLAN §5). Tokeny: `src/styles/tokens.css` (paleta §5.2: `--ink`, `--ink-2`, `--ink-3` najjaśniejszy tekst, `--graphite` konstrukcja, `--blue` linki/wymiary, `--signal` jedno wypełnione CTA na widok + fokus). Fonty: Archivo 400/600 (tekst, nagłówki), IBM Plex Mono 400/500 (etykiety, tabliczki), Newsreader Italic (jedno słowo-akcent: `titleAccent`). Siatka 12 kolumn, maks. 1312 px, odstęp 24 px, skala 8 px. Bez emoji, stocków, generowanych ludzi, kolorowych teł, smooth-scrolla, efektów maszyny do pisania. Kolor tylko jako tusz na białym papierze. CSP: zero inline `<style>`/`style=`/`<script>` — style tylko w plikach `.astro` (scoped) lub `src/styles/*`.

Typografia polska działa automatycznie (plugin rehype + `polishText()` dla pól frontmattera): twarde spacje po „a, i, o, u, w, z”, między liczbą a jednostką, w grupach tysięcy; cudzysłowy „…” (pisz w źródle `"…"` lub od razu „…”), wielokropek, półpauza. Nie wstawiaj `&nbsp;` ręcznie.

---

## 10. Pułapki MDX

- Klucz `layout` we frontmatterze jest zastrzeżony przez MDX — dlatego strony mają `template`.
- W MDX znaki `{`, `}`, `<` w tekście trzeba ucieczką: `\{`, `&lt;` (lub w backtickach). Komentarz: `{/* … */}` (nie `<!-- -->`).
- Komponenty piszemy wielką literą i bez importu (patrz §6). Atrybuty-tablice/obiekty: `rows={[…]}`.
- Markdown wewnątrz komponentu wymaga pustej linii po znaczniku otwierającym i przed zamykającym.
- Nagłówki `##` w treści trafiają do spisu treści; nagłówek wewnątrz komponentu (`SectionView title=…`) — nie.
- Tabele Markdown (GFM) są dozwolone; dla tabel z podpisem i odznakami użyj `SpecTable`/`BOM` (prawdziwe `<caption>`).
