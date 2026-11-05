# Plan grafik: 16 maszyn zamiast jednego procesora

Status: **wdrożone 5.11.2026** (gałąź `claude/aura-consulting-redesign-fX1bn`; kolejka zmian, punkt 11). Decyzje właściciela i odstępstwa od planu — na końcu dokumentu. Zasady stosowania na co dzień: `docs/CONVENTIONS.md` §6, „Rysunki izometryczne”.

Układ scalony był przykładem stylu, a stał się jedynym obrazkiem w serwisie. Proponuję **16 różnych rysunków**. Każdy pokazuje przedmiot albo mechanizm, który wynika z tematu strony: koła zębate z wyłamanym zębem przy OC zawodowym, szafę serwerową przy cyber, żuraw z przeciwwagą przy gwarancjach.

Wszystkie rysunki powstają w jednym języku, tak jak dziś: rzut izometryczny, czarny tusz, jeden błękit kreślarski i czerwień tylko jako sygnał. Części rozsuwają się przy przewijaniu. Dzięki temu serwis nadal wygląda jak jeden szkicownik inżyniera, a nie zbiór ikon.

## Co się zmieni na stronie

- **Miniatury na kartach** (strona główna, katalog, blog, „Powiązane”): zamiast układu scalonego każda karta pokazuje rysunek swojej strony. W siatce 16 kart na stronie głównej będzie 13 różnych maszyn, a trzy z nich wystąpią w dwóch wariantach. Jedyna para z tej samej rodziny stojąca obok siebie to crime i fintech (wkładka zamka obok drzwi skarbca).
- **Rysunek w nagłówku** obok „W skrócie” (28 stron): ten sam rysunek co na karcie, w większym formacie, z czterema podpisami zamiast trzech.
- **Rysunki ręczne zostają bez zmian**: strona główna, 4 filary, katalog i „Rynek Lloyd’s”. Na kartach te strony dostają miniaturę, która, jeśli się da, pokazuje w 3D ten sam obiekt co ich rysunek: zespół na osi, belkę, szafę z serwerowni, maszynę modelu AI, szuflady katalogu i rozdzielacz udziałów.
- **Strony prawne** dostają spokojną miniaturę bez podpisów, bez błękitu i czerwieni, bez ruchu. Każda pokazuje inny przedmiot: zamkniętą kasetkę, pulpit z jednym formularzem i szafę aktową.
- **Procesor znika z serwisu całkowicie.** Żadna strona nie jest o półprzewodnikach. Sprzęt elektroniczny przy „Mieniu” rysujemy jako szafkę z serwerem i laptop w hali, nie jako układ scalony.

## Katalog rysunków

