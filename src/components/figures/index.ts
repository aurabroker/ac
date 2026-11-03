/**
 * Rejestr rysunków. Właściciel: agent „figures”.
 * Frontmatter `figure: <id>` oraz <Figure id="…"/> / <AnnotatedFigure figure="…"/> korzystają z tego rejestru.
 * Nowy rysunek: dodaj plik .astro (kontrakt jak w F00Home.astro) + wpis w FIGURES i FIGURE_META.
 */
import F00Home from './F00Home.astro';
import FigPillarIT from './FigPillarIT.astro';
import FigPillarAI from './FigPillarAI.astro';
import FigPillarCyber from './FigPillarCyber.astro';
import FigPillarPI from './FigPillarPI.astro';
import FigLloyds from './FigLloyds.astro';
import FigCatalogue from './FigCatalogue.astro';

export const FIGURES = {
  F00Home, FigPillarIT, FigPillarAI, FigPillarCyber, FigPillarPI, FigLloyds, FigCatalogue,
} as const;

export type FigureId = keyof typeof FIGURES;

export interface FigureMeta {
  /** Numer rysunku na arkuszu, np. „F-00”. */
  code: string;
  /** Podpis (figcaption). */
  caption: string;
  /** Legenda odnośników 1…n — tekst w HTML (etykiety w SVG są aria-hidden). */
  legend: string[];
  /**
   * Interaktywne części (rysunek hero): parts[i] ↔ legend[i] ↔ balon i+1 ↔ elementy SVG z data-part="i+1".
   * Karta objaśnienia: tytuł, jedno zdanie (tylko twierdzenia obecne na stronach serwisu) i link.
   */
  parts?: FigurePart[];
}

export interface FigurePart {
  title: string;
  text: string;
  href: string;
  link: string;
}

