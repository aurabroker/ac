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