| # | Rysunek | Co rysujemy | Dlaczego tak | Strony |
|---|---|---|---|---|
| 1 | **Zespół na osi** | Wał na łożyskach, na nim rozsunięte wzdłuż osi: kołnierz, sprężyna, tarcze, podkładka i pokrywa w przekroju (jak rysunek ze strony głównej). Wariant „sprzęgło”: dwa wały połączone sprzęgłem kłowym. | Program ubezpieczenia to części złożone na jednej osi. Pokrywa to wyłączenia, jak na rysunku F-00. Tech E&O łączy OC zawodowe i cyber w jeden napęd, czyli dosłownie sprzęgło. | `/` (karta), `/o-nas/`, `/wiedza/tech-eo-a-oc-zawodowe/` |
| 2 | **Belka na podporach** | Dwuteownik na podporach, strzałki obciążeń w dół. Warianty: belka ciągła na trzech podporach; belka z blokiem „umowa”; wspornik przerzucony nad przerwą na drugą płytę, gdzie podpora jest narysowana linią przerywaną. | To ten sam „schemat obciążeń” co na rysunku filaru IT: polisy to podpory, roszczenia to obciążenia. Klient w umowie określa, jakie obciążenie trzeba unieść. USA i Kanada to wspornik, który trzyma się tylko wtedy, gdy obejmuje go polisa. | `/oc-cyber-dla-it/` (karta), `/wiedza/klient-wymaga-oc-od-kontraktora/`, `/wiedza/usa-kanada-w-polisie/` |
| 3 | **Przekładnia zębata** | Duże koło napędzane (projekt klienta) i mały zębnik (Twoja usługa) z jednym wyłamanym zębem. Obok, niezazębione, leży luźne koło. | Twoja praca to koło w maszynie klienta. Jeden wyłamany ząb, czyli błąd albo zaniechanie, zatrzymuje projekt i rodzi roszczenie, a za to płaci OC zawodowe. Przy programiście bardzo mały zębnik napędza duże koło: jedna osoba, duży projekt. | `/oc-zawodowe/` (karta), `/wiedza/oc-programisty-b2b/` |
| 4 | **Szafa serwerowa** | Szafa rack: cokół, rama, kopie zapasowe, serwer danych, wysuwana konsola, pokrywa z wentylatorami, kabel zasilania. Wariant „blokada”: na drzwiach skobel z cudzą kłódką, a jedna kaseta kopii wyjęta obok. | Cyber chroni własne systemy i dane, a ich części to moduły polisy: konsola to reakcja na incydent, kopie to odtworzenie, kłódka to wymuszenie. To te same szafy co w serwerowni na rysunku filaru cyber. Ransomware to dosłownie cudza kłódka na Twoich danych. | `/ubezpieczenie-cyber/` (karta), `/wiedza/ransomware-2-0/` |
| 5 | **Maszyna modelu AI** | Obudowa z uniesioną pokrywą, w środku trzy pionowe płyty sieci, z lewej lej z danymi, na górze gniazdo z kluczem, z prawej taca wyników z przymiarem tolerancji. Wariant „firma”: mniejsza maszyna na stole warsztatowym z trzema narzędziami: ramieniem z chwytakiem (agent), panelem wiadomości (chatbot) i tacą dokumentów (asystent). | To ten sam schemat co rysunek filaru AI. Ochrona dotyczy tego, co z maszyny wychodzi (błędny wynik to OC zawodowe), co do niej wchodzi (dane to cyber) i kto trzyma klucz (przejęty klucz i deepfake to cyberprzestępstwa). „AI w firmie” pokazuje tę samą maszynę jako narzędzie w pracy. | `/ubezpieczenie-ai/` (karta), `/ubezpieczenie-ai/ai-w-firmie/` |
| 6 | **Manometr ze strefami** | Manometr rozłożony na części: króciec, obudowa, tarcza z czterema strefami (same kreski, bez cyfr; ostatnia czerwona), wskazówka, szybka. Wariant „zawór”: manometr na zbiorniku, obok zawór bezpieczeństwa rozłożony na korpus, sprężynę i grzybek. | AI Act dzieli systemy według poziomu ryzyka, a jedna strefa jest zakazana: inżynier rysuje to jako tarczę z czerwonym polem. W artykule o polisie przepisy podnoszą ciśnienie, polisa jest zaworem, który je przejmuje, a kary zostają w czerwonym polu. | `/regulacje/ai-act/`, `/wiedza/ai-act-a-ubezpieczenie/` |
| 7 | **Przenośnik taśmowy** | Taśma na nogach z rolkami, na niej kartony. Warianty: z torem zwrotnym w kształcie litery U (recall); z bramką, z której zjeżdża kaseta aktualizacji nad urządzeniami; z taśmą napędzaną parą kół zębatych. | OC za produkt dotyczy tego, co zeszło z linii, a recall to zawrócenie partii. Dyrektywa PLD uznaje oprogramowanie i brak aktualizacji za wadę. Przy software house koło (usługa, OC zawodowe) napędza linię produktu (OC za produkt), więc widać, gdzie jedno się kończy, a drugie zaczyna. | `/ubezpieczenia/oc-produktu-i-wycofanie/`, `/regulacje/pld/`, `/wiedza/pld-a-oc-software-house/` |
| 8 | **Instalacja rurowa** | Rury z kołnierzami na podporach, jedna armatura na stronę. Warianty: kolektor z dwoma wlotami i tabliczką BROKER; rozdzielacz dzielący jeden przepływ na gałęzie; licznik z nielegalnym odczepem tuż za nim; para kołnierzy z uszczelką i rysą. | Wszystko, co płynie, rysujemy jako rury. Zapytania płyną do brokera. Rynek dzieli ryzyko na udziały, co jest 3D wersją rysunku „Rynek Lloyd’s”. Przy LLMjacking ktoś podpiął się za Twoim licznikiem, a rachunek przychodzi do Ciebie. Transakcja łączy dwie spółki jak kołnierze, a polisa jest uszczelką. | `/kontakt/`, `/rynek-lloyds/` (karta), `/wiedza/llmjacking/`, `/ubezpieczenia/ubezpieczenia-transakcyjne/` |
| 9 | **Mechanizm zamka** | Warianty: wkładka bębenkowa z kołkami i sprężynami wyjętymi z gniazd, z kluczem i dorobioną kopią klucza; okrągłe drzwi skarbca z ryglami wysuniętymi promieniście i kołem z trzema szprychami; zamknięta kasetka (wersja spokojna). | Crime: kto otwiera zamek, czyli pracownik od środka, oszust z zewnątrz albo ktoś z kluczem dorobionym podstępem (socjotechnika). Instytucja finansowa: każda polisa to jeden rygiel drzwi skarbca. Polityka prywatności: dane pod zamknięciem. | `/ubezpieczenia/ubezpieczenie-crime/`, `/ubezpieczenia/instytucje-finansowe-i-fintech/`, `/polityka-prywatnosci/` (spokojna) |
| 10 | **Stół** | Długi stół zarządu z sześcioma pustymi krzesłami i tabliczką D&O; jedno krzesło odsunięte. Wersja spokojna: pulpit z jednym formularzem. | D&O chroni ludzi przy stole zarządu. Krzesła to osoby (bez twarzy), a stół to spółka. Odsunięte krzesło to osoba, która straciła ochronę przez działanie umyślne. Reklamacje to jedno pismo na pulpicie. | `/ubezpieczenia/oc-czlonkow-zarzadu-d-o/`, `/reklamacje/` (spokojna) |
| 11 | **Prasa** | Warianty: ręczna prasa drukarska (łoże, forma, arkusz, docisk, pokrętło) ze stosem wydrukowanych arkuszy; tłocznik na czterech słupach (matryca z charakterystycznym kształtem, stempel) z wypraską-kopią obok. | OC mediów dotyczy tego, co drukujesz i publikujesz. Ochrona prawna IP to spór o wzór: Twoja matryca i cudza kopia. Obie maszyny powielają, jedna treść, druga kształt. | `/ubezpieczenia/oc-mediow/`, `/ubezpieczenia/ochrona-prawna-ip/` |
| 12 | **Pompa strzykawkowa** | Obudowa z pustym okienkiem, napęd śrubowy, strzykawka z podziałką; wypełnienie w dwóch pasach (dolny i górny), gniazdo danych. | Urządzenie medyczne sterowane programem to dokładnie styk OC placówki, OC technologii i cyber. Dwa pasy pokazują, że OC nadwyżkowe leży na obowiązkowym. | `/ubezpieczenia/oc-ochrona-zdrowia/` |
| 13 | **Budynek w przekroju** | Makieta: posadzka, ściany przecięte w połowie, dach uniesiony. Wariant „lokal”: pokój klienta w czasie wizyty technika (drabina, skrzynka, przeciekająca rura i kałuża). Wariant „hala”: dach piłokształtny, regały, maszyna, szafka z serwerem, laptop. | OC działalności to szkody wyrządzone innym w realnym miejscu, np. technik zalewa biuro klienta (ta scena jest w tekście strony). Mienie i przerwa w działalności to dosłownie budynek, sprzęt i czas przestoju. | `/ubezpieczenia/oc-dzialalnosci/`, `/ubezpieczenia/mienie-i-sprzet-elektroniczny/` |
| 14 | **Żuraw z przeciwwagą** | Żuraw wieżowy: maszt kratowy, wysięgnik z hakiem i ładunkiem, przeciwwysięgnik ze stosem płyt przeciwwagi; drugi ładunek na ziemi poza zasięgiem haka. | Gwarancja to przeciwwaga, dzięki której kontrakt się nie przewróci. Wadium, należyte wykonanie i płatność to osobne płyty. Ładunek na ziemi pokazuje, czego gwarancja nie robi: nie chroni wykonawcy przed jego własną stratą. | `/ubezpieczenia/gwarancje-ubezpieczeniowe/` |
| 15 | **Kaseta z gniazdami** | Otwarta skrzynka z wkładką, w której gniazda wycięto na wymiar, a przedmioty unoszą się nad nimi. Warianty: płytki wzorcowe (wieko A–Z); bryły o nietypowych kształtach, z których jedna nie pasuje nigdzie; przybory kreślarskie (cyrkiel, ekierka, grafion, przymiar). | Słownik to wzorce, którymi mierzy się każdą polisę. Ryzyko nietypowe wymaga gniazda wyciętego na miarę, a czego nie da się ubezpieczyć, nie pasuje do żadnego. Na profilu osoby specjalizacje to przyrządy w jednej kasecie. | `/slownik/`, `/ubezpieczenia/ryzyka-nietypowe/`, `/zespol/marek-ciesla/` |
| 16 | **Archiwum arkuszy** | Niska komoda kreślarska z płaskimi szufladami; wysunięte szuflady z uniesionymi arkuszami. Wersja spokojna: wysoka, zamknięta szafa aktowa. | Strony-indeksy to zbiory arkuszy (serwis nazywa się „Arkusz”). W katalogu szuflady to grupy ryzyka, jak wiersze zestawienia na rysunku katalogu. Na blogu szuflada z tekstami. „Informacje o brokerze” to dokument rejestrowy w archiwum. | `/ubezpieczenia/` (karta), `/wiedza/`, `/informacje-o-brokerze/` (spokojna) |

