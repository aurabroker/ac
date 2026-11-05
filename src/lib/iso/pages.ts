/**
 * Strona → rysunek: motyw, wariant, tabliczka i czerwony podpis (plan grafik, mapa-final.tsv; decyzje właściciela).
 * Czysta tabela bez importów Astro — czytają ją spec.ts, testy i skrypty podglądu.
 *
 * Pierwszeństwo (spec.ts): frontmatter `iso.*` > MOTIF_BY_PATH > treść strony (moduły z `coverage` itd.).
 *   labels — podpisy w kolejności SLOTÓW motywu (labels[0] → pierwszy slot); tu tylko tam, gdzie kolejność
 *            z tabeli zakresu nie pasuje do slotów, a strona nie ma `iso.labels` we frontmatterze;
 *   fault  — czerwony podpis: konkretne wyłączenie z tabeli zakresu tej strony (≤ 28 znaków); strony z `iso.fault`
 *            we frontmatterze mają go tam (plan, krok 7);
 *   calm   — spokojna miniatura strony prawnej (bez podpisów, bez błękitu i czerwieni, bez ruchu).
 *   ink    — podpisy to nie moduły ochrony (np. kroki pracy na /o-nas/): części w tuszu, bez błękitu.
 * Rysunek jest deterministyczny: ta sama treść daje ten sam plik.
 */
import type { MotifId } from './scene.ts';

export interface PagePlan {
  motif: MotifId;
  variant: string;
  fault?: string;
  labels?: string[];
  inputs?: string[];
  plate?: string;
  calm?: boolean;
  /** Podpisy to nie moduły ochrony (np. kroki pracy) — części w tuszu, bez błękitu. */
  ink?: boolean;
}

export const MOTIF_BY_PATH: Record<string, PagePlan> = {
  // strony firmowe i indeksy (strona główna, filary, katalog i rynek mają rysunki ręczne — tu tylko miniatura)
  '/': { motif: 'zespol-osiowy', variant: 'program', fault: 'Wyłączenia' },
  // kroki pracy brokera, nie moduły z tabeli zakresu: tusz, bez błękitu
  '/o-nas/': { motif: 'zespol-osiowy', variant: 'program', ink: true },
  '/kontakt/': { motif: 'rurociag', variant: 'kolektor', plate: 'BROKER' },
  '/rynek-lloyds/': { motif: 'rurociag', variant: 'rozdzielacz' },
  '/ubezpieczenia/': { motif: 'archiwum', variant: 'komoda' },
  '/wiedza/': { motif: 'archiwum', variant: 'arkusze', plate: 'WIEDZA' },
  '/slownik/': { motif: 'kaseta', variant: 'wzorce', plate: 'A–Z' },
  '/zespol/marek-ciesla/': { motif: 'kaseta', variant: 'przybory' },
  // strony prawne: spokojne, każda inny przedmiot
  '/informacje-o-brokerze/': { motif: 'archiwum', variant: 'szafa-aktowa', calm: true },
  '/polityka-prywatnosci/': { motif: 'zamek', variant: 'kasetka', calm: true },
  '/reklamacje/': { motif: 'stol', variant: 'pulpit', calm: true },

  // filary
  '/oc-cyber-dla-it/': { motif: 'belka', variant: 'ciagla' },
  '/oc-zawodowe/': { motif: 'przekladnia', variant: 'para' },
  '/ubezpieczenie-cyber/': { motif: 'szafa-serwerowa', variant: 'firma', fault: 'Rozległe awarie zasilania' },
  '/ubezpieczenie-ai/': {
    motif: 'maszyna-ai',
    variant: 'model',
    labels: ['OC zawodowe', 'Cyberprzestępstwa', 'Cyber'],
    fault: 'Rozległe awarie zasilania',
  },
  '/ubezpieczenie-ai/ai-w-firmie/': { motif: 'maszyna-ai', variant: 'firma', fault: 'Własna strata z decyzji AI' },

  // regulacje
  '/regulacje/ai-act/': { motif: 'manometr', variant: 'regulacja', plate: 'AI ACT' },
  '/regulacje/pld/': { motif: 'przenosnik', variant: 'aktualizacja' },

  // katalog
  '/ubezpieczenia/gwarancje-ubezpieczeniowe/': { motif: 'zuraw', variant: 'wiezowy', fault: 'Strata wykonawcy' },
  '/ubezpieczenia/instytucje-finansowe-i-fintech/': { motif: 'zamek', variant: 'skarbiec' },
  '/ubezpieczenia/mienie-i-sprzet-elektroniczny/': { motif: 'budynek', variant: 'hala', fault: 'Dane bez szkody fizycznej' },
  '/ubezpieczenia/oc-czlonkow-zarzadu-d-o/': { motif: 'stol', variant: 'zarzad', plate: 'D&O', fault: 'Działanie umyślne' },
  '/ubezpieczenia/oc-dzialalnosci/': {
    motif: 'budynek',
    variant: 'lokal',
    labels: ['OC deliktowe', 'OC kontraktowe', 'OC najemcy', 'Mienie powierzone'],
    fault: 'Czyste straty finansowe',
  },
  '/ubezpieczenia/oc-mediow/': { motif: 'prasa', variant: 'drukarska' },
  '/ubezpieczenia/oc-ochrona-zdrowia/': { motif: 'pompa', variant: 'strzykawkowa' },
  '/ubezpieczenia/oc-produktu-i-wycofanie/': {
    motif: 'przenosnik',
    variant: 'wycofanie',
    labels: ['OC za produkt', 'Wycofanie produktu', 'Rozszerzenie OC za produkt'],
    fault: 'Wymiana samego produktu',
  },
  '/ubezpieczenia/ochrona-prawna-ip/': { motif: 'prasa', variant: 'tlocznik', fault: 'Nowy wzór bez zgłoszenia' },
  '/ubezpieczenia/ryzyka-nietypowe/': { motif: 'kaseta', variant: 'na-miare' },
  '/ubezpieczenia/ubezpieczenia-transakcyjne/': {
    motif: 'rurociag',
    variant: 'kolnierz',
    plate: 'W&I',
    fault: 'Naruszenia znane kupującemu',
  },
  '/ubezpieczenia/ubezpieczenie-crime/': { motif: 'zamek', variant: 'wkladka', fault: 'Szkody pośrednie' },

  // wiedza
  '/wiedza/ai-act-a-ubezpieczenie/': { motif: 'manometr', variant: 'zawor', plate: 'AI ACT', fault: 'Kary i grzywny' },
  '/wiedza/klient-wymaga-oc-od-kontraktora/': {
    motif: 'belka',
    variant: 'umowa',
    plate: 'Umowa B2B',
    labels: ['OC zawodowe', 'OC działalności', 'Cyber'],
    fault: 'Kary umowne',
  },
  '/wiedza/llmjacking/': {
    motif: 'rurociag',
    variant: 'licznik',
    plate: 'LLMJACKING',
    labels: ['Cyber: koszty własne', 'Cyberprzestępstwa', 'Cyber: odpowiedzialność'],
    fault: 'Zużycie zgodne z umową',
  },
  '/wiedza/oc-programisty-b2b/': { motif: 'przekladnia', variant: 'zebnik', fault: 'Kary umowne' },
  '/wiedza/pld-a-oc-software-house/': {
    motif: 'przenosnik',
    variant: 'naped',
    labels: ['OC zawodowe', 'OC za produkt', 'Cyber'],
    fault: 'Poprawka oprogramowania',
  },
  '/wiedza/ransomware-2-0/': { motif: 'szafa-serwerowa', variant: 'blokada', plate: 'RANSOMWARE' },
  '/wiedza/tech-eo-a-oc-zawodowe/': {
    motif: 'zespol-osiowy',
    variant: 'sprzeglo',
    plate: 'TECH E&O',
    labels: ['Tech E&O', 'Rozszerzenie', 'Cyber'],
    fault: 'Kary umowne',
  },
  '/wiedza/usa-kanada-w-polisie/': { motif: 'belka', variant: 'wspornik' },
};

