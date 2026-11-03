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