## Mapa wszystkich 38 stron

Legenda: **N+K** to rysunek w nagłówku i na karcie, **K** to tylko karta (strona ma rysunek ręczny), **S** to spokojna miniatura strony prawnej.

| Strona | Rysunek (wariant) | Gdzie | Podpisy (przykład) | Czerwień |
|---|---|---|---|---|
| `/` | zespół na osi (program) | K | OC i cyber dla IT · Ubezpieczenie AI | pokrywa: Wyłączenia |
| `/o-nas/` | zespół na osi (program) | N+K | Umowy i ryzyko klienta · Porównanie rynków · Zakres w ofercie | pokrywa: Wyłączenia i podlimity |
| `/wiedza/tech-eo-a-oc-zawodowe/` | zespół na osi (sprzęgło) | N+K | Tech E&O · Rozszerzenie · Cyber | osłona: Kary umowne |
| `/oc-cyber-dla-it/` | belka (ciągła) | K | OC zawodowe · Cyber | strzałka za końcem belki: Kary umowne |
| `/wiedza/klient-wymaga-oc-od-kontraktora/` | belka (umowa) | N+K | OC zawodowe · OC działalności · Cyber | strzałka za końcem belki: Kary umowne |
| `/wiedza/usa-kanada-w-polisie/` | belka (wspornik) | N+K | OC zawodowe · USA i Kanada (podpora przerywana) | strzałka na końcu wspornika: Odszkodowania karne |
| `/oc-zawodowe/` | przekładnia (para kół) | K | OC zawodowe · Rozszerzenie | luźne koło: Kary umowne |
| `/wiedza/oc-programisty-b2b/` | przekładnia (mały zębnik) | N+K | OC zawodowe · Rozszerzenie OC · Cyber | luźne koło: Kary umowne |
| `/ubezpieczenie-cyber/` | szafa serwerowa | K | Reakcja na incydent · Odtworzenie i przestój | przecięty kabel: Awarie infrastruktury |
| `/wiedza/ransomware-2-0/` | szafa serwerowa (blokada) | N+K | Wymuszenie · Odtworzenie i przestój · Reakcja na incydent · Odpowiedzialność | przecięty kabel: Awarie infrastruktury |
| `/ubezpieczenie-ai/` | maszyna AI (model) | K | OC zawodowe · Cyberprzestępstwa | przecięty kabel: Awarie infrastruktury |
| `/ubezpieczenie-ai/ai-w-firmie/` | maszyna AI (firma) | N+K | OC zawodowe · Cyber · Cyberprzestępstwa | upuszczony detal: Własna strata z decyzji AI |
| `/regulacje/ai-act/` | manometr | N+K | Systemy wysokiego ryzyka · Obowiązki przejrzystości · Kompetencje w zakresie AI | strefa tarczy: Zakazane praktyki |
| `/wiedza/ai-act-a-ubezpieczenie/` | manometr (zawór) | N+K | OC zawodowe · Koszty postępowań · OC za produkt · Cyber | strefa tarczy: Kary i grzywny |
| `/ubezpieczenia/oc-produktu-i-wycofanie/` | przenośnik (tor zwrotny) | N+K | OC za produkt · Wycofanie produktu · Rozszerzenie OC za produkt | karton zdjęty z taśmy: Wymiana samego produktu |
| `/regulacje/pld/` | przenośnik (aktualizacja) | N+K | Szkody osób fizycznych · Brak aktualizacji · Oprogramowanie i AI | skrzynia na bocznicy: Straty B2B poza dyrektywą |
| `/wiedza/pld-a-oc-software-house/` | przenośnik (napęd kołami) | N+K | OC zawodowe · OC za produkt · Cyber | odłożona kaseta: Poprawka oprogramowania |
| `/kontakt/` | rury (kolektor) | N+K | wloty: Telefon · Formularz; wyloty: Analiza ryzyka · Zgłoszenie szkody | brak |
| `/rynek-lloyds/` | rury (rozdzielacz) | K | Broker klienta · Pośrednik · Ubezpieczyciel prowadzący | brak |
| `/wiedza/llmjacking/` | rury (licznik z odczepem) | N+K | Cyber: koszty własne · Cyberprzestępstwa · Cyber: odpowiedzialność | zaślepka: Zużycie zgodne z umową |
| `/ubezpieczenia/ubezpieczenia-transakcyjne/` | rury (kołnierz) | N+K | Polisa kupującego · Polisa sprzedającego · Ryzyka zidentyfikowane | rysa bez opaski: Naruszenia znane kupującemu |
| `/ubezpieczenia/ubezpieczenie-crime/` | zamek (wkładka) | N+K | Nadużycia pracowników · Przestępstwa osób trzecich · Socjotechnika · Mienie klientów | odłożone kołki: Szkody pośrednie |
| `/ubezpieczenia/instytucje-finansowe-i-fintech/` | zamek (skarbiec) | N+K | OC zawodowe · Crime · D&O · Cyber | cofnięty rygiel: Straty z inwestycji |
| `/polityka-prywatnosci/` | zamek (kasetka) | S | — | — |
| `/ubezpieczenia/oc-czlonkow-zarzadu-d-o/` | stół (zarząd) | N+K | Ochrona osób · Ochrona spółki · Rozszerzenie | odsunięte krzesło: Działanie umyślne |
| `/reklamacje/` | stół (pulpit) | S | — | — |
| `/ubezpieczenia/oc-mediow/` | prasa (drukarska) | N+K | Zniesławienie · Prawa autorskie · Wizerunek i prywatność | arkusz poza stosem: Umyślne naruszenie |
| `/ubezpieczenia/ochrona-prawna-ip/` | prasa (tłocznik) | N+K | Obrona · Dochodzenie | matryca poza obrysem: Nowy wzór bez zgłoszenia |
| `/ubezpieczenia/oc-ochrona-zdrowia/` | pompa strzykawkowa | N+K | OC obowiązkowe · OC nadwyżkowe · OC technologii · Cyber | odłączona wtyczka: Kary administracyjne |
| `/ubezpieczenia/oc-dzialalnosci/` | budynek (lokal) | N+K | OC deliktowe · OC kontraktowe · OC najemcy · Mienie powierzone | monitor z kodem poza lokalem: Czyste straty finansowe |
| `/ubezpieczenia/mienie-i-sprzet-elektroniczny/` | budynek (hala) | N+K | Mienie · Sprzęt elektroniczny · Przerwa w działalności | kaseta danych poza halą: Dane bez szkody fizycznej |
| `/ubezpieczenia/gwarancje-ubezpieczeniowe/` | żuraw | N+K | Gwarancja wadialna · Gwarancja kontraktowa · Gwarancja płatności | ładunek na ziemi: Strata wykonawcy |
| `/slownik/` | kaseta (wzorce) | N+K | Claims made · Data retroaktywna · Suma gwarancyjna · Udział własny | brak |
| `/ubezpieczenia/ryzyka-nietypowe/` | kaseta (na miarę) | N+K | Wydarzenia · Badania kliniczne · Bezpieczeństwo osób · Terroryzm i sabotaż | bryła bez gniazda: Działania wojenne |
| `/zespol/marek-ciesla/` | kaseta (przybory) | N+K | Cyber · OC zawodowe · D&O · Transakcje | brak |
| `/ubezpieczenia/` | archiwum (komoda) | K | Szkody wyrządzone innym · Zarząd i nadużycia · Transakcje i IP | brak (szuflada ryzyk nietypowych linią przerywaną) |
| `/wiedza/` | archiwum (komoda z arkuszami) | N+K | OC i cyber dla IT · Ubezpieczenie AI · Cyber · OC zawodowe | brak |
| `/informacje-o-brokerze/` | archiwum (szafa aktowa) | S | — | — |

