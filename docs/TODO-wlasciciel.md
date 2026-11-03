# Do uzupełnienia przez właściciela

Lista danych i decyzji, których nie da się uzupełnić bez Ciebie. Pozycje oznaczone **[blokuje start]** muszą być gotowe przed publikacją produkcyjną.

## 1. Dane osoby (autor tekstów)

Plik: `src/content/people.yaml` (wpis `id: marek-ciesla`, strona `/zespol/marek-ciesla/`). Imię i nazwisko są już wpisane — teksty podpisuje „Marek Cieśla”, a JSON-LD zawiera `Person` powiązaną ze spółką.

- [ ] **Rola** — dziś: „Aura Consulting sp. z o.o. — broker ubezpieczeniowy”. Doprecyzuj funkcję, jeśli chcesz (np. „prezes zarządu”).
- [ ] **Profil LinkedIn** (URL) — trafi do `sameAs`.
- [ ] Funkcja w spółce do JSON-LD `Person.jobTitle` (pole `jobTitle` w `people.yaml`) — dziś pominięta; opis osoby w JSON-LD pochodzi z pola `bio`. Nie wpisujemy „broker ubezpieczeniowy” jako funkcji osoby bez Twojego potwierdzenia.
- [ ] Opcjonalnie: portret (plik do `public/`, styl grafitowy), doświadczenie, wykształcenie i języki do biogramu `src/content/pages/zespol-wlasciciel.mdx` (lista pytań w komentarzu na początku pliku).
- [ ] **[decyzja]** Biogram: program affinity dla branży beauty jest opisany anonimowo, jako program spółki. Czy możemy podać nazwę programu i partnera (zgoda partnera) i czy jesteś jego autorem osobiście? Czy Life & Health (grupowe życie, opieka medyczna) i CAR/EAR mają wrócić do biogramu jako Twoje doświadczenie — katalog serwisu ich nie obejmuje (BUILD-SPEC D3)?
- [ ] Opcjonalnie: osobisty wpis w rejestrze KNF jako osoby wykonującej czynności brokerskie (bonus wiarygodności; nie jest wymagany).

## 2. Dane spółki

Plik: `src/lib/site.ts`. Sąd rejestrowy i kapitał zakładowy (KSH art. 206) są już wpisane.

- [ ] Potwierdź pozostałe dane: ul. Bolkowska 2A/28, 01-466 Warszawa · KRS 0000426835 · NIP 9562300574 · REGON 341302033 · zezwolenie KNF 1972/13 · rejestr brokerów 00001851/U · tel. +48 500 502 702 · cyber@auraconsulting.pl.
- [ ] Profile zewnętrzne do `sameAs` (LinkedIn firmy, Google Business Profile) — `SITE.sameAs` w `src/lib/site.ts`.

## 3. Treści prawne do akceptacji (z prawnikiem)

- [ ] **[blokuje start]** Formuły (b), (c), (d) — `src/lib/compliance.ts` — pisemna akceptacja prawnika.
- [ ] **[blokuje start]** `/informacje-o-brokerze/` — akceptacja całej strony (podstawa porady, niezależność, reklamacje), a w szczególności:
  - [ ] **[blokuje start]** potwierdzenie braku powiązań kapitałowych ≥ 10% (głosów lub kapitału) z zakładami ubezpieczeń — dziś strona NIE twierdzi, że ich nie ma (mówi tylko, że informację przekazujemy przed umową); po potwierdzeniu wpisujemy zdanie rozstrzygające (komentarz w `src/content/pages/informacje-o-brokerze.mdx`);
  - [ ] **[blokuje start]** opis wynagrodzenia, w tym od partnera underwritingowego (sekcja „Jak jesteśmy wynagradzani?” oraz FAQ „Kto płaci brokerowi za pracę?” na stronie głównej).
- [ ] **[blokuje start]** `/polityka-prywatnosci/` — akceptacja prawnika / IOD, w tym:
  - [ ] potwierdzenie, że IOD nie został wyznaczony (strona tak dziś mówi) — albo dane kontaktowe IOD;
  - [ ] dostawcy poczty (cyber@auraconsulting.pl) i telefonii: nazwy oraz podstawa przekazania poza EOG (DPF/SCC) albo potwierdzenie, że przetwarzają dane tylko w EOG — do wpisania z nazwy.
- [ ] **[blokuje start]** `/reklamacje/` — akceptacja prawnika.
- [ ] **[blokuje start]** Pisemna zgoda ubezpieczyciela / partnera underwritingowego na publikację treści o rynku Lloyd's i o programach plasowanych przez partnera (zasady KNF dot. reklamy, umowa z partnerem — TOBA) oraz — dla każdej karty — potwierdzenie `securityConfirmed` (kto jest ubezpieczycielem, jaki udział rynku Lloyd's, dokument). Bez tego karty nie wspominają Lloyd's.
- [ ] **[blokuje start]** **Przegląd i zatwierdzenie każdej publikowanej strony przez autora.** Teksty przygotowały agenty AI (stąd domyślna nota „Jak powstał ten tekst: z pomocą narzędzi AI … przed publikacją sprawdzony ze źródłami”). Nota mówi prawdę dopiero po Twoim przeglądzie: strona główna, 4 filary + `/ubezpieczenie-ai/ai-w-firmie/`, `/ubezpieczenia/` i 12 kart, `/rynek-lloyds/`, `/slownik/`, `/wiedza/`, strony firmowe i prawne. Po przeglądzie strony możesz dopisać wpis w jej `changelog` (np. „Przegląd autora”).
- [ ] **[blokuje start]** **Bramka „odcisku palca” (PLAN §7.3)** dla tabel zakresu w filarach i kartach: każdy wiersz zakresu ma mieć podstawę w ≥ 3 wordingach, w tym w publicznych polskich OWU (pole `basis` w `coverage`), albo zostać przeredagowany ogólniej. Dziś żaden wiersz nie ma `basis` — treść opiera się na wcześniej zweryfikowanych stronach i jednym zestawie dokumentów. Najbardziej wrażliwe: `/oc-zawodowe/` (zaległe honorarium, automatyczny okres zgłoszenia), `/oc-cyber-dla-it/` i `/ubezpieczenie-ai/` (definicje przerwy w działalności, błędu operatora, ujawnienia danych przez AI). Przegląd: Ty lub doradca compliance.
- [ ] **[decyzja]** `/regulamin/` (regulamin świadczenia usług drogą elektroniczną, UŚUDE art. 8): serwis nie ma formularzy, kont ani newslettera, więc rekomendujemy „nie jest potrzebny” — **potwierdź opinią prawnika** albo zleć budowę strony (`src/content/pages/regulamin.mdx`).

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
