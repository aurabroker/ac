# aura-web — www.auraconsulting.pl

Serwis brokera ubezpieczeniowego **Aura Consulting sp. z o.o.** Astro 7 (statyczny build), TypeScript strict, treść w kolekcjach MD/MDX z walidacją Zod, design system „Arkusz”, hosting Cloudflare Workers Static Assets.

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

## Wdrożenie

`.github/workflows/deploy.yml`: push do `main` → produkcja (`wrangler deploy`), inne gałęzie → wersja podglądowa (`wrangler versions upload --preview-alias <gałąź>`, szkice widoczne, `noindex`). Wymagane sekrety repozytorium:

- `CLOUDFLARE_API_TOKEN` — token z uprawnieniem „Workers Scripts: Edit”,
- `CLOUDFLARE_ACCOUNT_ID` — identyfikator konta Cloudflare.

Bez sekretów workflow buduje i waliduje serwis, ale pomija wdrożenie. Route `www.auraconsulting.pl/*` ustawia się w panelu Cloudflare (nie w `wrangler.jsonc`).

## Strażnik poufności

`npm run guard` porównuje tokeny tekstu z listą soli-skrótów w `scripts/guard-hashes.json` (bez jawnych fraz w repo) i zwraca błąd z plikiem i linią. Opcjonalna lokalna lista: `.guard/forbidden.local.txt` (poza Git). Pełna historia: `node scripts/guard.mjs --git-history`.