Na miniaturze mieszczą się najwyżej trzy podpisy razem z czerwonym, a w nagłówku cztery.

## Zasady, które trzymają całość razem

1. **Jeden temat, jedna maszyna.** OC zawodowe to zawsze koła zębate, cyber to szafa serwerowa, AI to maszyna modelu, AI Act to manometr, produkt i PLD to przenośnik, a wszystko, co płynie (kontakt, rynek, kradzież zasobu, transakcja), to rury. Pieniądze i nadużycia to zamki, zarząd to stół, treść i wzory to prasa, lokal i mienie to budynek, gwarancje to żuraw, wzorce i dopasowanie to kaseta, a indeksy i dokumenty to archiwum. Program jako całość to zespół na osi.
2. **Wspólna płyta pod każdym rysunkiem.** Każdy przedmiot stoi na tej samej cienkiej płycie z przerywanym obrysem ochrony i znacznikami na krawędziach. Na płycie nie ma ścieżek, pól ani kulek, żeby nic nie przypominało płytki drukowanej.
3. **Ta sama kreska.** Wszędzie ten sam rzut izometryczny, ta sama grubość tuszu i linii pomocniczych, linia przerywana dla elementów warunkowych, białe górne ściany i dwa szare boczne. Kreskowanie pojawia się tylko w przekrojach.
4. **Kolory mają stałe znaczenie.** Tusz to przedmiot i zdarzenie objęte ochroną (wyłamany ząb, dorobiony klucz, nielegalny odczep). Błękit to części, które niosą moduły ochrony. Czerwień to dokładnie jedna rzecz, której polisa nie niesie: zwykle leży poza obrysem ochrony, a wyjątkami są strefa na tarczy manometru i pokrywa zespołu na osi (jak na rysunku ze strony głównej). Zdarzenie objęte ochroną nigdy nie jest czerwone.
5. **Czerwony podpis mówi, co pokazuje.** Jest to konkretne wyłączenie z tabeli zakresu tej strony, np. „Kary umowne” albo „Działanie umyślne”, a ogólne „Wyłączenia” tylko wtedy, gdy nic konkretnego nie pasuje.
6. **Rozstrzelenie.** Części rozsuwają się w górę raz, gdy rysunek wejdzie w widok. Zespół na osi rozsuwa się wzdłuż wału. Czerwona część odsuwa się w bok, czyli „wypada” z zespołu. Przy wyłączonych animacjach w systemie rysunek stoi już rozsunięty, bez ruchu.
7. **Podpisy jak dziś.** Pismo maszynowe wersalikami, kropka z odnośnikiem, prawa kolumna; lewa kolumna tylko dla wlotów rur (kontakt, rynek). Podpisy biorą słowa wyłącznie z treści strony. Bez liczb i statystyk, bez nazw firm, ubezpieczycieli, logo i nazwy rynku.
8. **Tabliczka znamionowa zamiast napisu na układzie scalonym.** Krótki skrót z tytułu: D&O, W&I, TECH E&O, LLMJACKING, RANSOMWARE, AI ACT, A–Z, BROKER, WIEDZA. Nigdy marka.
9. **Bez twarzy.** Ludzi zastępują puste krzesła i narzędzia.
10. **Warianty w siatkach kart.** Ten sam rysunek stoi obok siebie tylko z wyraźnie inną sylwetką (wkładka i skarbiec; tor zwrotny, bramka i napęd kołami; belka ciągła i wspornik). Adres strony zmienia tylko drobiazgi, np. liczbę zębów, kartonów czy to, która szuflada jest wysunięta, a nigdy sam rysunek.
11. **Strony prawne są spokojne.** Bez podpisów, kolorów i ruchu, a każda strona pokazuje inny przedmiot.
12. **Lekkość.** Miniatura ma około 3–4 KB i powstaje przy budowaniu strony, bez skryptów i plików z zewnątrz. Opis dla czytników ekranu mówi po polsku, co jest na rysunku, np. „Przekładnia zębata w widoku rozstrzelonym…”.

