# Kolejka zmian od właściciela (do wdrożenia razem, na sygnał)

Status: **WDROŻONE 5.11.2026** (punkty 1–8, gałąź `claude/aura-consulting-redesign-fX1bn`, podgląd Cloudflare Pages). Kolejne zmiany dopisujemy poniżej jako nowe punkty.

## 1. Rejestr zmian — poza widokiem użytkownika (zgłoszone 4.11.2026)

„Rejestr zmian” nie jest istotny dla czytelników. Do wyboru: skasować z publicznych stron albo przenieść do panelu admina.

- Usunąć blok „Rejestr zmian” (`RevisionLog`) ze wszystkich publicznych stron i z bliźniaków `.md`.
- Dane `changelog` zostają w plikach treści i w historii git (do panelu admina, jeśli powstanie).
- Do decyzji przy wdrożeniu: tylko ukryć (rekomendacja na teraz) czy zbudować prosty panel admina.
- **Wdrożone (5.11):** blok usunięty ze wszystkich stron i bliźniaków `.md` (komponent `RevisionLog` skasowany); `changelog` zostaje w plikach treści i w git. Panelu admina nie budujemy.

## 2. Kontakt tylko: telefon albo formularz (zgłoszone 4.11.2026)

„W KONTAKT — dzwoń pod numer albo wyślij wiadomość przez formularz. WSZĘDZIE MA IŚĆ PRZEZ FORMULARZ.”

- Blok kontaktu na wszystkich stronach: zostają **telefon** i **formularz**. Usunąć: adres e-mail do zapytań, przyciski „Napisz e-mail”, „Kopiuj adres”, „Kopiuj szablon wiadomości” i szablon wiadomości.
- `/kontakt/`: „Zadzwoń pod numer albo wyślij wiadomość przez formularz”.
- Konfigurator: usunąć „Wyślij e-mailem” (mailto) — zostaje „Wyślij konfigurację formularzem” i „Kopiuj podsumowanie”.
- Teksty na stronach, FAQ, „W skrócie”, `llms.txt`, nagłówki bliźniaków `.md` („Analiza ryzyka: cyber@…”), stopka, JSON-LD `contactPoint`: zamiast e-maila — telefon i link do formularza.
- Do sprawdzenia przy wdrożeniu (zgodność):
  - `/reklamacje/` — ustawa o rozpatrywaniu reklamacji wymaga wskazania kanału elektronicznego; zostawić e-mail albo wskazać formularz jako kanał elektroniczny (decyzja właściciela/prawnika).
  - `/polityka-prywatnosci/` — kontakt w sprawach danych: `warszawa@auraconsulting.pl` zostaje (decyzja 3.11).
  - Komunikaty błędów formularza (fallback „napisz na …”) — zamienić na telefon.
- **Wdrożone (5.11):** na wszystkich stronach tylko telefon i formularz (Resend, temat z tytułem strony). `/reklamacje/` — kanał elektroniczny = formularz (do potwierdzenia przez prawnika, `docs/TODO-wlasciciel.md`); temat zgłoszenia z „reklamac…” dostaje prefiks `[REKLAMACJA]`, z „szkod…” — `[SZKODA]`. E-mail zostaje tylko w polityce prywatności (`warszawa@auraconsulting.pl`).

## 3. Grafika przy każdym odnośniku do arkusza — układy scalone (zgłoszone 4.11.2026)

„Wszystkie odnośniki do ARKUSZA na każdej stronie powinny mieć graficzny układ. Może układy scalone?”

- Każda karta-odnośnik do innej strony (filary, karty katalogu, artykuły, „Powiązane”, blog, strona główna) dostaje u góry grafikę ~360×190 w stylu rysunku technicznego elektroniki: obudowa QFP z wyprowadzeniami (filary: piny = moduły ochrony), ścieżki PCB z przelotkami (karty katalogu: przebieg ryzyka), matryca BGA / schemat blokowy (artykuły).
- Grafiki generowane w buildzie jako SVG (deterministycznie z adresu strony + kilka parametrów w frontmatterze: etykiety pinów, odcinek „awarii” na czerwono), bez zewnętrznych plików i bez JS; w `.md` pomijane.
- Liczby na grafikach tylko ilustracyjne i oznaczone jako takie albo bez liczb (np. „+840%” ze szkicu nie przechodzi do produkcji bez źródła).
- Szkic: /tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/ic-mock/karty-uklady-scalone.png
- Do decyzji właściciela: tylko karty-odnośniki czy także rysunki hero (dziś: rysunki złożeniowe „zespołu”) w tym samym języku układów scalonych.
- **Wdrożone (4.11):** miniatura 360×190 u góry każdej karty-odnośnika (`SheetCard`, blog) jako plik `/fig/<ścieżka>.svg` z buildu (`<img loading="lazy">`, ≈ 3 KB gz), bez liczb; hero bez zmian. Opis: `docs/CONVENTIONS.md` §6 „Rysunki izometryczne”.

