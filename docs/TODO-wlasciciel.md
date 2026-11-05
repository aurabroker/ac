# Do uzupełnienia przez właściciela

Lista danych i decyzji, których nie da się uzupełnić bez Ciebie. Pozycje oznaczone **[blokuje start]** muszą być gotowe przed publikacją produkcyjną.

## 1. Dane osoby (autor tekstów)

Plik: `src/content/people.yaml` (wpis `id: marek-ciesla`, strona `/zespol/marek-ciesla/`). Imię i nazwisko są już wpisane — artykuły (`/wiedza/*`) i arkusze regulacji (`/regulacje/*`) podpisuje „Marek Cieśla”, a ich JSON-LD zawiera `Person` powiązaną ze spółką. Opisy rozwiązań (filary, karty, katalog, słownik) i strony firmowe nie mają autora — wydawcą jest spółka (decyzja 4.11.2026).

- [ ] **Rola** — dziś: „Aura Consulting sp. z o.o. — broker ubezpieczeniowy”. Doprecyzuj funkcję, jeśli chcesz (np. „prezes zarządu”).
- [x] **Profil LinkedIn** — wpisany (`people.yaml`, `sameAs` w JSON-LD, profil na `/zespol/marek-ciesla/`).
- [ ] Funkcja w spółce do JSON-LD `Person.jobTitle` (pole `jobTitle` w `people.yaml`) — dziś pominięta; opis osoby w JSON-LD pochodzi z pola `bio`. Nie wpisujemy „broker ubezpieczeniowy” jako funkcji osoby bez Twojego potwierdzenia.
- [ ] Opcjonalnie: portret (plik do `public/`, styl grafitowy), doświadczenie, wykształcenie i języki do biogramu `src/content/pages/zespol-wlasciciel.mdx` (lista pytań w komentarzu na początku pliku).
- [ ] **[decyzja]** Biogram: program affinity dla branży beauty jest opisany anonimowo, jako program spółki. Czy możemy podać nazwę programu i partnera (zgoda partnera) i czy jesteś jego autorem osobiście? Czy Life & Health (grupowe życie, opieka medyczna) i CAR/EAR mają wrócić do biogramu jako Twoje doświadczenie — katalog serwisu ich nie obejmuje (BUILD-SPEC D3)?
- [ ] Opcjonalnie: osobisty wpis w rejestrze KNF jako osoby wykonującej czynności brokerskie (bonus wiarygodności; nie jest wymagany).

## 2. Dane spółki

Plik: `src/lib/site.ts`. Sąd rejestrowy i kapitał zakładowy (KSH art. 206) są już wpisane.

- [ ] Potwierdź pozostałe dane: ul. Bolkowska 2A/28, 01-466 Warszawa · KRS 0000426835 · NIP 9562300574 · REGON 341302033 · zezwolenie KNF 1972/13 · rejestr brokerów 00001851/U · tel. +48 500 502 702. Kontakt publiczny to telefon i formularz; `cyber@auraconsulting.pl` nie jest pokazywany w serwisie, ale nadal przyjmuje wiadomości z formularza (`CONTACT_TO`).
- [ ] Profile zewnętrzne do `sameAs` (LinkedIn firmy, Google Business Profile) — `SITE.sameAs` w `src/lib/site.ts`.

## 3. Treści prawne do akceptacji (z prawnikiem)

- [ ] **[blokuje start]** Formuły (b), (c), (d) — `src/lib/compliance.ts` — pisemna akceptacja prawnika.
- [ ] **[blokuje start]** `/informacje-o-brokerze/` — akceptacja całej strony (podstawa porady, niezależność, reklamacje), a w szczególności:
  - [ ] **[blokuje start]** potwierdzenie braku powiązań kapitałowych ≥ 10% (głosów lub kapitału) z zakładami ubezpieczeń — dziś strona NIE twierdzi, że ich nie ma (mówi tylko, że informację przekazujemy przed umową); po potwierdzeniu wpisujemy zdanie rozstrzygające (komentarz w `src/content/pages/informacje-o-brokerze.mdx`);
  - [ ] **[blokuje start]** opis wynagrodzenia, w tym od partnera underwritingowego (sekcja „Jak jesteśmy wynagradzani?” oraz FAQ „Kto płaci brokerowi za pracę?” na stronie głównej).
- [ ] **[blokuje start]** `/polityka-prywatnosci/` — akceptacja prawnika / IOD, w tym:
  - [ ] potwierdzenie, że IOD nie został wyznaczony (strona tak dziś mówi) — albo dane kontaktowe IOD;
  - [ ] dostawcy poczty (cyber@auraconsulting.pl) i telefonii: nazwy oraz podstawa przekazania poza EOG (DPF/SCC) albo potwierdzenie, że przetwarzają dane tylko w EOG — do wpisania z nazwy.