## Gdzie ten sam rysunek celowo stoi obok siebie

Sprawdziłem wszystkie rzędy kart na zbudowanym podglądzie. Nigdzie nie stoją obok siebie dwa identyczne rysunki. Rodzeństwo z wyraźnie inną sylwetką sąsiaduje w siedmiu miejscach:

- crime i fintech (wkładka zamka i drzwi skarbca) na stronie głównej i w katalogu;
- trzy warianty przenośnika w „Powiązanych” przy produkcie, PLD i AI Act;
- belka ciągła obok wspornika na „Rynku Lloyd’s” i w artykule o Tech E&O;
- licznik obok rozdzielacza na filarze IT;
- komoda obok szafy aktowej na „Rynku Lloyd’s”.

## Procesor

**Znika ze wszystkich stron.** Żadna strona serwisu nie jest o układach scalonych, więc pozostawiony procesor znowu byłby tylko ozdobą. Elektronikę rysujemy tam, gdzie jest przedmiotem ubezpieczenia, czyli jako szafę serwerową (cyber, ransomware) albo szafkę z serwerem i laptop w hali („Mienie i sprzęt elektroniczny”).

## Z czego to złożyłem

Trzech projektantów przygotowało razem 47 propozycji. Każdą oceniłem za trafność, spójność ze szkicownikiem, czytelność w małej miniaturze, łatwość wykonania, odrębność i brak kliszy. Oceny zostały w materiałach roboczych planu (poza repozytorium).