## 4. Więcej 3D — rysunki izometryczne „rozstrzelone” (zgłoszone 4.11.2026)

Właściciel: pełna zgoda na koncepcję rysunków złożeniowych/rozstrzelonych, „ale może coś bardziej w 3D?”.

- Kierunek A (rekomendowany): rzut izometryczny (3D w linii, SVG): program ubezpieczenia jako układ scalony rozłożony na warstwy — płytka (działalność, umowy) → kulki BGA (terytorium PL/UE/USA) → podłoże (limity) → rdzeń (OC + cyber + AI) → pokrywa (wyłączenia). Warstwy „rozjeżdżają się” przy przewijaniu / najechaniu, kliknięcie warstwy otwiera opis (jak dziś części rysunku). Lekkie, bez WebGL, działa na telefonie.
- Kierunek B (opcjonalnie, tylko hero strony głównej): prawdziwy model 3D obracany myszą (WebGL), w stylu linii technicznej, ładowany dopiero po wejściu na stronę; statyczny rysunek jako zapas. Większy koszt (~150 KB JS) i wydajność.
- Spójnie z punktem 3: karty-odnośniki jako miniatury izometryczne tych samych „układów”.
- **Wdrożone (4.11):** kierunek A — generator `src/lib/iso` (motywy: stos warstw, QFP, ścieżki PCB, matryca BGA; ziarno z adresu strony). Warstwy rozsuwają się raz przy wejściu w widok (CSS, bez ruchu przy `prefers-reduced-motion`); bez klikania warstw. Kierunek B (WebGL) — nie.
- Szkic: /tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/iso-mock/izometria-uklad.png

## 5. Zakres nowych grafik: tylko tam, gdzie dziś nie ma żadnej (zgłoszone 4.11.2026)

„Te nowe elementy dodaj do obszarów, gdzie nie ma jeszcze żadnych grafik.”

- **Bez zmian:** istniejące rysunki zostają (hero: strona główna, 4 filary, `/ubezpieczenia/`, `/rynek-lloyds/`). Nie zastępujemy ich układami scalonymi.
- **Nowe grafiki (izometryczne układy scalone, punkty 3–4) tam, gdzie dziś brak:**
  - 12 kart katalogu (`/ubezpieczenia/*`) — rysunek w nagłówku karty,
  - 8 artykułów bloga i 2 arkusze regulacji (AI Act, PLD) — rysunek w nagłówku,
  - `/ubezpieczenie-ai/ai-w-firmie/`,
  - `/wiedza/` (blog), `/slownik/`, `/kontakt/`, `/o-nas/`, `/zespol/marek-ciesla/`,
  - wszystkie karty-odnośniki do arkuszy (strona główna, „Powiązane”, blog, katalog) — miniatura u góry karty.
- Strony prawne (`/informacje-o-brokerze/`, `/reklamacje/`, `/polityka-prywatnosci/`) — do decyzji przy wdrożeniu; rekomendacja: bez grafiki albo tylko mała, spokojna miniatura.
- **Wdrożone (4.11):** rysunek w nagłówku (obok „W skrócie”) na wszystkich stronach z listy; strony prawne — bez rysunku w nagłówku, na kartach spokojna miniatura bez podpisów. Etykiety z treści strony (moduły z tabeli zakresu, „Wyłączenia”), dla regulacji i `/o-nas/` — `iso` we frontmatterze.

## 6. Tło: delikatnie dryfująca siatka „neuronów” (zgłoszone 4.11.2026)

„Czy w tle może coś latać? Delikatnie, jakby jakaś siatka, à la neurony?”

