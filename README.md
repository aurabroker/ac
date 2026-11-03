# aura-web — www.auraconsulting.pl

Serwis brokera ubezpieczeniowego **Aura Consulting sp. z o.o.** Astro 7 (statyczny build), TypeScript strict, treść w kolekcjach MD/MDX z walidacją Zod, design system „Arkusz”, hosting Cloudflare Pages (projekt `aura-web`).

## Start

```bash
npm ci
npm run dev        # http://localhost:4321 (szkice widoczne; /<ścieżka>.md w locie)
npm run build      # dist/: HTML, bliźniaki .md, llms.txt, llms-full.txt, rss.xml, sitemapy, OG, _headers, _redirects
npm run ci         # strażnik → astro check → build → strażnik → walidacja (bliźniaki, JSON-LD, CSP, linki)
```

Build do własnych katalogów (praca równoległa): `ASTRO_OUT_DIR=… ASTRO_CACHE_DIR=… npm run build`. Podgląd ze szkicami i `noindex`: `PREVIEW=1 npm run build`.

## Dokumentacja

- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — zasady treści, mapa własności plików, komponenty, frontmatter, walidacja.
- [`docs/TODO-wlasciciel.md`](docs/TODO-wlasciciel.md) — dane i decyzje do uzupełnienia przez właściciela.
- [`docs/cloudflare-checklist.md`](docs/cloudflare-checklist.md) — konfiguracja Cloudflare i weryfikacja po wdrożeniu.
- [`docs/adr/`](docs/adr/) — decyzje architektoniczne.

## Wdrożenie (Cloudflare Pages — bez sekretów w GitHubie)

Projekt **`aura-web`** w Cloudflare Pages jest połączony z repo `aurabroker/ac` przez integrację GitHub, która już działa na koncie Cloudflare (te same co `utratadochodu.pl`). Cloudflare sam pobiera kod i buduje — w GitHubie nie ma żadnych tokenów ani sekretów.

- Build: `npm run guard && npm run build`, katalog `dist/`, `NODE_VERSION=22`.
- **Podglądy:** każdy push na gałąź `claude/*` buduje podgląd z `PREVIEW=1` (szkice widoczne, cały serwis `noindex`, `robots.txt` → `Disallow: /`). Adres: `https://<gałąź>.aura-web-2s1.pages.dev` (alias gałęzi) lub adres konkretnego wdrożenia.
- **Produkcja:** wdrożenia z `main` są **wyłączone** do dnia startu (na `main` jest jeszcze stara strona GitHub Pages). Start: włączyć „production deployments”, scalić gałąź z `main`, podpiąć domenę `www.auraconsulting.pl` do projektu (Custom domains), przekierowanie apex → www. Szczegóły: `docs/cloudflare-checklist.md`.
- `public/_headers` i `public/_redirects` działają w Pages bez zmian. Rollback: Pages → aura-web → Deployments → „Rollback to this deployment”.

## Strażnik poufności

`npm run guard` porównuje tokeny tekstu z listą soli-skrótów w `scripts/guard-hashes.json` (bez jawnych fraz w repo) i zwraca błąd z plikiem i linią. Opcjonalna lokalna lista: `.guard/forbidden.local.txt` (poza Git). Pełna historia: `node scripts/guard.mjs --git-history`.