- **Wziąłem** pomysły najmocniejsze logicznie:
  - przekładnię z wyłamanym zębem, belkę, manometr, żuraw, pompę, rury z czterema rodzajami armatury i dwie skale zamka;
  - szafę serwerową, maszynę modelu AI i stół zarządu;
  - zespół na osi, tłocznik, kasetę z gniazdami i komodę na arkusze.
- **Odrzuciłem** z kilku powodów:
  - jako klisze: koło sterowe, linię EKG, globus, robota jako znak AI, telefon jako ikonę i biurko z monitorami;
  - jako podobne do dawnego układu scalonego: piramidę ze stosu płyt;
  - jako za luźno związane z tematem: turbinę przy ryzykach nietypowych i rozdzielnicę przy cyber;
  - ze względu na limit szesnastu rysunków: stół kreślarski i suwmiarkę czasu.

## Jak to wdrożymy

1. **Szkice do akceptacji.** Rysujemy 16 motywów w czterech równoległych grupach i pokazujemy je na jednym arkuszu PNG: miniatury 360×190 oraz nagłówki szerokie i wąskie.
2. **Wspólny zestaw kształtów.** Potrzebne są walce w każdej osi, koła zębate, dwuteownik, strzałki, kreskowanie, krzesło, kłódka i szuflady. Grafiki procesora (kulki, wyprowadzenia, ścieżki) usuwamy.
3. **Podmiana w generatorze.** Wpisujemy tabelę „strona → rysunek i wariant” oraz poprawiamy podpisy we frontmatterze tam, gdzie nazwy modułów są za długie albo się powtarzają.
4. **Kontrola.** Sprawdzamy, że każda strona ma rysunek i że nigdzie obok siebie nie stoją dwa identyczne. Podpisy mają do 28 znaków i nie zawierają cyfr, a miniatura mieści się w około 4 KB. Na koniec robimy zrzuty strony głównej, katalogu i bloga.