- Jedna warstwa `<canvas>` pod treścią: punkty (węzły) wolno dryfują, łączą się cienkimi liniami, gdy są blisko; linie grafitowe ~10% krycia, część węzłów w błękicie kreślarskim z delikatnym „pulsem”. Tło nadal białe.
- Czytelność: karty, tabele, formularz i tabliczki mają białe tło, więc siatka nie przechodzi pod tekstem.
- Wydajność i dostępność: skrypt ~1–2 KB, pauza w nieaktywnej karcie i poza ekranem, mniejsza gęstość na telefonie, wyłączona przy `prefers-reduced-motion` i trybie oszczędzania danych; bez wpływu na CSP (osobny plik).
- **Decyzja (4.11):** na całym serwisie, **z reakcją na kursor** (węzły przy kursorze łączą się mocniej i lekko do niego ciążą; na dotyku bez reakcji).
- Szkic (nagranie 8 s): /tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/net-mock/tlo-siatka-neuronow.mp4
- **Wdrożone (5.11):** `src/scripts/neural-bg.ts` (≈ 1,5 KB gz) na całym serwisie, reakcja na kursor tylko przy myszy; pauza poza kartą, wyłączone przy `prefers-reduced-motion` i oszczędzaniu danych.

## 7. Autor tylko przy artykułach (zgłoszone 4.11.2026)

„Przy opisie rozwiązań ubezpieczeniowych nie podawaj autora. Autor pojawia się przy artykułach.”

- **Bez autora** (tabliczka, JSON-LD `author` zamiast osoby → organizacja): filary (`/oc-cyber-dla-it/`, `/ubezpieczenie-ai/` + „AI w firmie”, `/ubezpieczenie-cyber/`, `/oc-zawodowe/`), 12 kart katalogu, `/ubezpieczenia/`, `/rynek-lloyds/`, `/slownik/` oraz strony firmowe i prawne (tam już nie ma).
- **Z autorem** (Marek Cieśla, link do profilu): artykuły bloga `/wiedza/*` i arkusze regulacji `/regulacje/*` (pokazywane na blogu jak artykuły).
- Nota „Jak powstał ten tekst” (AI) — zostaje przy artykułach; przy rozwiązaniach jako krótka informacja redakcyjna bez osoby.
- **Wdrożone (5.11):** autor (tabliczka + JSON-LD `Person`) tylko na `/wiedza/*` i `/regulacje/*`; pozostałe strony — organizacja jako autor.

## 8. Daty publikacji artykułów: co 2 dni (zgłoszone 4.11.2026)

„Artykuły muszą mieć inną datę publikacji. Zróbmy co 2 dni.”

- Każdy artykuł dostaje własną datę `published`, kolejne co 2 dni (8 artykułów + 2 arkusze regulacji = 10 pozycji ≈ 20 dni).
- **Interpretacja przyjęta do wdrożenia:** harmonogram „w przód” od dnia startu — artykuł z datą w przyszłości nie trafia do serwisu, sitemap, RSS i `llms.txt`, dopóki jego dzień nie nadejdzie; codzienny automatyczny rebuild (Cloudflare: hook wdrożenia + zadanie cron po stronie Cloudflare, bez sekretów w GitHubie) publikuje kolejny artykuł. Nie cofamy dat w przeszłość (daty w danych strukturalnych muszą być prawdziwe).
- Warunek: artykuł zatwierdzony przez autora; niezatwierdzony nie wchodzi do harmonogramu.
- Kolejność do ustalenia przy wdrożeniu (propozycja: najpierw teksty pod frazy „OC dla IT” i „OC/cyber dla AI”: OC programisty B2B → LLMjacking → USA i Kanada → Tech E&O → klient wymaga OC → AI Act a ubezpieczenie → ransomware 2.0 → PLD a software house → regulacje AI Act, PLD).
- **Wdrożone (4.11):** daty od 05.11 do 23.11.2026 w tej kolejności (tabela: `docs/TODO-wlasciciel.md` §3b); jedna reguła publikacji `isLive` (`src/lib/routes.ts`); podgląd z etykietą „Zaplanowano”. Codzienny rebuild: workflow GitHub `daily-publish` (pusty commit na `main` przez `GITHUB_TOKEN`, bez sekretów) zamiast hooka i crona po stronie Cloudflare. Artykuły zostają szkicami do zatwierdzenia.
