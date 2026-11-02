# ADR-001: Negocjacja `Accept: text/markdown` i nagłówki bliźniaków — TODO (po MVP)

**Status:** odłożone (MVP bez kodu Workera). **Data:** 2026-11-02.

## Kontekst

MVP to Worker z samymi zasobami statycznymi. Bliźniaki `.md` są dostępne pod dosłownymi ścieżkami (`/x.md`) z nagłówkami z `_headers` (`Content-Type: text/markdown`, `X-Robots-Tag: noindex`, `Link: rel=canonical`). Strony HTML mają `<link rel="alternate" type="text/markdown">` i nagłówek `Link: </x.md>; rel="alternate"`.

Ograniczenia: `_headers` ma limit 100 reguł (build pilnuje), a reguła canonical dla bliźniaków najwyższego poziomu jest generowana per plik. Statyczne zasoby nie potrafią negocjować treści po nagłówku `Accept`.

## Decyzja (docelowa, PLAN §2.4 i §2.6)

Mały Worker (`run_worker_first` tylko dla tras treści) z:
- negocjacją: Markdown tylko gdy `text/markdown` ma q ściśle wyższe niż `text/html` (Googlebot/Bingbot zawsze HTML); odpowiedź bez `X-Robots-Tag`, z `Vary: Accept` i `Link: rel=canonical`;
- nagłówkami `.md` liczonymi w kodzie (zamiast reguł w `_headers`);
- 301 zamiast 307 dla normalizacji `/x` → `/x/`;
- logiem botów (Analytics Engine, bez IP).

Testy jednostkowe parsera `Accept` i smoke na produkcji (tabela w PLAN §2.6).

## Konsekwencje teraz

- Brak negocjacji — agenci pobierają `.md` przez link z `llms.txt` lub `<link rel="alternate">`.
- Przy zbliżeniu do 100 reguł `_headers` build się zatrzyma — wtedy wdrażamy Worker z tego ADR.
