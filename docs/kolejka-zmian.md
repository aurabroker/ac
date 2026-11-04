# Kolejka zmian od właściciela (do wdrożenia razem, na sygnał)

Status: **CZEKA** — właściciel zbiera kolejne zmiany i da znać, kiedy wdrożyć wszystkie naraz.

## 1. Rejestr zmian — poza widokiem użytkownika (zgłoszone 4.11.2026)

„Rejestr zmian” nie jest istotny dla czytelników. Do wyboru: skasować z publicznych stron albo przenieść do panelu admina.

- Usunąć blok „Rejestr zmian” (`RevisionLog`) ze wszystkich publicznych stron i z bliźniaków `.md`.
- Dane `changelog` zostają w plikach treści i w historii git (do panelu admina, jeśli powstanie).
- Do decyzji przy wdrożeniu: tylko ukryć (rekomendacja na teraz) czy zbudować prosty panel admina.

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

## 3. Grafika przy każdym odnośniku do arkusza — układy scalone (zgłoszone 4.11.2026)

„Wszystkie odnośniki do ARKUSZA na każdej stronie powinny mieć graficzny układ. Może układy scalone?”

- Każda karta-odnośnik do innej strony (filary, karty katalogu, artykuły, „Powiązane”, blog, strona główna) dostaje u góry grafikę ~360×190 w stylu rysunku technicznego elektroniki: obudowa QFP z wyprowadzeniami (filary: piny = moduły ochrony), ścieżki PCB z przelotkami (karty katalogu: przebieg ryzyka), matryca BGA / schemat blokowy (artykuły).
- Grafiki generowane w buildzie jako SVG (deterministycznie z adresu strony + kilka parametrów w frontmatterze: etykiety pinów, odcinek „awarii” na czerwono), bez zewnętrznych plików i bez JS; w `.md` pomijane.
- Liczby na grafikach tylko ilustracyjne i oznaczone jako takie albo bez liczb (np. „+840%” ze szkicu nie przechodzi do produkcji bez źródła).
- Szkic: /tmp/claude-0/-home-user-ac/0bc40d0e-8893-50b3-bc04-721fdb574803/scratchpad/ic-mock/karty-uklady-scalone.png
- Do decyzji właściciela: tylko karty-odnośniki czy także rysunki hero (dziś: rysunki złożeniowe „zespołu”) w tym samym języku układów scalonych.