## Decyzje właściciela (5.11.2026)

Zgłoszenie właściciela (streszczenie): grafiki procesora były tylko przykładem, a teraz procesor widać wszędzie — zaplanować kilkanaście innych, logicznie spójnych grafik. Po przedstawieniu planu: „wykonaj”. Na cztery pytania planu przyjęto rekomendacje:

1. **Procesor** znika całkowicie — z miniatur, nagłówków, ról rysunku i stylów; elektronika tylko jako sprzęt, który jest przedmiotem strony (szafa serwerowa, szafka z serwerem w hali).
2. **Czerwony podpis** to konkretne wyłączenie z tabeli zakresu strony (≤ 28 znaków), a nie ogólne „Wyłączenia”.
3. **Trzy przenośniki** zostają jedną rodziną „produkt” w trzech wyraźnie różnych wariantach (tor zwrotny, bramka z aktualizacją, napęd kołami).
4. **Wdrożenie naraz** — wszystkie strony przełączone jednocześnie. Rysunki ręczne (strona główna, 4 filary, `/ubezpieczenia/`, `/rynek-lloyds/`) bez zmian, te strony dostały tylko nowe miniatury; strony prawne — spokojne miniatury.

## Stan wdrożenia i odstępstwa od planu

- Generator: `src/lib/iso/` — kontrakt sceny (`scene.ts`), wspólne prymitywy (`prims.ts`), jeden plik na motyw (`motifs/<motyw>.ts`), tabela strona → motyw (`pages.ts`). Każdy rysunek stoi na tej samej płycie bazowej z przerywanym obrysem ochrony; kolory tylko z tokenów (dodany jeden błękitny i jeden czerwony odcień boku).
- Kontrola w CI: `npm run validate:iso` (każda strona ma miniaturę, brak procesora, brak identycznych sąsiadów w siatkach kart, podpisy ≤ 28 znaków bez liczb, miniatura ≤ 4 KB gz, opis bez „układu scalonego”).
- Szkice przeszły krytykę arkusza i poprawki przed wdrożeniem; na miniaturach nie ma drobiazgów (nakrętek, podkładek, sprężyn) — zostają w nagłówkach.
- Odstępstwa:
  - `/ubezpieczenia/`: podpisy „Zarząd i nadużycia” i „Transakcje i IP” — tak brzmią skróty grup na tej stronie.
  - Tłocznik (ochrona prawna IP): zamiast czterech słupów dwa krótkie kołki prowadzące; kształt matrycy, stempla i kopii — butelka, żeby wnęka była czytelna z góry.
  - Maszyna modelu AI: bez przymiaru tolerancji; pokrywa uniesiona i odsunięta w lewo, żeby nie zasłaniała płyt sieci.
  - Hala (mienie): dach jako obrys nad tylną ścianą, bez bramy i gaśnicy; w miniaturze jeden regał.
  - Zespół na osi i zawór manometru: sprężyna, otwory i podkładka tylko w nagłówku, w miniaturze obudowa zamiast sprężyny.
  - Nagłówki z limitem czterech podpisów: część slotów nie ma podpisu (np. „Cyber” przy gnieździe danych pompy, „Umowa B2B” na belce).