- [ ] **[blokuje start]** `/reklamacje/` — akceptacja prawnika, w tym: **czy formularz kontaktowy (`/kontakt/#formularz`, z dopiskiem „Reklamacja”) wystarcza jako kanał elektroniczny** wymagany ustawą o rozpatrywaniu reklamacji (art. 3), obok telefonu i pisma — czy trzeba wskazać adres e-mail albo adres do doręczeń elektronicznych. Adresu e-mail do zapytań nie pokazujemy od 4.11.2026.
- [ ] **[decyzja]** `/informacje-o-brokerze/` i stopka: czy przepisy (UŚUDE art. 5 — „adres elektroniczny”, informacje o pośredniku) wymagają publicznego adresu e-mail. Dziś: telefon, formularz i adres siedziby; ewentualnie wystarczy `warszawa@auraconsulting.pl` z polityki prywatności.
- [ ] **[blokuje start]** Pisemna zgoda ubezpieczyciela / partnera underwritingowego na publikację treści o rynku Lloyd's i o programach plasowanych przez partnera (zasady KNF dot. reklamy, umowa z partnerem — TOBA) oraz — dla każdej karty — potwierdzenie `securityConfirmed` (kto jest ubezpieczycielem, jaki udział rynku Lloyd's, dokument). Bez tego karty nie wspominają Lloyd's.
- [ ] **[blokuje start]** **Przegląd i zatwierdzenie każdej publikowanej strony przez autora.** Teksty przygotowały agenty AI (stąd domyślna nota „Jak powstał ten tekst: z pomocą narzędzi AI … przed publikacją sprawdzony ze źródłami” przy artykułach i linia „Opracowanie: Aura Consulting, z pomocą narzędzi AI …” przy filarach i kartach). Nota mówi prawdę dopiero po Twoim przeglądzie: strona główna, 4 filary + `/ubezpieczenie-ai/ai-w-firmie/`, `/ubezpieczenia/` i 12 kart, `/rynek-lloyds/`, `/slownik/`, `/wiedza/`, strony firmowe i prawne. Po przeglądzie strony ustaw w jej frontmatterze `reviewed: RRRR-MM-DD` — dopiero wtedy linia „Opracowanie” na filarach, kartach, `/rynek-lloyds/` i hubach dopisuje „przed publikacją sprawdzone ze źródłami” (dziś: tylko „z pomocą narzędzi AI, na podstawie źródeł wymienionych wyżej”). Możesz też dopisać wpis w `changelog` — rejestr nie jest pokazywany czytelnikom.
- [ ] **[blokuje start]** **Bramka „odcisku palca” (PLAN §7.3)** dla tabel zakresu w filarach i kartach: każdy wiersz zakresu ma mieć podstawę w ≥ 3 wordingach, w tym w publicznych polskich OWU (pole `basis` w `coverage`), albo zostać przeredagowany ogólniej. Dziś żaden wiersz nie ma `basis` — treść opiera się na wcześniej zweryfikowanych stronach i jednym zestawie dokumentów. Najbardziej wrażliwe: `/oc-zawodowe/` (zaległe honorarium, automatyczny okres zgłoszenia), `/oc-cyber-dla-it/` i `/ubezpieczenie-ai/` (definicje przerwy w działalności, błędu operatora, ujawnienia danych przez AI). Przegląd: Ty lub doradca compliance.
- [ ] **[decyzja]** `/regulamin/` (regulamin świadczenia usług drogą elektroniczną, UŚUDE art. 8): serwis nie ma kont ani newslettera, ale formularz kontaktowy jest od 4.11.2026 jedynym kanałem elektronicznym — **potwierdź opinią prawnika**, czy regulamin jest potrzebny, albo zleć budowę strony (`src/content/pages/regulamin.mdx`).

## 3a. Formularz kontaktowy (Resend)

