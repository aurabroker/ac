# Cloudflare — checklista konfiguracji (strefa auraconsulting.pl)

Serwis: Worker **`aura-web`** z samymi zasobami statycznymi (Workers Static Assets, `wrangler.jsonc`), bez własnego kodu Workera w MVP. Kanoniczny host: `https://www.auraconsulting.pl`. Strefa DNS jest już na Cloudflare — nie ruszamy rekordów poczty (MX, SPF, DKIM, DMARC, autodiscover, TXT).

## 1. Konto, plan, sekrety

- [ ] Plan **Workers Paid** (limit Free 100 tys. wywołań/dobę liczy się dla całego konta; skok crawla botów = błędy).
- [ ] Token API dla CI: uprawnienia „Workers Scripts: Edit” (konto), bez edycji DNS i ustawień strefy.
- [ ] Sekrety GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- [ ] Token administracyjny (route'y, DNS, ustawienia strefy) — tylko u właściciela/maintainera, nigdy w CI.

## 2. Wdrożenie i adresy

- [ ] Pierwszy deploy z `main` (`deploy.yml` → `wrangler deploy`) tworzy Worker `aura-web`. Route'y NIE są w `wrangler.jsonc` — deploy bez `routes` nie zmienia route'ów ustawionych w panelu (sprawdź po pierwszym deployu).
- [ ] Route **`www.auraconsulting.pl/*` → `aura-web`** (Workers Routes) — dopiero w dniu przełączenia z GitHub Pages; rekord `www` musi być proxowany (pomarańczowa chmurka).
- [ ] Apex `auraconsulting.pl`: proxowany + **Redirect Rule 301** `https://auraconsulting.pl/*` → `https://www.auraconsulting.pl/${1}` (zachowaj ścieżkę i query). To samo dla `http://` (Always Use HTTPS).
- [ ] **Redirect Rule 301 — ukośnik na końcu** (strefa, przed Workerem): gdy ścieżka nie ma rozszerzenia i nie kończy się „/” (`not ends_with(http.request.uri.path, "/") and not http.request.uri.path contains "."`) → 301 na `concat(http.request.uri.path, "/")` z zachowaniem query. Bez tej reguły `html_handling` odpowiada 307 (tymczasowo), np. dla starego adresu `/ubezpieczenie-ai` — ten jeden ma też regułę w `public/_redirects`.
- [ ] `workers_dev: false` (produkcja nie jest na `*.workers.dev`). Adresy `*.workers.dev` (podglądy) dostają i tak `X-Robots-Tag: noindex` z `public/_headers`.
- [ ] **Podglądy gałęzi** (`wrangler versions upload --preview-alias <gałąź>`, `preview_urls: true`): włącz **Cloudflare Access** dla adresów podglądu (Workers → aura-web → Settings → Domains & Routes → Preview URLs → „Enable Cloudflare Access”), logowanie kodem e-mail. Buildy podglądu mają i tak `noindex` (nagłówek + robots `Disallow: /`).
- [ ] Rollback: Workers → aura-web → Deployments → wybierz poprzednią wersję (lub `wrangler rollback`).

## 3. Boty i AI (PLAN §4.2–4.3)

- [ ] **AI Crawl Control:** Search, Agent, Training — **Allow** (serwis chce być cytowany).
- [ ] **Block AI bots:** **Off**.
- [ ] **Managed robots.txt (Cloudflare):** **Off** — używamy własnego `robots.txt` z builda (deny tylko Bytespider).
- [ ] **AI Labyrinth**, **Pay per crawl:** Off.
- [ ] **Bot Fight Mode / Super Bot Fight Mode / JS Detections:** **Off** (wstrzykiwane skrypty łamią CSP, a challenge blokuje zweryfikowane boty wyszukiwarek i AI). Jeśli kiedyś włączone — wyjątek dla zweryfikowanych botów i brak challenge na trasach treści.
- [ ] **Markdown for Agents:** Off (serwis ma własne bliźniaki `.md`).
- [ ] **Crawler Hints:** **On**.
- [ ] Raz w tygodniu: raport AI Crawl Control (4xx/5xx dla botów).

## 4. Wydajność i bezpieczeństwo

- [ ] **Always Use HTTPS:** On. **Brotli:** On.
- [ ] **Email Obfuscation:** Off (wstrzykuje skrypt — CSP). **Rocket Loader:** Off.
- [ ] **Reguły cache:** bez „Cache Everything” dla HTML (statyczne zasoby `/_astro/*` mają `immutable` z `_headers`).
- [ ] **HSTS** etap 1: `max-age=86400`, bez `includeSubDomains`, bez preload; etap 2 (po audycie wszystkich nazw DNS): 6 miesięcy z `includeSubDomains`.
- [ ] **Web Analytics** (beacon JS): Off do decyzji IOD; po włączeniu — dopisz źródła do CSP w `public/_headers` i zaktualizuj politykę prywatności.
- [ ] Powiadomienia: certyfikaty, błędy Workera, wzrost 5xx/1015/1027 dla botów.

## 5. Weryfikacja po wdrożeniu (smoke)

```bash
curl -sI https://www.auraconsulting.pl/ | grep -iE 'content-security|link|x-robots'      # brak X-Robots-Tag na HTML
curl -sI https://www.auraconsulting.pl/index.md | grep -iE 'content-type|x-robots|link'  # text/markdown, noindex, canonical
curl -sI https://www.auraconsulting.pl/oc-cyber.html | grep -i location                   # 301 → /oc-cyber-dla-it/
curl -s  https://www.auraconsulting.pl/robots.txt | head
curl -sI -A "GPTBot" https://www.auraconsulting.pl/ | head -1                              # 200
curl -sI -A "ClaudeBot" https://www.auraconsulting.pl/llms.txt | head -1                    # 200
```

- [ ] Sitemapa `https://www.auraconsulting.pl/sitemap-index.xml` w Google Search Console i Bing Webmaster Tools (dopiero po 24 h stabilności).
- [ ] IndexNow — po 24 h (później automatycznie z `deploy.yml`, poza MVP).
