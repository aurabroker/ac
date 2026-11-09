# Cloudflare — checklista konfiguracji (strefa auraconsulting.pl)

Serwis: projekt **Cloudflare Pages `aura-web`** (statyczny build Astro, `public/_headers`, `public/_redirects`), połączony z repo `aurabroker/ac` przez integrację GitHub konta Cloudflare — **bez tokenów i sekretów w GitHubie**. Kanoniczny host: `https://www.auraconsulting.pl`. Strefa DNS jest już na Cloudflare — nie ruszamy rekordów poczty (MX, SPF, DKIM, DMARC, autodiscover, TXT).

## 1. Projekt (stan na 3.11.2026 — gotowe)

- [x] Projekt Pages `aura-web` (`aura-web-2s1.pages.dev`), źródło GitHub `aurabroker/ac`.
- [x] Build: `npm run guard && npm run build` → `dist/`, `NODE_VERSION=22`.
- [x] Podglądy: gałęzie `claude/*`, zmienna `PREVIEW=1` (szkice, `noindex`, `Disallow: /`).
- [x] Produkcja: gałąź `main`, wdrożenia produkcyjne **włączone 5.11.2026** (start serwisu).

## 2. Dzień startu (wykonane 5.11.2026)

- [x] Włącz wdrożenia produkcyjne (Pages → aura-web → Settings → Builds → Branch control) i scal gałąź z `main` — 5.11, pierwsze wdrożenie produkcyjne `0f0d719`.
- [x] Custom domain: `www.auraconsulting.pl` → projekt `aura-web` (aktywna, certyfikat Google); rekord `www` CNAME → `aura-web-2s1.pages.dev` (proxied), wcześniej `aurabroker.github.io`.
- [ ] **Właściciel:** wyłącz GitHub Pages w repo (Settings → Pages → Source: None) — stara strona nie jest już pod domeną.
- [x] Apex `auraconsulting.pl`: proxowany + **Redirect Rule 301** (`http.host eq "auraconsulting.pl"` → `https://www.auraconsulting.pl` + ścieżka, query zachowane). Always Use HTTPS: On. Rekordy A/AAAA apeksu nadal wskazują GitHub Pages, ale przekierowanie działa na brzegu Cloudflare, zanim żądanie dotrze do źródła.
- [ ] Ukośnik na końcu: Pages domyślnie przekierowuje `/x` → `/x/` dla katalogów z `index.html` — sprawdź w smoke teście (kod 308/301).
- [ ] Rollback: Pages → aura-web → Deployments → „Rollback to this deployment”.
- [ ] Harmonogram artykułów: po scaleniu z `main` workflow `daily-publish` działa z `main`. Przy pierwszej publikacji sprawdź, że commit „Publikacja: …” od `github-actions[bot]` uruchomił wdrożenie produkcyjne w Pages. Jeśli `main` dostanie ochronę gałęzi, zezwól GitHub Actions na push (inaczej job się zatrzyma).
- [ ] Opcjonalnie: Cloudflare Access na `*.aura-web-2s1.pages.dev` (podglądy).

## 3. Boty i AI (PLAN §4.2–4.3)

- [ ] **AI Crawl Control:** Search, Agent, Training — **Allow** (serwis chce być cytowany).
- [x] **Block AI bots:** **Off** (5.11).
- [x] **Managed robots.txt (Cloudflare):** **Off** (5.11) — używamy własnego `robots.txt` z builda (deny tylko Bytespider).
- [ ] **AI Labyrinth**, **Pay per crawl:** Off.
- [x] **Bot Fight Mode / Super Bot Fight Mode / JS Detections:** **Off** (5.11; wcześniej Bot Fight Mode i JS Detections były włączone) (wstrzykiwane skrypty łamią CSP, a challenge blokuje zweryfikowane boty wyszukiwarek i AI). Jeśli kiedyś włączone — wyjątek dla zweryfikowanych botów i brak challenge na trasach treści.
- [ ] **Markdown for Agents:** Off (serwis ma własne bliźniaki `.md`).
- [ ] **Crawler Hints:** **On**.
- [ ] Raz w tygodniu: raport AI Crawl Control (4xx/5xx dla botów).

## 4. Wydajność i bezpieczeństwo

- [ ] **Always Use HTTPS:** On. **Brotli:** On.
- [x] **Email Obfuscation:** Off (5.11; wcześniej On) (wstrzykuje skrypt — CSP). **Rocket Loader:** Off.
- [ ] **Reguły cache:** bez „Cache Everything” dla HTML (statyczne zasoby `/_astro/*` mają `immutable` z `_headers`).
- [ ] **HSTS** etap 1: `max-age=86400`, bez `includeSubDomains`, bez preload; etap 2 (po audycie wszystkich nazw DNS): 6 miesięcy z `includeSubDomains`.
- [x] **Web Analytics** (beacon JS): Off dla `www.auraconsulting.pl` — Configuration Rule „Disable RUM” dla `http.host eq "www.auraconsulting.pl"` (5.11; automatycznie wstrzykiwany `beacon.min.js` łamał CSP i przeczył polityce prywatności). Reguła Web Analytics strefy (include `*`, auto-install) bez zmian — subdomeny mierzone jak wcześniej. Pomiar ruchu w przeglądarce: GA4 za zgodą (gałąź `feat/ga4-consent`, CSP już ma źródła Google) — reguła „Disable RUM” zostaje.
- [ ] Powiadomienia: certyfikaty, błędy Workera, wzrost 5xx/1015/1027 dla botów.

- [ ] **Alert o niedostarczonych zgłoszeniach z formularza** (`functions/api/resend-webhook.js`, 9.11.2026): webhook Resend → `https://www.auraconsulting.pl/api/resend-webhook` na zdarzenia `email.bounced`, `email.suppressed`, `email.failed`. Zmienne w Cloudflare Pages (Production): `RESEND_WEBHOOK_SECRET` (secret, „Signing secret” webhooka z panelu Resend) i `ALERT_TO` (adres inny niż `CONTACT_TO`). Bez nich funkcja odpowiada 503 i alertów nie ma. Powód: 6.11 jedno odbicie zablokowało `CONTACT_TO` w Resend i przez 3 dni zgłoszenia nie docierały.

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
- [ ] IndexNow — po 24 h (automatyzacja poza MVP).