- [ ] Prawnik / IOD: akceptacja sekcji „Jak działa formularz kontaktowy?” w `/polityka-prywatnosci/` (odbiorcy: Cloudflare, Resend; przekazanie poza EOG; okres przechowywania).
- [ ] Potwierdź zaakceptowane umowy powierzenia (DPA) z Cloudflare i Resend.
- [ ] Wyślij próbną wiadomość z podglądu — temat ma postać „[AI_AURA] [PODGLĄD] [<tytuł strony>] Zapytanie od …” i trafia na cyber@auraconsulting.pl. Każda wiadomość z formularzy serwisu ma znacznik: „[CYBER_AURA]”, gdy pytanie dotyczy cyber (formularz ze strony działu cyber albo w treści np. „cyber”, „ransomware”, „phishing”, „wyciek danych”, „incydent bezpieczeństwa”, „przejęcie konta”), w pozostałych — „[AI_AURA]”. Reguły w poczcie: temat zawiera „[AI_AURA]” / „[CYBER_AURA]”. Wiadomości ze słowem „reklamacja” (albo wysłane ze strony `/reklamacje/`) mają w temacie także „[REKLAMACJA]”, a ze słowem „szkoda” — „[SZKODA]”: odpowiedź na reklamację najpóźniej w 30 dni (ustawa o rozpatrywaniu reklamacji). Ustaw w poczcie regułę lub flagę dla tych tematów.
- [ ] Sprawdź w panelu Resend region domeny nadawcy (`CONTACT_FROM`, domena `auraconsulting.pl`). Jeśli to region UE (eu-west-1), możemy dopisać w `/polityka-prywatnosci/`, że wysyłka odbywa się z UE — dziś polityka tego nie twierdzi.

## 3b. Harmonogram artykułów (co 2 dni)

- [ ] **Zatwierdź artykuły do harmonogramu (zmień `draft: false`).** Przejrzyj tekst i w jego pliku zmień `draft: true` na `draft: false`. Zatwierdzony artykuł wchodzi na stronę rano w dniu z tabeli. **Po terminie: najpierw przenieś na nowy termin** — `node scripts/publish-today.mjs --reschedule` (podgląd zmian: `--dry-run`; od dnia startu: `--from=RRRR-MM-DD`) przesuwa szkice po terminie na kolejne wolne dni co 2 dni, z zachowaniem kolejności. Krok CI `publish-today --check` odrzuci zatwierdzenie z datą wsteczną (dzień commita z `draft: false`, na `main` — dzień scalenia, późniejszy niż `published`).
- [ ] **Arkusze regulacji i artykuły o przepisach** (`legalStateAsOf`): zatwierdzenie = ponowne sprawdzenie przepisów w dniu zatwierdzenia; ustaw `legalStateAsOf` (i daty dostępu zmienionych źródeł) na dzień sprawdzenia — nie później niż `published`. `--check` ostrzega, gdy stan prawny jest starszy niż 14 dni w dniu publikacji.

| Publikacja | Artykuł | Plik |
|---|---|---|
| czw. 05.11.2026 | OC programisty na B2B | `src/content/wiedza/oc-programisty-b2b.mdx` |
| sob. 07.11.2026 | LLMjacking | `src/content/wiedza/llmjacking.mdx` |
| pon. 09.11.2026 | USA i Kanada w polisie | `src/content/wiedza/usa-kanada-w-polisie.mdx` |
| śr. 11.11.2026 | Tech E&O a OC zawodowe | `src/content/wiedza/tech-eo-a-oc-zawodowe.mdx` |
| pt. 13.11.2026 | Klient wymaga OC od kontraktora | `src/content/wiedza/klient-wymaga-oc-od-kontraktora.mdx` |
| niedz. 15.11.2026 | AI Act a ubezpieczenie | `src/content/wiedza/ai-act-a-ubezpieczenie.mdx` |
| wt. 17.11.2026 | Ransomware 2.0 | `src/content/wiedza/ransomware-2-0.mdx` |
| czw. 19.11.2026 | PLD a software house | `src/content/wiedza/pld-a-oc-software-house.mdx` |
| sob. 21.11.2026 | AI Act (regulacje) | `src/content/regulations/ai-act.mdx` |
| pon. 23.11.2026 | Dyrektywa PLD (regulacje) | `src/content/regulations/pld.mdx` |

- Data publikacji ma być prawdziwa. Dziś (5.11) pierwsza pozycja ma termin dziś, a wdrożenia produkcyjne są wyłączone do startu — **w dniu startu, przed zatwierdzeniem, uruchom `node scripts/publish-today.mjs --reschedule --from=<dzień startu>`** i przepisz tabelę (`--list`). Gałąź scalona z `main` po terminie nie opublikuje wpisów z wsteczną datą: CI (`--check`, pełna historia git) zatrzyma takie scalenie.
- Podgląd gałęzi pokazuje wszystkie artykuły: przyszłe z etykietą „Zaplanowano: dd.mm.rrrr”, niezatwierdzone z „SZKIC”. Cały plan ze stanami: `node scripts/publish-today.mjs --list`.
- Publikację uruchamia codziennie o 6:05 i 11:05 (latem 7:05 i 12:05) workflow GitHub `daily-publish`: w dniu z tabeli — albo później, jeśli dzień minął bez nowego commita na `main` (np. GitHub pominął uruchomienie) — wypycha na `main` pusty commit „Publikacja: <tytuł>”, a Cloudflare Pages buduje produkcję od nowa; drugie uruchomienie nic nie robi, gdy publikacja już poszła. Działa dopiero po scaleniu z `main` w dniu startu (GitHub uruchamia harmonogramy tylko z gałęzi domyślnej) i przy włączonych wdrożeniach produkcyjnych.