export const FIGURE_META: Record<FigureId, FigureMeta> = {
  "F00Home": {
    "code": "F-00",
    "caption": "Rysunek złożeniowy: program ubezpieczenia jako precyzyjny zespół",
    "legend": [
      "Data retroaktywna — baza A, od której liczą się objęte błędy",
      "Udział własny — część szkody, którą firma pokrywa sama",
      "OC zawodowe — roszczenia klientów za błędy w usługach",
      "Ubezpieczenie cyber — koszty i roszczenia po incydencie",
      "Klauzula AI — sprawdzamy, jak polisa traktuje AI",
      "USA i Kanada — tylko gdy obejmuje je zakres terytorialny",
      "Wyłączenia — przekrój pokazujący granice zakresu",
      "Suma gwarancyjna i podlimity — wymiary programu"
    ],
    "parts": [
      {
        "title": "Data retroaktywna",
        "text": "Najwcześniejsza data błędu objętego polisą claims made. Błędy sprzed niej zwykle są poza zakresem, dlatego przy zmianie ubezpieczyciela warto ją zachować.",
        "href": "/slownik/#data-retroaktywna",
        "link": "Słownik: data retroaktywna"
      },
      {
        "title": "Udział własny",
        "text": "Część szkody, którą firma pokrywa sama. Roszczenia z jednej przyczyny obciąża zwykle jeden udział własny.",
        "href": "/slownik/#udzial-wlasny",
        "link": "Słownik: udział własny"
      },
      {
        "title": "OC zawodowe",
        "text": "Roszczenia klientów za błędy w usługach: odszkodowania i koszty obrony, zgodnie z warunkami polisy.",
        "href": "/oc-zawodowe/",
        "link": "OC zawodowe"
      },
      {
        "title": "Ubezpieczenie cyber",
        "text": "Reakcja na incydent, odtworzenie danych, przerwa w działalności i roszczenia po wycieku — w limitach polisy.",
        "href": "/ubezpieczenie-cyber/",
        "link": "Ubezpieczenie cyber"
      },
      {
        "title": "Klauzula AI",
        "text": "Potwierdza, że samo użycie AI nie odbiera ochrony tam, gdzie warunki AI nie wyłączają. Nie tworzy osobnego limitu.",
        "href": "/ubezpieczenie-ai/",
        "link": "Ubezpieczenie AI"
      },
      {
        "title": "USA i Kanada",
        "text": "Ochrona działa tylko wtedy, gdy obejmuje je zakres terytorialny. Polscy ubezpieczyciele mogą odmówić ochrony, objąć ją podlimitem albo zaproponować bardzo wysoką składkę.",
        "href": "/oc-cyber-dla-it/#jak-dziala-ochrona-przy-pozwach-w-usa-i-kanadzie",
        "link": "USA i Kanada w polisie"
      },
      {
        "title": "Wyłączenia",
        "text": "Granice zakresu, np. kary umowne, service credits czy kary, których prawo nie pozwala ubezpieczyć — zależnie od polisy.",
        "href": "/oc-cyber-dla-it/#czego-polisa-oc-i-cyber-dla-it-zwykle-nie-obejmuje",
        "link": "Czego polisa nie obejmuje"
      },
      {
        "title": "Suma gwarancyjna i podlimity",
        "text": "Górna granica wypłat na jedno roszczenie i łącznie w okresie. Podlimit to niższy limit wydzielony dla określonego ryzyka.",
        "href": "/slownik/#suma-gwarancyjna",
        "link": "Słownik: suma gwarancyjna"
      }
    ]
  },
  "FigPillarIT": {
    "code": "F-IT",
    "caption": "Schemat obciążeń: jak program OC i cyber przejmuje ryzyka firmy IT",
    "legend": [
      "OC zawodowe (Technology Errors & Omissions, Tech E&O) — podpora A: roszczenia klientów za błędy w usługach IT",
      "Ubezpieczenie cyber — podpora B: Twoje koszty po incydencie i roszczenia po wycieku danych",
      "Strefa styku — wyciek danych klienta przez lukę w kodzie może dotyczyć obu polis",
      "OC działalności — podpora C: szkody osobowe i rzeczowe wyrządzone innym",
      "USA i Kanada — wspornik działa tylko wtedy, gdy polisa obejmuje to terytorium i jurysdykcję"
    ],
    "parts": [
      {
        "title": "OC zawodowe (Tech E&O)",
        "text": "Roszczenia klientów za błędy w usługach IT: odszkodowania i koszty obrony, zgodnie z warunkami polisy.",
        "href": "/oc-cyber-dla-it/#co-obejmuje-oc-zawodowe-firmy-it",
        "link": "Co obejmuje OC zawodowe"
      },
      {
        "title": "Ubezpieczenie cyber",
        "text": "Twoje koszty po incydencie i roszczenia po wycieku danych — w limitach i po franszyzach z polisy.",
        "href": "/oc-cyber-dla-it/#co-obejmuje-ubezpieczenie-cyber-dla-firmy-it",
        "link": "Co obejmuje cyber"
      },
      {
        "title": "Strefa styku OC i cyber",
        "text": "Wyciek danych klienta przez lukę w kodzie może dotyczyć obu polis. Przy jednej polisie łatwiej uniknąć sporu o to, kto płaci.",
        "href": "/oc-cyber-dla-it/#czy-firma-it-potrzebuje-oc-zawodowego-cyber-czy-obu",
        "link": "OC, cyber czy oba?"
      },
      {
        "title": "OC działalności",
        "text": "Szkody osobowe i rzeczowe wyrządzone innym, np. sprzęt uszkodzony w serwerowni klienta.",
        "href": "/ubezpieczenia/oc-dzialalnosci/",
        "link": "OC działalności"
      },
      {
        "title": "USA i Kanada",
        "text": "Wspornik działa tylko, gdy polisa obejmuje to terytorium i jurysdykcję. Dla USA limit bywa jednym rocznym limitem łącznym.",
        "href": "/oc-cyber-dla-it/#jak-dziala-ochrona-przy-pozwach-w-usa-i-kanadzie",
        "link": "Pozwy w USA i Kanadzie"
      }
    ]
  },
  "FigPillarAI": {
    "code": "F-AI",
    "caption": "Schemat: system AI od danych wejściowych do wyniku — halucynacja jako wynik poza tolerancją",
    "legend": [
      "Dane wejściowe — ujawnienie danych lub zarzut naruszenia praw: cyber albo OC zawodowe, zależnie od polisy",
      "Model i jego dostawca — zatrzymanie systemu: przerwa w działalności w części cyber, przy odpowiedniej definicji",
      "Klucz API — przejęcie klucza i rachunek za tokeny: moduł cyberprzestępstw, jeśli go wybrano",
      "Weryfikacja wyniku przez człowieka — o ten nadzór pytają ubezpieczyciele przy ocenie ryzyka",
      "Wynik dostarczany klientowi — roszczenie za błędny wynik rozpatruje OC zawodowe",
      "Halucynacja — wynik poza tolerancją; ochrona zależy od jej skutku i brzmienia polisy"
    ],
    "parts": [
      {
        "title": "Dane wejściowe",
        "text": "Ujawnienie danych lub zarzut naruszenia praw: cyber albo OC zawodowe, zależnie od polisy.",
        "href": "/ubezpieczenie-ai/#gdzie-w-systemie-ai-powstaje-ryzyko",
        "link": "Gdzie powstaje ryzyko"
      },
      {
        "title": "Model i jego dostawca",
        "text": "Zatrzymanie systemu to przerwa w działalności w części cyber — przy odpowiedniej definicji awarii lub błędu operatora.",
        "href": "/slownik/#blad-operatora",
        "link": "Słownik: błąd operatora"
      },
      {
        "title": "Klucz API",
        "text": "Przejęty klucz i rachunek za tokeny (LLMjacking) to zwykle moduł cyberprzestępstw, jeśli go wybrano.",
        "href": "/slownik/#llmjacking",
        "link": "Słownik: LLMjacking"
      },
      {
        "title": "Weryfikacja przez człowieka",
        "text": "O nadzór człowieka nad wynikiem pytają ubezpieczyciele przy ocenie ryzyka.",
        "href": "/ubezpieczenie-ai/#od-czego-zaleza-skladka-i-limit-przy-ryzykach-ai",
        "link": "Składka i limit przy AI"
      },
      {
        "title": "Wynik dla klienta",
        "text": "Roszczenie klienta za błędny wynik rozpatruje OC zawodowe, zgodnie z warunkami polisy.",
        "href": "/ubezpieczenie-ai/#co-obejmuje-ubezpieczenie-ai",
        "link": "Co obejmuje ubezpieczenie AI"
      },
      {
        "title": "Halucynacja",
        "text": "Wiarygodna, ale nieprawdziwa odpowiedź modelu. Ochrona zależy od jej skutku i brzmienia polisy.",
        "href": "/ubezpieczenie-ai/#czy-halucynacja-ai-jest-objeta-ochrona",
        "link": "Halucynacja a ochrona"
      }
    ]
  },
  "FigPillarCyber": {
    "code": "F-CY",
    "caption": "Rzut: droga incydentu cyber przez firmę i oś czasu przestoju",
    "legend": [
      "Incydent — atak na systemy albo naruszenie ochrony danych, zgodnie z definicją w polisie",
      "Reakcja na incydent — informatyka śledcza, prawnik, powiadomienia, komunikacja kryzysowa",
      "Odtworzenie danych i systemów — np. z kopii zapasowej poza firmą",
      "Przerwa w działalności — po franszyzie czasowej, najdłużej przez okres odszkodowawczy",
      "Odpowiedzialność wobec innych — roszczenia osób, których dane wyciekły, postępowanie organu",
      "Cyberprzestępstwa, np. wyłudzony przelew — zwykle opcja do wybrania osobno"
    ],
    "parts": [
      {
        "title": "Incydent",
        "text": "Atak na systemy albo naruszenie ochrony danych — tak, jak definiuje je polisa.",
        "href": "/ubezpieczenie-cyber/#czym-jest-ubezpieczenie-cyber-i-kto-go-potrzebuje",
        "link": "Czym jest ubezpieczenie cyber"
      },
      {
        "title": "Reakcja na incydent",
        "text": "Informatyka śledcza, prawnik, powiadomienia i komunikacja kryzysowa; polisa cyber zwykle pokrywa ich koszty.",
        "href": "/ubezpieczenie-cyber/#jak-wyglada-pomoc-w-pierwszych-godzinach-po-ataku",
        "link": "Pierwsze godziny po ataku"
      },
      {
        "title": "Odtworzenie danych i systemów",
        "text": "Koszty odtworzenia danych i systemów, np. z kopii zapasowej poza firmą — zgodnie z warunkami polisy.",
        "href": "/ubezpieczenie-cyber/#co-obejmuje-ubezpieczenie-cyber",
        "link": "Co obejmuje cyber"
      },
      {
        "title": "Przerwa w działalności",
        "text": "Utracony dochód po franszyzie czasowej, najdłużej przez okres odszkodowawczy.",
        "href": "/ubezpieczenie-cyber/#jak-polisa-liczy-szkode-z-przestoju",
        "link": "Szkoda z przestoju"
      },
      {
        "title": "Odpowiedzialność wobec innych",
        "text": "Roszczenia osób, których dane wyciekły, i postępowanie organu — zgodnie z warunkami polisy.",
        "href": "/ubezpieczenie-cyber/#wyciek-danych-i-rodo-co-pokryje-polisa",
        "link": "Wyciek danych i RODO"
      },
      {
        "title": "Cyberprzestępstwa",
        "text": "Wyłudzony przelew to zwykle opcja do wybrania osobno: w polisie cyber albo w ubezpieczeniu crime.",
        "href": "/ubezpieczenie-cyber/#wyludzony-przelew-ubezpieczenie-cyber-czy-crime",
        "link": "Cyber czy crime?"
      }
    ]
  },
  "FigPillarPI": {
    "code": "F-OZ",
    "caption": "Wykres czasowy polisy claims made: data retroaktywna, okres ubezpieczenia, roszczenie",
    "legend": [
      "Data retroaktywna — najwcześniejsza data błędu objętego ochroną",
      "Okres ubezpieczenia — w nim roszczenie musi zostać postawione po raz pierwszy",
      "Wykupiony okres dodatkowy (ERP) — czas na roszczenia postawione po wygaśnięciu polisy",
      "Błąd przed datą retroaktywną — zwykle poza ochroną, nawet gdy roszczenie przyjdzie w okresie",
      "Błąd po dacie retroaktywnej, roszczenie w okresie ubezpieczenia — polisa może zadziałać",
      "Roszczenie po wygaśnięciu polisy — tylko z wykupionym ERP, na warunkach polisy"
    ],
    "parts": [
      {
        "title": "Data retroaktywna",
        "text": "Najwcześniejsza data błędu objętego ochroną. Błędy sprzed niej zwykle są poza zakresem.",
        "href": "/slownik/#data-retroaktywna",
        "link": "Słownik: data retroaktywna"
      },
      {
        "title": "Okres ubezpieczenia",
        "text": "W nim roszczenie musi zostać postawione po raz pierwszy — to zasada claims made.",
        "href": "/oc-zawodowe/#jak-oc-zawodowe-dziala-w-czasie",
        "link": "OC zawodowe w czasie"
      },
      {
        "title": "Wykupiony okres dodatkowy (ERP)",
        "text": "Czas na zgłaszanie roszczeń po wygaśnięciu polisy, za błędy sprzed końca ochrony.",
        "href": "/oc-zawodowe/#automatyczny-okres-zgloszenia-a-wykupiony-erp",
        "link": "Automatyczny okres a ERP"
      },
      {
        "title": "Błąd przed datą retroaktywną",
        "text": "Zwykle poza ochroną, nawet gdy roszczenie przyjdzie w okresie ubezpieczenia.",
        "href": "/slownik/#claims-made",
        "link": "Słownik: claims made"
      },
      {
        "title": "Błąd po dacie retroaktywnej",
        "text": "Roszczenie postawione w okresie ubezpieczenia: tu polisa może zadziałać, zgodnie z jej warunkami.",
        "href": "/oc-zawodowe/#co-obejmuje-oc-zawodowe",
        "link": "Co obejmuje OC zawodowe"
      },
      {
        "title": "Roszczenie po wygaśnięciu polisy",
        "text": "Tylko z wykupionym ERP, na warunkach polisy.",
        "href": "/slownik/#okres-dodatkowego-zgloszenia",
        "link": "Słownik: ERP"
      }
    ]
  },
  "FigLloyds": {
    "code": "F-LL",
    "caption": "Schemat: droga ryzyka od klienta przez brokera do ubezpieczycieli",
    "legend": [
      "Klient i jego ryzyko",
      "Broker klienta — działa na rzecz klienta: opis ryzyka, porównanie ofert, negocjacje",
      "Pośrednik lub partner underwritingowy (UW) — ogniwo między brokerem klienta a ubezpieczycielami; broker klienta nie plasuje ryzyka bezpośrednio w sali. Kto działa w imieniu ubezpieczyciela, wskazujemy w ofercie",
      "Ubezpieczyciel prowadzący — ocenia ryzyko i ustala warunki",
      "Pozostali ubezpieczyciele — przyjmują udziały na tych samych warunkach",
      "Udziały w polisie — razem 100%; ubezpieczycieli i ich udziały wskazują oferta i polisa"
    ]
  },
  "FigCatalogue": {
    "code": "F-KT",
    "caption": "Zestawienie elementów: katalog arkuszy według ryzyka klienta",
    "legend": [
      "Filary: OC i cyber dla IT, ubezpieczenie AI, cyber, OC zawodowe",
      "Zarząd, pieniądze i nadużycia",
      "Szkody wyrządzone innym: klienci, pacjenci, odbiorcy",
      "Transakcje, kontrakty i własność intelektualna",
      "Mienie, przestoje i ryzyka nietypowe",
      "Ryzyka nietypowe — ocena indywidualna"
    ]
  }
};

export function isFigureId(id: string): id is FigureId {
  return Object.prototype.hasOwnProperty.call(FIGURES, id);
}
