# Konwencje projektu aura-web (dla ludzi i agentów)

Serwis `https://www.auraconsulting.pl` — Astro 7 (statyczny build), TypeScript strict, treść w kolekcjach MD/MDX z walidacją Zod, hosting Cloudflare Pages (+ Pages Function `/api/kontakt` — formularz kontaktowy przez Resend). Ten dokument jest wiążący dla wszystkich agentów budujących treść. Specyfikacja nadrzędna: `BUILD-SPEC.md` → `PLAN.md` (scratchpad planu).

Spis: [1. Zasady twarde](#1-zasady-twarde) · [2. Mapa własności plików](#2-mapa-własności-plików) · [3. Build równoległy i walidacja](#3-build-równoległy-i-walidacja) · [4. Jak dodać stronę](#4-jak-dodać-stronę) · [5. Frontmatter](#5-frontmatter) · [6. Komponenty](#6-katalog-komponentów) (w tym [ikony](#ikony) i [interakcje i budżet JS](#interakcje-i-budżet-js)) · [7. Etykiety zakresu](#7-etykiety-zakresu) · [8. Bliźniaki .md, SEO/GEO](#8-bliźniaki-md-seo-i-geo) · [9. Design „Arkusz”](#9-design-arkusz) · [10. Pułapki MDX](#10-pułapki-mdx)

---

## 1. Zasady twarde

1. **Poufność.** Nigdy nie wpisuj nazwy londyńskiego MGA, nazw jego produktów i wordingów, numerów ofert, nazw klientów ani charakterystycznych liczb z broszur MGA — nigdzie (treść, komentarze, nazwy plików, commity). Strażnik: `npm run guard` (opis w §3). Fałszywy alarm = przeredaguj tekst; allowlisty nie ma.
2. **Lloyd's** tylko jako „plasowane na rynku Lloyd's” lub „Lloyd's Insurance Company S.A. oraz inni ubezpieczyciele wskazani w ofercie i polisie”. Nigdy: „bezpośredni dostęp do Lloyd's”, „broker Lloyd's”, „coverholder”, logo, odznaka. Na kartach formułę z Lloyd's wstawia layout tylko przy `securityConfirmed: true` + `lloydsShare` — nie pisz jej ręcznie.
3. **Twierdzenia o zakresie** tylko ze źródeł (`scratchpad/pdftext/*.txt`, wcześniej zweryfikowane strony w historii git: `git show HEAD:oc-cyber.html`, `git show HEAD:ubezpieczenie-ai.html`; copy decki `scratchpad/copy_deck*.md`) i zawsze warunkowo: „zwykle w zakresie — zależy od polisy”, „zgodnie z warunkami polisy”, „zakres potwierdzamy w ofercie”. Bez gwarancji, bez „najlepszy”, „nr 1”, „jedyny”, „pełna ochrona”, „100%”, „gwarantujemy”. Bez twierdzeń absolutnych o „polskich polisach” i „ubezpieczycielach” („wiele polis…, sprawdź…” — tak).
4. **Bez cen i kwot z ofert.** Liczby w formacie „1 000 000 zł”.
5. **Każda strona:** „W skrócie” (answer-first, 40–60 słów), H2 jako pytania prostym językiem (tam, gdzie naturalne), tabela zakresu z etykietami warunkowymi, FAQ, źródła (artykuły), data aktualizacji; autor — tylko artykuły i regulacje (pkt 6). Scenariusze zawsze z etykietą „scenariusz ilustracyjny” (`<NoteBlock variant="scenario">`).
6. **Autor** = właściciel, Marek Cieśla (`author: marek-ciesla`, domyślne; strona `/zespol/marek-ciesla/`). Autor jest pokazywany **tylko przy artykułach (`/wiedza/*`) i regulacjach (`/regulacje/*`)** (decyzja 4.11.2026, `showAuthor` w `src/lib/page.ts`). Filary (także `/ubezpieczenie-ai/ai-w-firmie/`), karty, `/ubezpieczenia/`, `/rynek-lloyds/`, `/slownik/` i strony firmowe/prawne: bez autora w tabliczce, w JSON-LD autorem i wydawcą jest `#org` (bez węzła `Person` — pilnuje `validate:jsonld`), a przy źródłach zamiast noty „Jak powstał ten tekst” stoi linia „Opracowanie: Aura Consulting…” (`editorialNote`). W artykule autor pojawia się **raz** — w zwartej tabliczce pod H1 (link do jego strony); nie dopisuj go w treści, w stopce arkusza ani w notach (nota „Jak powstał ten tekst” nie wspomina autora). Strona `/zespol/marek-ciesla/` opisuje osobę (specjalizacje, sposób pracy), nie autorstwo — bez rejestru „opracowanych arkuszy”. JSON-LD `Person`: opis i specjalizacje z `people.yaml` (`bio`, `knowsAbout`; `jobTitle` tylko potwierdzony przez właściciela). Zabezpieczenie w kodzie: osoba z nazwą „TODO…” byłaby pokazana jako „Zespół Aura Consulting”. Nie wymyślaj innych osób, numerów RPU ani recenzentów.
7. **Szkice i harmonogram:** artykuły (`wiedza/`) i regulacje (`regulations/`) tworzone przez agentów mają `draft: true` — `draft: false` ustawia tylko autor po przeglądzie. Strony stałe (główna, filary, karty, słownik, firmowe) mają `draft: false`. Artykuł lub regulacja trafia do produkcji, gdy `draft: false` **i** `published` ≤ dziś (Europe/Warsaw, w chwili builda) — jedna reguła `isLive` w `src/lib/routes.ts` (logika: `src/lib/schedule.ts`); z niej korzystają strony, blog, huby, „Powiązane”, sitemap, RSS, `llms.txt`/`llms-full.txt` i OG. Nowe teksty dostają kolejny wolny termin co 2 dni (`published` = `updated`; tabela: `docs/TODO-wlasciciel.md` §3b). Nie ustawiaj dat wstecz: zatwierdzenie po terminie wymaga nowej daty (`node scripts/publish-today.mjs --reschedule`), a `--check` w CI odrzuca wpis, którego `published` jest wcześniejszy niż dzień commita z `draft: false`. Arkusz z `legalStateAsOf`: przy zatwierdzeniu sprawdź przepisy ponownie i ustaw `legalStateAsOf` (≤ `published`) na dzień sprawdzenia.
8. **Polszczyzna naturalna**, bez kalek z angielskiego; terminy EN w nawiasie przy pierwszej wzmiance (`<Term en="claims made">…</Term>`).
9. **Bez commitów i pushy** w sesjach agentów, bez zmian na innych gałęziach.
10. **Kontakt = telefon albo formularz** (`/kontakt/#formularz`, `SITE.formPath`). Nie pokazuj adresu e-mail do zapytań, `mailto:` ani przycisków kopiowania — w treści, FAQ, „W skrócie”, `.md`, `llms.txt` i JSON-LD (decyzja 4.11.2026). Wyjątek: kontakt w sprawach danych `warszawa@auraconsulting.pl` w polityce prywatności. Reklamacje: kanał elektroniczny = formularz z dopiskiem „Reklamacja”.
11. **Rejestr zmian nie jest publiczny** (decyzja 4.11.2026). `changelog` zostaje we frontmatterze i w git (pod ewentualny panel admina), ale żaden layout ani `.md` go nie wyświetla — tabliczka pokazuje tylko bieżącą rewizję i daty. Nie pisz w treści o „rejestrze zmian”.

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

**Zamrożone (współdzielone):** `astro.config.ts`, `src/content.config.ts`, `src/layouts/*`, `src/components/*` (poza `figures/`), `src/lib/*` (poza `og/template.ts`), `src/styles/*`, `src/pages/*` (poza treścią `404.astro`), `src/integrations/*`, `src/content/people.yaml`, `src/lib/nav.ts`, `public/*`, `scripts/*`, `.github/*`, `package.json`, `docs/*`.

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
PREVIEW=1 npm run build       # podgląd: szkice i wpisy z harmonogramu widoczne („SZKIC”, „Zaplanowano: dd.mm.rrrr”), wszystko noindex, bez bliźniaków .md
npm run validate              # bliźniaki + JSON-LD + CSP + rysunki iso + linki (czyta ASTRO_OUT_DIR)
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
| `npm run validate:iso` | rysunki izometryczne: miniatura każdej strony, brak procesora, sąsiedzi w siatkach kart, podpisy, rozmiar ≤ 4 KB gz (§6, „Rysunki izometryczne”); `-- --verbose` wypisuje podpisy i siatki |
| `npm run links` | linki i kotwice wewnętrzne w HTML, `.md`, `llms.txt`, sitemapach (offline) |
| `npm run validate` | pięć powyższych |
| `npm run ci` | guard → check → build → guard → validate (domyślnie do `dist/`) |
| `node scripts/publish-today.mjs` | harmonogram: co wchodzi dziś (także zaległe zatwierdzone wpisy bez builda); `--list` cały plan ze stanami; `--check` (krok w CI): link w treści (poza `related`) do szkicu lub późniejszego wpisu, data publikacji wcześniejsza niż zatwierdzenie (git), `legalStateAsOf` > `published` = błąd, stan prawny starszy niż 14 dni w dniu publikacji = ostrzeżenie; `--reschedule [--from=RRRR-MM-DD] [--dry-run]` przenosi szkice po terminie na kolejne wolne terminy co 2 dni |

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

Layout dokłada automatycznie: okruszki, tabliczkę, „W skrócie”, „Stan prawny na”, tabelę zakresu (z `coverage`), kontakt (telefon + formularz; temat wiadomości = znacznik `[AI_AURA]` albo `[CYBER_AURA]` + tytuł strony), FAQ, źródła z jednoliniową notą „Jak powstał ten tekst”, powiązane arkusze, pełną tabliczkę, formułę (c), JSON-LD (BlogPosting, FAQPage, BreadcrumbList) i OG. **Nie powtarzaj tych bloków w treści.**

### Filar / segment filaru

`src/content/pillars/<id>.mdx` → `/<id>/`; segment: `src/content/pillars/<filar>/<segment>.mdx` → `/<filar>/<segment>/` (pole `pillar` jak u rodzica). Layout: „W skrócie” → rysunek hero (`figure`, z ploterem) → treść (BOM-y, scenariusze, SpecTable, USA i Kanada, „Czego nie obejmuje”) → tabela zakresu → FAQ → „Arkusze szczegółowe” (automatycznie: artykuły z `hub` = ścieżka filaru) → formuły (d), (c) → kontakt → powiązane → źródła (z linią „Opracowanie: Aura Consulting…”) → pełna tabliczka. Bez autora.

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
| `published`, `updated` | data | `updated` = `dateModified` w JSON-LD i sitemapie. Artykuły i regulacje: `published` = dzień wejścia na stronę (przyszła data = harmonogram, §1.7) |
| `draft` | bool | szkic (patrz §1.7) |
| `noindex` | bool | strona poniżej progu treści: bez `.md`, poza sitemapą |
| `author` | id osoby | domyślnie `marek-ciesla`; pokazywany tylko w artykułach i regulacjach (§1.6) |
| `summary`, `summaryPoints` | string, ≤ 3× string | „W skrócie” |
| `keywords` | `{ primary, secondary[] }` | rejestr fraz (PLAN §3.6) |
| `faq` | `[{ q, a }]` | FAQ + FAQPage; `a` = inline Markdown, akapity pustą linią |
| `sources` | `[{ title, url, publisher?, accessed, tier? }]` | numerowane źródła z datą dostępu |
| `coverage` | `[{ event, module?, label, conditions?, basis? }]` | tabela zakresu; `label` — §7 |
| `coveragePlacement` | `auto` / `manual` | `manual` = sam wstawiasz `<BOM rows={frontmatter.coverage} />` |
| `coverageCaption` | string | podpis tabeli zakresu |
| `figure`, `figureCaption` | id rysunku, string | rysunek pod „W skrócie” (filary: z ploterem) |
| `iso` | `{ motif?, variant?, labels?, inputs?, plate?, fault? }` / `false` | rysunek izometryczny (§6, „Rysunki izometryczne”): nadpisanie motywu i wariantu z tabeli `src/lib/iso/pages.ts`, podpisów w kolejności slotów motywu (≤ 4, ≤ 28 znaków, bez liczb, słowami z treści strony), wlotów w lewej kolumnie (≤ 2, rurociąg), tabliczki znamionowej (≤ 14 znaków, nigdy marka) i czerwonego podpisu — konkretnego wyłączenia z tabeli zakresu (`false` = bez czerwieni); `iso: false` — bez rysunku w nagłówku |
| `changelog` | `[{ rev, date, note }]` | rejestr zmian (najnowsze na końcu) — dane wewnętrzne, nie wyświetlane na stronach ani w `.md` (§1.11) |
| `related` | ścieżki | „Powiązane arkusze” (nieistniejące w buildzie są pomijane) |
| `legalStateAsOf` | data | blok „Stan prawny na” |
| `reviewEvery` | liczba dni | cykl weryfikacji |
| `aiAssistance` | bool | treść noty przy źródłach (domyślnie true; `src/lib/compliance.ts`): artykuły — „Jak powstał ten tekst” (`creationNote`), filary, karty, `/rynek-lloyds/` — „Opracowanie” (`editorialNote`, bez osoby) |
| `reviewed` | data | dzień przeglądu strony przez autora; dopiero wtedy „Opracowanie” mówi „przed publikacją sprawdzone ze źródłami” (artykuły: zatwierdzenie = `draft: false`) |

Pola specyficzne: `pages` — `path`, `template`, `titleAccent`, `lead`, `person`, `breadcrumbParent`, `showContact`, `order`; `pillars` — `pillar` (`it|ai|cyber|pi`), `lead`, `titleAccent`, `markets`, `cardSummary`, `order`; `solutions` — `code`, `group`, `markets`, `priority`, `availabilityConfirmed`, `securityConfirmed`, `lloydsShare`, `mandatoryOC`, `cardSummary`, `order`; `wiedza` — `hub`, `cluster`, `articleId`; `regulations` — `act`, `officialName`, `legalStateAsOf` (wymagane), `timeline[]`, `hub`.

Dane w YAML: daty bez cudzysłowów (`2026-11-02`), teksty z dwukropkiem w cudzysłowach.

---

## 6. Katalog komponentów

W plikach `.mdx` poniższe komponenty są dostępne **bez importu** (mapa: `src/components/mdx.ts`). W treści MDX możesz używać `frontmatter.<pole>`.

| Komponent | Props | Przykład / uwagi |
|---|---|---|
| `NoteBlock` | `variant?: 'note'\|'scenario'\|'legal'\|'warning'\|'exclusion'`, `label?`, `date?` | `<NoteBlock variant="scenario">…</NoteBlock>` — w `.md` staje się cytatem z etykietą |
| `SectionView` | `label`, `title?`, `id?`, `icon?` | nadetykieta dekoracyjna (aria-hidden, nie trafia do `.md`). W MDX: `<SectionView label="Przekrój A–A" />` + w następnej linii `## Pytanie?` |
| `BOM` | `caption`, `rows: CoverageRow[]`, `headers?`, `prefix?`, `id?` | tabela elementów/zakresu z odznakami: `<BOM caption="Moduły polisy cyber" rows={[{ event: "Koszty reakcji na incydent", label: "typical" }]} />` |
| `CoverageBadge` | `label: 'typical'\|'optional'\|'underwriting'\|'excluded'` | `<CoverageBadge label="optional" />` |
| `SpecTable` | `caption`, `columns: string[]`, `rows: string[][]`, `note?`, `id?`, `rowHeaders?`, `rowIcons?: (string\|null)[]` | `<SpecTable caption="Od czego zależy składka" columns={["Parametr","Dlaczego"]} rows={[["Przychód","skala"]]} />` — komórki: inline Markdown. `rowIcons` (tyle, ile wierszy): ikony przy nagłówkach wierszy — branże, sektory, parametry |
| `Steps` | `caption?`, `steps: { icon?, title, text, result? }[]`, `resultLabel?` | etapy procesu jako schemat przepływu (symbol w ramce → linia z grotem → następny etap); w `.md` lista numerowana. Np. „Jak pracujemy?” na stronie głównej |
| `AnnotatedFigure` | `figure?` (id z rejestru), `code?`, `caption?`, `legend?: string[]`, `plotter?`, `grid?`, `uid?` | `<AnnotatedFigure figure="FigPillarIT" />`; `plotter` tylko w hero |
| `Figure` | `id`, `labelledby?`, `title?` | sam rysunek z rejestru |
| `F00Home`, `FigPillarIT`, `FigPillarAI`, `FigPillarCyber`, `FigPillarPI`, `FigLloyds`, `FigCatalogue` | `labelledby?`, `title?` | rysunki techniczne (właściciel `figures`) |
| `PlotterHero` | `grid?`, `class?` | jednorazowe rysowanie dzieci-SVG (elementy z `pathLength="1"`) |
| `DimensionLine` | `label`, `value?` | ozdobna linia wymiarowa (data-md-skip) |
| `Term` | `en?`, `href?` | `<Term en="claims made" href="/slownik/#claims-made">zasada zgłoszenia roszczenia</Term>` |
| `ContactChannels` | `heading?`, `lead?`, `checklist?`, `id?`, `pageTitle?` | telefon + formularz (`ContactForm`, `#formularz`, temat wiadomości = znacznik `[AI_AURA]` albo `[CYBER_AURA]` + tytuł strony), lista „Co przygotować”. Bez e-maila i kopiowania. Layouty już go dodają — nie duplikuj |
| `SheetCard` | `href`, `title`, `sheet?`, `summary?`, `meta?`, `level?`, `draft?`, `icon?`, `thumb?` | karta arkusza; u góry miniatura strony docelowej (`/fig/<ścieżka>.svg`, tylko strony z buildu; `thumb={false}` wyłącza); symbol w ramce dobierany z adresu (`iconForPath`), `icon="…"` zmienia, `icon={false}` wyłącza |
| `Icon` | `name`, `size?` (20), `title?`, `class?` | ikona z zestawu (niżej); bez `title` dekoracyjna (`aria-hidden`) |
| `CardGrid` | `columns?: 2\|3`, `label?` | siatka kart: `<CardGrid columns={3}><SheetCard …/></CardGrid>` |
| `AnswerBox` | `summary`, `points?`, `heading?` | „W skrócie” — layouty dodają z frontmattera; w MDX tylko wyjątkowo |
| `ProgramConfigurator` | `compact?`, `sheet?`, `preset?` (np. `"ai=tak"`), `uid?` | konfigurator programu (6 pytań → zestawienie elementów, uwagi, „Wyślij konfigurację formularzem”, „Kopiuj podsumowanie”). Pełny na stronie głównej, `compact` na filarach. Bez JS i w `.md` — tabela zasad doboru. Dane i reguły: `src/lib/configurator.ts` — **tylko twierdzenia obecne już na stronach serwisu** |

Komponenty layoutów (nie używaj w MDX): `Breadcrumbs`, `TitleBlock`, `SheetHead`, `SheetFoot`, `TOC`, `FAQ`, `Sources` (z notą `note` i etykietą `noteLabel`), `Disclosure` (formuły b/c/d z `src/lib/compliance.ts`), `SiteHeader`, `SiteFooter`, `NeuralBackground` (tło, raz w `Sheet`), `IsoFigure` (rysunek izometryczny w nagłówku), `DocBody` (slot `aside` — rysunek obok treści na stronach bez spisu treści), `lists/*`.

### Ikony

Zestaw własny w stylu rysunku technicznego: `src/icons/<nazwa>.svg` (siatka 24×24, linia obiektu 1,5, szczegóły i kreskowanie 1, narożniki ostre, końce kwadratowe, `currentColor`, wypełnienia tylko w drobnych akcentach). Lista nazw i reguły doboru: `src/lib/icons.ts` (`ICON_NAMES` — nowy plik `.svg` trzeba tam dopisać, inaczej build się zatrzyma). Komponent: `<Icon name="globe-pin" size={20} />` — inline SVG, bez żądań sieciowych, zgodny z CSP; w `.md` pomijany. Każda ikona trafia do strony raz (`<symbol id="ico-…">` przy pierwszym użyciu, dalej `<use href="#ico-…">`).

| Grupa | Nazwy |
|---|---|
| ochrona, umowy, prawo | `shield-section` (cyber), `contract-seal` (polisa, umowa, gwarancja), `document`, `document-md`, `scales` (prawo, porównanie), `column` (sąd, instytucja) |
| technologia | `code-brackets`, `server-rack`, `cloud`, `neural-node` (AI), `chip`, `network`, `padlock`, `key` (klucz API), `bug`, `browser`, `blocks` (blockchain) |
| świat, branże | `globe`, `globe-pin` (USA i Kanada, terytorium), `bank`, `building`, `house`, `factory`, `medical-cross`, `cart`, `megaphone`, `team`, `compass` (OC zawodowe, architekt), `wrench`, `camera`, `suitcase`, `car`, `truck`, `gamepad`, `book`, `chart` |
| pieniądze, limity, czas | `coins`, `calculator`, `percent`, `gauge` (limit, ocena ryzyka), `calendar` (data retroaktywna, oś czasu), `clock` |
| incydenty | `warning-triangle`, `lightning` (incydent, scenariusz) |
| interfejs | `phone`, `form` (formularz kontaktowy; bez koperty — kontakt nie idzie e-mailem), `copy`, `download`, `arrow-right`, `search` (wyszukiwanie, szukanie ochrony), `magnifier` (lupa z plusem: przyjrzyj się, analiza), `layers` (katalog, moduły), `check-badge`, `x-badge`, `plus-badge`, `info`, `question` |

Gdzie działają same: nawigacja i menu (`iconForPath`), karty `SheetCard`, nadetykiety `SectionView` (z etykiety: „Oś czasu” → `calendar`, „Mapa luk” → `x-badge`, „USA” → `globe-pin`, „Przypadki obciążenia” → `lightning`…), odznaki zakresu (`check-badge` / `plus-badge` / `gauge` / `x-badge`), `NoteBlock`, FAQ (`question`), źródła (`document`), kontakt (`phone`, `form`), tabliczka („Pobierz .md” → `document-md`), stopka. W treści ręcznie tylko tam, gdzie pomagają skanować: `rowIcons` w `SpecTable` (sektory, profesje, parametry), `icon` w `Steps`. Ikona wspiera tekst — nie zastępuje go i nie jest ozdobnikiem; bez emoji.

### Rysunki (agent `figures`)

Kontrakt pliku `src/components/figures/<Nazwa>.astro`: props `labelledby?`, `title?`; korzeń `<svg class="fig-svg" viewBox="…" role="img" aria-labelledby={labelledby}>`; całe wnętrze w `<g aria-hidden="true">`; tekst w SVG tylko jako etykiety techniczne (treść merytoryczna = legenda HTML w `FIGURE_META` w `index.ts`). Klasy linii (bez atrybutów `style` — CSP): `.c` konstrukcyjna, `.o`/`.o2` obiektu, `.h` ukryta, `.ax` osiowa, `.d` wymiarowa, `.l` odnośnik, `.x` kreskowanie, `.b` balon, `.f` zasłona, `.sig` sygnał (maks. 1), `.t`/`.t-num`/`.t-dim` tekst. Ploter animuje elementy z `pathLength="1"` (≤ 40 na rysunek, nie na liniach kreskowych), kolejność warstw `.c → .o → .l/.d/.b → .t`, ≤ 1,6 s, `prefers-reduced-motion` i brak JS = stan końcowy. Bez zębatek, parasoli, tarcz, ludzi, stocków. Obraz OG: `src/lib/og/template.ts` (satori: tylko flexbox; fonty `OG_SANS`/`OG_MONO`, polskie znaki działają).

Nowy rysunek: korzeń przez `<FigFrame viewBox title desc labelledby>` (role="img", `<title>`/`<desc>`, wnętrze w `<g aria-hidden>`), geometria z `figures/draw.ts` (elipsy rzutu, walce, kreskowanie przycięte do wielokąta, groty ISO, wymiary, chmurka rewizyjna). Klasy dodatkowe z FigFrame: `.ah`/`.ah2` grot tuszem, `.t-b`/`.t-s` etykieta główna/pomocnicza, `.t-m`/`.t-e` wyrównanie, `.t-sig` czerwony podpis przy redline, `.bal` grupa balonu, `.fx` wypełnienia dochodzące w ploterze po liniach, `.t-keep` etykieta zostająca na wąskim ekranie. Na ekranach ≤ 640 px etykiety tekstowe znikają (treść jest w legendzie HTML), balony rosną ×1,75, linie grubieją.

Rysunek interaktywny (hero z `plotter`): wpis w `FIGURE_META` ma `parts` (tyle, ile pozycji legendy: `title`, `text` — jedno zdanie z twierdzeń serwisu, `href`, `link`), a elementy SVG części mają `data-part="n"` (także balon `<g class="bal" data-part="n">`, odnośnik i etykiety). Rozbij wspólne ścieżki na części tylko tam, gdzie trzeba podświetlić osobno; limit 40 elementów z `pathLength` dalej obowiązuje. Skrypt dokłada przyciski nad balonami (jeden przystanek Tab, strzałki, Enter przypina, Esc zamyka; nachodzące na wąskim ekranie są rozsuwane), kartę pod rysunkiem — przed wyborem z listą części jako przyciski, potem z „Wszystkie części” — i podświetlenie (niebieski tusz, reszta przygaszona). Bez JS: legenda z linkami w tytułach pozycji.

### Rysunki izometryczne (maszyny i mechanizmy)

Generator w buildzie, bez JS rysującego: `src/lib/iso/` — `geom.ts` (rzut, wektory, okręgi w dowolnej płaszczyźnie), `scene.ts` (kontrakt sceny: 16 motywów, role, `MotifInput`, `Scene`; reguła podpisów `LABEL_MAX` i `HAS_NUMBER` — jedna dla schematu treści, `spec.ts` i walidacji), `prims.ts` (wspólne prymitywy: płyta bazowa, prostopadłościany, pryzmaty, walce w osiach x/y/z, koła zębate, dwuteownik, strzałki, kreskowanie, oś, krzesło, kłódka, szuflada, tabliczka), `motifs/<motyw>.ts` (jeden plik na motyw, rejestr `motifs/index.ts`), `pages.ts` (tabela strona → motyw, wariant, tabliczka, czerwony podpis; rodzina dla nowych stron), `spec.ts` (treść → rysunek), `render.ts` (kadry i SVG), `glyphs.ts` (kontury znaków Plex Mono do plików). Procesora (układu scalonego) nie ma w serwisie.

- **Jeden temat, jedna maszyna** (plan grafik): zespół na osi (program), belka na podporach (OC i cyber dla IT, wymagania kontraktu, terytorium), przekładnia zębata (OC zawodowe), szafa serwerowa (cyber), maszyna modelu AI, manometr ze strefami (AI Act), przenośnik taśmowy (produkt, PLD), instalacja rurowa (przepływy: kontakt, rynek, LLMjacking, transakcje), mechanizm zamka (pieniądze i nadużycia), stół (zarząd), prasa (treść i wzory), pompa strzykawkowa (zdrowie), budynek w przekroju (lokal, mienie), żuraw z przeciwwagą (gwarancje), kaseta z gniazdami (wzorce, dopasowanie), archiwum arkuszy (indeksy, dokumenty). Motyw i wariant ustala tabela `pages.ts`; rysunek jest deterministyczny (ta sama treść → ten sam plik, bez losowości). Nowa strona spoza tabeli dostaje rodzinę z sekcji: karta katalogu — z grupy, artykuł — z huba, regulacja — manometr, filar — z pola `pillar`, strona — z szablonu.
- **Kolor = znaczenie:** tusz — przedmiot i zdarzenie objęte ochroną; błękit — części niosące moduły z tabeli zakresu (gdy podpisy to nie moduły, np. kroki pracy na `/o-nas/` — `ink: true` w `pages.ts`, części w tuszu); czerwień — dokładnie jedna rzecz poza ochroną (konkretne wyłączenie z tabeli zakresu tej strony), zwykle odsunięta poza przerywany obrys ochrony na wspólnej płycie bazowej. Kolory tylko z tokenów (`iso.css` ↔ `render.ts`: dwa szare boki, jeden błękitny i jeden czerwony bok).
- **Gdzie:** nagłówek (obok „W skrócie”) na stronach bez innej grafiki: karty katalogu, artykuły i regulacje, `/ubezpieczenie-ai/ai-w-firmie/`, `/wiedza/`, `/slownik/`, `/kontakt/`, `/o-nas/`, `/zespol/marek-ciesla/` (`showsHeaderIso`). Nie: strona główna, filary, `/ubezpieczenia/`, `/rynek-lloyds/` (mają rysunki ręczne — tylko miniatura) i strony prawne. Miniatura 360×190 — każda strona (`/fig/<ścieżka>.svg`); strony prawne: spokojna (bez podpisów, błękitu, czerwieni i ruchu), każda inny przedmiot.
- **Podpisy:** z treści strony — moduły z `coverage`, hasła słownika, specjalizacje osoby, działy bloga; tabela `pages.ts` albo `iso.labels` ustala kolejność slotów motywu. Prawa kolumna; lewa tylko dla wlotów rurociągu i tam, gdzie odnośnik w prawo przeciąłby przedmiot (np. strefa wysokiego ryzyka na manometrze, dolny rygiel skarbca); czerwony zawsze po prawej. Miniatura ≤ 3 podpisy, nagłówek ≤ 4 (razem z wlotami i czerwonym) — gdy modułów jest więcej, motyw wybiera sloty (`budget(m, { order })`), żeby kotwice nie zbiegały się w jednym punkcie (≥ 12 jedn.). Odstęp między podpisami = pół wiersza (wyraźnie większy niż interlinia). Podpis dłuższy niż 3 wiersze albo podpis poza kadrem po dopasowaniu skali przerywa build (bez cichego obcinania). Węższą kolumnę (więcej miejsca na rysunek) motyw ustawia przez `wrap` w `s.label`.
- **Kadry:** szeroki 560×340 i wąski 330×250 (nagłówek, przełączane zapytaniem o kontener) oraz miniatura 360×190 (obiekt ~60–66% szerokości; wysokie przedmioty mają w miniaturze niższą sylwetkę albo szerszą płytę, żeby nie spaść poniżej ~50%). Skala dopasowana do kadru (motyw może ją ustalić przez `Scene.k` albo powiększyć małą scenę przez `Scene.zoom` — mnożnik największej skali kadru, działa przez macierz, więc ruch rośnie razem z rysunkiem), miejsce na rozsunięcie zarezerwowane — podpisy nie wychodzą poza kadr także w stanie otwartym. Ruch w CSS w jednostkach sceny (geometria pod jedną macierzą skali): grupy w górę o 5 na poziom, zespół na osi wzdłuż osi x, część „poza ochroną” w bok o 10. Linie konstrukcyjne rozciągane (`stretch`) muszą biec wzdłuż osi rozstrzelenia i mieć długość n·G0 — inaczej build się przerywa.
- **Dostępność:** nagłówek — inline SVG z `role="img"`, `aria-labelledby` → `<title>` „<maszyna>: <temat>”, `aria-describedby` → `<desc>` po polsku (co przedstawia maszyna, podpisane części, część poza ochroną). Opis powstaje osobno dla kadru szerokiego i wąskiego i wymienia tylko podpisy, które dany kadr pokazuje. Miniatury w kartach jako `<img alt="">`, w szerokiej karcie najwyżej 460 px (wyśrodkowane). Poza bliźniakiem `.md` (`data-md-skip`).
- **Tabliczki znamionowe:** napis ma w każdym kadrze co najmniej 7 px (`MIN_MARK` w `render.ts`); gdzie byłby mniejszy, znika cała tabliczka (obrys przekazany jako `plate` w `s.mark` / funkcja `nameplate`) — zamiast nieczytelnych „znaczków”. Długie napisy (LLMJACKING, RANSOMWARE, TECH E&O) leżą na płycie bazowej przed maszyną.
- **Miniatury:** samodzielne pliki SVG (atrybuty prezentacji zamiast stylów, etykiety jako kontury znaków — `<img>` nie widzi fontów strony), ~3–4 KB gz, bez `<style>` i zasobów zewnętrznych — zgodne z CSP. Korzeń każdego rysunku (miniatura i nagłówek) ma `data-motif="motyw:wariant"` dla walidacji.

**Motyw → strony** (tabela `MOTIF_BY_PATH` w `src/lib/iso/pages.ts`; plan i uzasadnienie każdego rysunku: `docs/plan-grafik.md`). N+K — rysunek w nagłówku i miniatura, K — tylko miniatura (strona ma rysunek ręczny), S — spokojna miniatura strony prawnej.

| Motyw (`id`) | Warianty | Strony |
|---|---|---|
| zespół na osi (`zespol-osiowy`) | `program`, `sprzeglo` | `/` (K), `/o-nas/`; sprzęgło: `/wiedza/tech-eo-a-oc-zawodowe/` |
| belka na podporach (`belka`) | `ciagla`, `umowa`, `wspornik` | `/oc-cyber-dla-it/` (K); umowa: `/wiedza/klient-wymaga-oc-od-kontraktora/`; wspornik: `/wiedza/usa-kanada-w-polisie/` |
| przekładnia zębata (`przekladnia`) | `para`, `zebnik` | `/oc-zawodowe/` (K); zębnik: `/wiedza/oc-programisty-b2b/` |
| szafa serwerowa (`szafa-serwerowa`) | `firma`, `blokada` | `/ubezpieczenie-cyber/` (K); blokada: `/wiedza/ransomware-2-0/` |
| maszyna modelu AI (`maszyna-ai`) | `model`, `firma` | `/ubezpieczenie-ai/` (K); firma: `/ubezpieczenie-ai/ai-w-firmie/` |
| manometr ze strefami (`manometr`) | `regulacja`, `zawor` | `/regulacje/ai-act/`; zawór: `/wiedza/ai-act-a-ubezpieczenie/` |
| przenośnik taśmowy (`przenosnik`) | `wycofanie`, `aktualizacja`, `naped` | `/ubezpieczenia/oc-produktu-i-wycofanie/`; aktualizacja: `/regulacje/pld/`; napęd: `/wiedza/pld-a-oc-software-house/` |
| instalacja rurowa (`rurociag`) | `kolektor`, `rozdzielacz`, `licznik`, `kolnierz` | `/kontakt/`; rozdzielacz: `/rynek-lloyds/` (K); licznik: `/wiedza/llmjacking/`; kołnierz: `/ubezpieczenia/ubezpieczenia-transakcyjne/` |
| mechanizm zamka (`zamek`) | `wkladka`, `skarbiec`, `kasetka` | `/ubezpieczenia/ubezpieczenie-crime/`; skarbiec: `/ubezpieczenia/instytucje-finansowe-i-fintech/`; kasetka: `/polityka-prywatnosci/` (S) |
| stół (`stol`) | `zarzad`, `pulpit` | `/ubezpieczenia/oc-czlonkow-zarzadu-d-o/`; pulpit: `/reklamacje/` (S) |
| prasa (`prasa`) | `drukarska`, `tlocznik` | `/ubezpieczenia/oc-mediow/`; tłocznik: `/ubezpieczenia/ochrona-prawna-ip/` |
| pompa strzykawkowa (`pompa`) | `strzykawkowa` | `/ubezpieczenia/oc-ochrona-zdrowia/` |
| budynek w przekroju (`budynek`) | `lokal`, `hala` | `/ubezpieczenia/oc-dzialalnosci/`; hala: `/ubezpieczenia/mienie-i-sprzet-elektroniczny/` |
| żuraw z przeciwwagą (`zuraw`) | `wiezowy` | `/ubezpieczenia/gwarancje-ubezpieczeniowe/` |
| kaseta z gniazdami (`kaseta`) | `wzorce`, `na-miare`, `przybory` | `/slownik/`; na miarę: `/ubezpieczenia/ryzyka-nietypowe/`; przybory: `/zespol/marek-ciesla/` |
| archiwum arkuszy (`archiwum`) | `komoda`, `arkusze`, `szafa-aktowa` | `/ubezpieczenia/` (K); arkusze: `/wiedza/`; szafa aktowa: `/informacje-o-brokerze/` (S) |

**Kolory i ruch — znaczenie stałe** (plan grafik, zasady 4–6):

- tusz — przedmiot i zdarzenie objęte ochroną (wyłamany ząb, dorobiony klucz, nielegalny odczep); zdarzenie objęte ochroną nigdy nie jest czerwone;
- błękit (wypełnienie i kropka odnośnika) — tylko części, które niosą podpisany moduł z tabeli zakresu; część bez podpisu zostaje w tuszu;
- czerwień — dokładnie jedna rzecz, której polisa nie niesie, z podpisem = konkretne wyłączenie z tabeli zakresu tej strony (≤ 28 znaków, np. „Kary umowne”); leży poza przerywanym obrysem ochrony i przy otwarciu odsuwa się w bok („wypada” z zespołu). Wyjątki ustalone rysunkami: czerwona strefa tarczy manometru i pokrywa zespołu na osi. Ogólne „Wyłączenia” tylko wtedy, gdy strona nie ma tabeli zakresu (strona główna); nowa strona spoza tabeli dostaje pierwsze wyłączenie z `coverage`, które mieści się w podpisie; bez wyłączenia na stronie — bez czerwieni;
- tabliczka znamionowa — krótki skrót z tytułu (D&O, W&I, TECH E&O, LLMJACKING, RANSOMWARE, AI ACT, A–Z, BROKER, WIEDZA, UMOWA B2B), nigdy marka, ubezpieczyciel, nazwa rynku ani logo;
- bez twarzy: ludzi zastępują puste krzesła i narzędzia; strony prawne — spokojna miniatura (bez podpisów, błękitu, czerwieni i ruchu), każda inny przedmiot.

**Warianty:** motyw to rodzina (temat strony), wariant to wyraźnie inna sylwetka tej samej maszyny. Wariant ustala tabela albo frontmatter. W jednej siatce kart obok siebie mogą stać dwa warianty tego samego motywu (wkładka i skarbiec, trzy przenośniki, belka ciągła i wspornik), ale nigdy ten sam motyw z tym samym wariantem — pilnuje tego `npm run validate:iso` (obok siebie — błąd; 2–3 karty dalej, czyli pod spodem w węższej siatce — ostrzeżenie). Warianty jednej rodziny muszą różnić się sylwetką także w miniaturze (np. belka „umowa” niesie wysoki blok z tabliczką, „wspornik” stoi na dwóch płytach z szeroką przerwą). Nowy wariant: dopisz go do `variants` i `what` w `src/lib/iso/motifs/<motyw>.ts` (pierwszy na liście jest domyślny), narysuj w tym samym pliku i sprawdź miniaturę oraz oba kadry nagłówka w stanie otwartym; nieznany wariant przerywa build.

**Nowa strona — jak dobrać rysunek:**

1. Najpierw temat, nie wygląd: znajdź rodzinę w tabeli wyżej („jeden temat, jedna maszyna” — OC zawodowe to przekładnia, cyber to szafa serwerowa, przepływy to rury, pieniądze i nadużycia to zamek itd.). Bez wpisu strona i tak dostaje rodzinę z sekcji (`fallbackPlan`: karta katalogu — z grupy, artykuł — z huba, regulacja — manometr, filar — z `pillar`, strona — z szablonu).
2. Wybierz wariant, który nie stanie obok tego samego wariantu w „Powiązanych” ani w siatce katalogu/bloga (sprawdź sąsiadów w buildzie: `npm run validate:iso -- --verbose` wypisuje każdą siatkę kart).
3. Dopisz wiersz do `MOTIF_BY_PATH` (`motif`, `variant`, opcjonalnie `plate`, `fault`, `labels`) albo ustaw `iso` we frontmatterze strony.
4. Podpisy: słowa z tej strony (moduły z `coverage`, hasła, specjalizacje), w kolejności slotów motywu (opis slotów — komentarz w pliku motywu); czerwony podpis — konkretne wyłączenie z jej tabeli zakresu.
5. Build i podgląd: miniatura w siatce kart oraz nagłówek szeroki i wąski po rozsunięciu; `npm run validate:iso` musi przejść.

Nowy motyw (siedemnasty) to decyzja właściciela: plik `motifs/<id>.ts` z `motif: MotifModule`, id w `MOTIF_IDS` (`scene.ts`) i w rejestrze `motifs/index.ts`; tylko prymitywy z `prims.ts` (tam też `budget`, `slotTone`), kolory z tokenów, ≤ ~60 ścieżek w miniaturze.

**Frontmatter `iso`** (schemat w `src/content.config.ts`, pierwszeństwo: frontmatter > `MOTIF_BY_PATH` > treść strony):

| Pole | Znaczenie |
|---|---|
| `motif` | jeden z 16 motywów; zmiana motywu bez `variant` daje jego wariant domyślny |
| `variant` | wariant z listy motywu (sprawdzany w buildzie) |
| `labels` | ≤ 4 podpisy w kolejności slotów motywu; ≤ 28 znaków, bez liczb (`HAS_NUMBER`: cyfra wewnątrz słowa, np. „B2B”, dopuszczalna; „Art 5”, „10”, „5%” — nie), słowami z treści strony |
| `inputs` | ≤ 2 wloty w lewej kolumnie (rurociąg: kolektor, rozdzielacz) |
| `plate` | tabliczka znamionowa, ≤ 14 znaków, nigdy marka |
| `fault` | czerwony podpis — konkretne wyłączenie z tabeli zakresu (≤ 28 znaków); `false` = bez czerwieni |

`iso: false` wyłącza rysunek w nagłówku (miniatura zostaje). Przykład: `iso: { variant: wspornik, labels: [OC zawodowe, USA i Kanada], fault: Odszkodowania karne }`.

**Kontrola w CI** (`npm run validate:iso`, `scripts/validate-iso.mjs`, na danych z builda): każda strona ma miniaturę z motywem z listy, nagłówek ma ten sam motyw i wariant co miniatura; brak procesora (motywy `stack`/`qfp`/`pcb`/`bga`, klasy `i-ball`, `i-pin`, `i-pad`, `i-via`, `i-die-line`, `iso-k…`); w żadnej siatce kart obok siebie nie stoi ten sam motyw z tym samym wariantem; podpisy ≤ 28 znaków i bez liczb (w miniaturach odczytywane z konturów znaków), miniatura ≤ 3 podpisy, nagłówek ≤ 4, najwyżej jeden czerwony i zawsze po prawej; strony prawne spokojne; miniatura > 4 KB gz — ostrzeżenie, > 4,5 KB gz — błąd; para rysunków nagłówka > 5 KB gz — ostrzeżenie; `<title>`/`<desc>` niepuste i bez „układu scalonego”. Odczyt podpisów miniatur importuje `glyphs.ts` (fonty rozwiązywane względem modułu, więc działa z każdego katalogu) — wymaga Node z obsługą typów TS (22.18+, w CI 24); gdy kontury są niedostępne, lokalnie to ostrzeżenie, a w CI (zmienna `CI`) błąd; nieznany znak w podpisie miniatury — błąd.

---

### Interakcje i budżet JS

Zasady: wanilia TS w `src/scripts/*.ts`, ładowana przez `<script>` w komponencie, który jej używa (Astro dołącza moduł tylko do stron, na których komponent się renderuje). Progresywne ulepszenie: treść i linki działają bez JS, elementy sterujące mają w HTML `hidden` (więc nie trafiają do `.md`), a skrypt je odsłania; `hidden` ukrywa zawsze (globalnie `display: none !important` w `base.css`, także `.btn`). Regiony `role="status"` dostają tekst początkowy w HTML albo przed odsłonięciem — komunikat tylko po działaniu użytkownika. Bez inline `<script>`/`style=` (CSP `script-src 'self'`) — pozycje i postęp ustawiamy przez CSSOM (`el.style.left`, `transform`). Każda animacja respektuje `prefers-reduced-motion`; dostęp z klawiatury i `role="status"` dla komunikatów. Bez gimmicków: interakcja ma odpowiadać na pytanie użytkownika.

| Skrypt | Komponent → strony | Co robi | gz |
|---|---|---|---|
| `figure-parts.ts` | `AnnotatedFigure` (hero z `parts`) → `/`, filary | części rysunku jako przyciski (nachodzące na wąskim ekranie są rozsuwane), lista części w miejscu karty przed wyborem, karta objaśnienia z „Wszystkie części” | ≈ 1,6 KB |
| `configurator.ts` + `copy.ts` | `ProgramConfigurator` → `/`, `/oc-cyber-dla-it/`, `/ubezpieczenie-ai/` | reguły `evaluate()`, zestawienie, przekazanie do formularza (pole `[data-cform-config]` + zdarzenie `cform-config`; na `/kontakt/` przez `sessionStorage`) — bez importu z `contact-form.ts`, schowek, `sessionStorage` | ≈ 2,6 KB |
| `catalogue-filter.ts` | `CatalogueIndex` → `/ubezpieczenia/` | filtry ryzyko × branża, stan w `#ryzyko=…&branza=…` | ≈ 0,8 KB |
| `glossary-search.ts` | `GlossaryList` → `/slownik/` | wyszukiwanie bez polskich znaków, licznik, litery bez wyników | ≈ 0,7 KB |
| `toc-spy.ts` | `TOC` → artykuły, filary, karty, strony z TOC | ≥ 1280 px: bieżąca sekcja (`aria-current`), linia postępu czytania; poniżej: spis jako `<details>` na początku treści (bez JS też działa) + przycisk „Spis treści” przy dolnej krawędzi, gdy spis zniknie z widoku | ≈ 0,9 KB |
| `copy.ts` | konfigurator | „Skopiowano” na przycisku + komunikat dla czytnika | ≈ 0,4 KB |
| `contact-form.ts` | `ContactForm` (w `ContactChannels`) → karty, filary, strony firmowe | ładowany leniwie (`import()`) przy pierwszym fokusie w formularzu albo przekazaniu z konfiguratora; wysyłka fetch → `/api/kontakt`, błędy przy polach (awaria → telefon). Bez JS: walidacja przeglądarki, POST i powrót na `#formularz-wyslano` / `#formularz-blad` (komunikat przez CSS `:target`) | ≈ 1,1 KB (ładowacz) + 1,3 KB na żądanie |
| (bez zmian) | `SiteHeader`, `PlotterHero` | menu `<dialog>` (link „Menu” zamieniany na `<button aria-haspopup="dialog">`), jednorazowe rysowanie hero | 0,4 + 0,4 KB |
| `iso-explode.ts` | `IsoFigure` → karty, artykuły, regulacje, „AI w firmie”, `/wiedza/`, `/slownik/`, `/kontakt/`, `/o-nas/`, `/zespol/…` | rysunek izometryczny: przy pierwszym wejściu w widok części rozsuwają się odrobinę dalej (klasa `.is-open`, ruch w CSS); jednorazowo, przy `prefers-reduced-motion` nic | ≈ 0,3 KB |
| `neural-bg.ts` | `NeuralBackground` (layout `Sheet` + 404) → wszystkie strony | tło: dryfująca siatka węzłów na `<canvas>` pod treścią; kursor (tylko `pointer: fine`, nie dotyk) wzmacnia linie i lekko przyciąga węzły; ~30 kl./s bez ruchu kursora, stop w ukrytej karcie, gęstość wg powierzchni (≤ 70, wąski ekran ≤ 30), DPR ≤ 2; nie startuje przy `prefers-reduced-motion` i `saveData`; niczego nie zapisuje w przeglądarce (każda strona losuje nową siatkę) | ≈ 1,3 KB |

Budżet na stronę (suma gz skryptów ładowanych od razu, build 5.11.2026; leniwy `contact-form.ts` 1,3 KB poza sumą): filary z konfiguratorem ≈ 7,9 KB, strona główna ≈ 7,0 KB, pozostałe filary ≈ 5,5 KB, karty i strony firmowe z formularzem ≈ 3,8 KB, `/informacje-o-brokerze/` ≈ 3,5 KB, `/ubezpieczenia/` ≈ 3,3 KB, strony prawne i `/rynek-lloyds/` ≈ 2,5 KB, `/slownik/` ≈ 2,5 KB, `/wiedza/` ≈ 1,8 KB, 404 ≈ 1,6 KB. Filary są tuż pod limitem — nowy skrypt na filarze wymaga odchudzenia innego albo decyzji o limicie. Limit: pojedynczy skrypt ≤ 8 KB gz; strona ≤ 8 KB gz. Mikrointerakcje bez JS (CSS): linia wymiarowa pod linkami w tekście i u dołu kart po najechaniu, krótkie rozwijanie FAQ (`::details-content`, Chromium; gdzie indziej od razu).

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
- **JSON-LD** buduje `src/lib/page.ts` + `src/lib/seo/jsonld.ts` (stabilne `@id`: `https://www.auraconsulting.pl/#org`, `#website`, `<url>#webpage`, `#breadcrumb`, `#service`, `#faq`, `#article`, `/slownik/#termset`). FAQPage powstaje tylko z widocznego FAQ (`faq` we frontmatterze). `#org` nie ma pola `email`: kontakt to `telephone` i `contactPoint.url` = formularz. Nie wstawiaj własnych bloków JSON-LD.
- **`llms.txt`**, **`llms-full.txt`**, **`robots.txt`** (polityka botów: `src/lib/seo/bots.ts`, deny tylko Bytespider), **`rss.xml`** (opublikowane artykuły i regulacje), **`sitemap-index.xml`** → `sitemap-pages.xml` (lastmod = `lastModified()` z `src/lib/routes.ts`: `updated`, a na `/wiedza/` i hubach — nowsza z `updated` i daty najnowszego opublikowanego wpisu na liście; to samo trafia do `WebPage.dateModified`) i **OG** (`/og/<ścieżka>.png`) generują się same.
- **Linkowanie:** do huba w pierwszych 150 słowach; słownik przy pierwszym użyciu terminu; zawsze ścieżki od `/` z ukośnikiem na końcu (`/oc-cyber-dla-it/`, nie `/oc-cyber-dla-it`), kotwice muszą istnieć (sprawdza `npm run links`). Linki do szkiców i wpisów z późniejszą datą nie przejdą w buildzie produkcyjnym — w treści linkuj tylko do stron opublikowanych wcześniej (pozostałe → `related`, tam nieistniejące są pomijane; pilnuje `publish-today.mjs --check`).
- `_headers`/`_redirects` (Cloudflare): `public/` + reguły dopisywane w buildzie. Limit 100 reguł nagłówków pilnuje build.

---

## 9. Design „Arkusz”

Kierunek B — precyzyjny szkicownik ołówkowy, biel `#FFFFFF`, premium, bez gimmicków (PLAN §5). Tokeny: `src/styles/tokens.css` (paleta §5.2: `--ink`, `--ink-2`, `--ink-3` najjaśniejszy tekst, `--graphite` konstrukcja, `--blue` linki/wymiary, `--signal` jedno wypełnione CTA na widok + fokus). Fonty: Archivo 400/600 (tekst, nagłówki), IBM Plex Mono 400/500 (etykiety, tabliczki), Newsreader Italic (jedno słowo-akcent: `titleAccent`). Siatka 12 kolumn, maks. 1312 px, odstęp 24 px, skala 8 px. Bez emoji, stocków, generowanych ludzi, kolorowych teł, smooth-scrolla, efektów maszyny do pisania. Kolor tylko jako tusz na białym papierze. Tło serwisu: bardzo jasna siatka węzłów (`NeuralBackground`, linie grafitowe ≤ 10% krycia, część węzłów w błękicie) pod treścią — bloki z drobnym tekstem (tabele, tabliczki, karty, formularze, FAQ, spisy, źródła, stopka) leżą na białym papierze: lista w `src/styles/base.css` („tło z siatką”); nowy komponent z drobnym tekstem bez własnego tła dopisz do tej listy. Akapity treści mogą leżeć nad siatką. CSP: zero inline `<style>`/`style=`/`<script>` — style tylko w plikach `.astro` (scoped) lub `src/styles/*`.

Typografia polska działa automatycznie (plugin rehype + `polishText()` dla pól frontmattera): twarde spacje po „a, i, o, u, w, z”, między liczbą a jednostką, w grupach tysięcy, przed pauzą i półpauzą (myślnik nie zaczyna wiersza); cudzysłowy „…” (pisz w źródle `"…"` lub od razu „…”), wielokropek, półpauza. Nie wstawiaj `&nbsp;` ręcznie.

---

## 10. Pułapki MDX

- Klucz `layout` we frontmatterze jest zastrzeżony przez MDX — dlatego strony mają `template`.
- W MDX znaki `{`, `}`, `<` w tekście trzeba ucieczką: `\{`, `&lt;` (lub w backtickach). Komentarz: `{/* … */}` (nie `<!-- -->`).
- Komponenty piszemy wielką literą i bez importu (patrz §6). Atrybuty-tablice/obiekty: `rows={[…]}`.
- Markdown wewnątrz komponentu wymaga pustej linii po znaczniku otwierającym i przed zamykającym.
- Nagłówki `##` w treści trafiają do spisu treści; nagłówek wewnątrz komponentu (`SectionView title=…`) — nie.
- Tabele Markdown (GFM) są dozwolone; dla tabel z podpisem i odznakami użyj `SpecTable`/`BOM` (prawdziwe `<caption>`).