## 4. Cloudflare

Nic do zrobienia przed startem — projekt **`aura-web`** w Cloudflare Pages jest utworzony i połączony z GitHubem (bez sekretów; integracja GitHub była już na koncie). Podglądy gałęzi `claude/*` budują się automatycznie.

- [ ] W dniu startu (wykonamy razem): włączenie wdrożeń produkcyjnych, domena `www.auraconsulting.pl` w projekcie, przekierowanie apex → www, ustawienia botów AI (checklista).
- [ ] Opcjonalnie: Cloudflare Access na adresach podglądu `*.aura-web-2s1.pages.dev` (podglądy i tak mają `noindex`).

## 5. Repozytorium — rekomendacje (nie wykonujemy ich automatycznie)

- [ ] **[blokuje start] Czyszczenie historii (K1).** `node scripts/guard.mjs --git-history` wykrywa w historii obecnego repo (stare wersje `index.html`, commity osiągalne z `main`, `_posts` i gałęzi roboczej) dane, które nie powinny być publiczne. Bieżące drzewo i `dist/` są czyste. Kroki: (1) nowe **prywatne** repo z czystą historią (sam bieżący stan plików, jeden commit), (2) przełączenie deployu i domeny na nowe repo, (3) usunięcie starego repo po przełączeniu, (4) prośba do GitHub Support o usunięcie cache i referencji PR (`refs/pull/*`), (5) wnioski o usunięcie kopii z Wayback Machine i Common Crawl. **Nie wypychaj tej gałęzi do nowych miejsc, dopóki niesie starą historię.** Workflow `.github/workflows/guard-history.yml` (uruchamiany ręcznie) sprawdza całą historię — w obecnym repo będzie czerwony do czasu czyszczenia; w nowym repo można mu dodać harmonogram.
- [ ] **Widoczność repo:** rekomendujemy repozytorium **prywatne** (wystarczy darmowy plan GitHub — jeden autor, bez wymaganych recenzji). Historia obecnego repo `aurabroker/ac` zawiera wcześniejsze wersje strony z danymi, które nie powinny być publiczne (strażnik poufności wykrywa je w historii: `node scripts/guard.mjs --git-history`). Rozważ: nowe prywatne repo z czystą historią (np. `aura-web`), a stare — po przełączeniu domeny — usunięcie oraz prośbę do GitHub Support o usunięcie cache i referencji PR.
- [ ] Gałąź `main` (dziś GitHub Pages) zostaje nietknięta do czasu przełączenia na Cloudflare. Po przełączeniu: wyłącz GitHub Pages, usuń plik/ustawienie domeny, zweryfikuj domenę w ustawieniach GitHub Pages organizacji (ochrona przed przejęciem).
- [ ] Opcjonalnie: ochrona gałęzi `main` (wymagane statusy `ci / guard`, `ci / build`, `ci / links`), jeśli plan repozytorium ją obejmuje. Niezależnie od tego build w Cloudflare uruchamia strażnika poufności przed każdym wdrożeniem.

## 6. Decyzje otwarte

- [ ] Arkusz `/regulacje/pld/` i artykuł `/wiedza/pld-a-oc-software-house/` (szkice): przed publikacją potwierdź datę publikacji projektu polskiej ustawy wdrażającej PLD (Ministerstwo Sprawiedliwości) i dodaj źródło — usunęliśmy niezweryfikowany link do artykułu prasowego i datę „wrzesień 2026 r.”.
- [ ] Kanał RSS ma dziś 0 pozycji (wszystkie artykuły są szkicami); link do RSS w `<head>` i w `llms.txt` pojawi się automatycznie po publikacji pierwszego arkusza. Pozycje zawierają skrót („W skrócie”) i link — pełna treść w RSS (PLAN §2.6) to zadanie na czas publikacji artykułów.

- [ ] Analityka: domyślnie brak (0 KB). Cloudflare Web Analytics (bez cookies) — włączyć dopiero po decyzji/opinii IOD; wtedy aktualizacja polityki prywatności i CSP.
- [ ] Negocjacja `Accept: text/markdown` na adresach HTML i log botów — wymaga małego Workera (ADR `docs/adr/001-negocjacja-markdown.md`).
- [ ] Lokalna lista jawnych fraz dla strażnika: `.guard/forbidden.local.txt` (plik poza Git, po jednej frazie w linii) — przekaż maintainerowi bezpiecznym kanałem, jeśli ma być używana lokalnie.