/** To, co o nowej stronie wie rejestr tras (bez Astro). */
export interface RouteHint {
  kind: 'page' | 'pillar' | 'solution' | 'article' | 'regulation';
  path: string;
  template?: string;
  /** Grupa karty katalogu. */
  group?: string;
  /** Hub artykułu. */
  hub?: string;
  /** Filar: it | ai | cyber | pi. */
  pillar?: string;
}

/**
 * Strona spoza tabeli (nowa karta, artykuł, regulacja): rodzina z sekcji (plan, krok 6).
 * Karta katalogu — z grupy, artykuł — z huba, regulacja — manometr, filar — z pola `pillar`, strona — z szablonu.
 */
export function fallbackPlan(r: RouteHint): PagePlan {
  switch (r.kind) {
    case 'solution': {
      const g = r.group ?? '';
      if (/^Szkody wyrządzone/i.test(g)) return { motif: 'budynek', variant: 'lokal' };
      if (/^Zarząd/i.test(g)) return { motif: 'zamek', variant: 'wkladka' };
      if (/^Transakcje/i.test(g)) return { motif: 'rurociag', variant: 'kolnierz' };
      if (/^Mienie/i.test(g)) return { motif: 'budynek', variant: 'hala' };
      return { motif: 'kaseta', variant: 'na-miare' };
    }
    case 'article':
      if (r.hub === '/oc-cyber-dla-it/') return { motif: 'belka', variant: 'umowa' };
      if (r.hub === '/ubezpieczenie-ai/') return { motif: 'maszyna-ai', variant: 'firma' };
      if (r.hub === '/ubezpieczenie-cyber/') return { motif: 'szafa-serwerowa', variant: 'blokada' };
      if (r.hub === '/oc-zawodowe/') return { motif: 'przekladnia', variant: 'zebnik' };
      return { motif: 'archiwum', variant: 'arkusze' };
    case 'regulation':
      return { motif: 'manometr', variant: 'regulacja' };
    case 'pillar':
      if (r.pillar === 'ai') return { motif: 'maszyna-ai', variant: r.path.split('/').length > 3 ? 'firma' : 'model' };
      if (r.pillar === 'cyber') return { motif: 'szafa-serwerowa', variant: 'firma' };
      if (r.pillar === 'pi') return { motif: 'przekladnia', variant: 'para' };
      return { motif: 'belka', variant: 'ciagla' };
    default:
      switch (r.template) {
        case 'legal':
          return { motif: 'zamek', variant: 'kasetka', calm: true };
        case 'contact':
          return { motif: 'rurociag', variant: 'kolektor' };
        case 'person':
          return { motif: 'kaseta', variant: 'przybory' };
        case 'glossary':
          return { motif: 'kaseta', variant: 'wzorce' };
        case 'wiedza-index':
          return { motif: 'archiwum', variant: 'arkusze' };
        case 'catalogue-index':
          return { motif: 'archiwum', variant: 'komoda' };
        default:
          return { motif: 'zespol-osiowy', variant: 'program' };
      }
  }
}
