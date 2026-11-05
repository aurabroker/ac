/**
 * Kontrakt sceny rysunku izometrycznego (src/lib/iso). Motyw (src/lib/iso/motifs/<id>.ts) buduje Scene
 * z MotifInput; render.ts kadruje ją w trzech kadrach i rysuje (inline SVG w nagłówku, plik /fig/*.svg).
 *
 * Kolejność malowania = kolejność elementów (algorytm malarza: od tyłu i od dołu — odpowiada za nią motyw).
 * Grupa `g` (0–5) = poziom rozstrzelenia: CSS przesuwa grupę o g·STEP0 jednostek sceny przy wejściu w widok
 * (w górę, a przy Scene.axis = 'x' wzdłuż osi x sceny). Części z `out` (czerwień: „poza ochroną”) odsuwają się
 * dodatkowo o OUT0 w kierunku Scene.outDir. W miniaturach i przy ograniczeniu ruchu nic się nie rusza:
 * geometria jest już narysowana w stanie rozsuniętym, ruch tylko go podkreśla.
 */
import type { V2, V3 } from './geom.ts';

/** 16 motywów (plan grafik, final.json). */
export const MOTIF_IDS = [
  'zespol-osiowy',
  'belka',
  'przekladnia',
  'szafa-serwerowa',
  'maszyna-ai',
  'manometr',
  'przenosnik',
  'rurociag',
  'zamek',
  'stol',
  'prasa',
  'pompa',
  'budynek',
  'zuraw',
  'kaseta',
  'archiwum',
] as const;
export type MotifId = (typeof MOTIF_IDS)[number];

/** Najdłuższy podpis (znaki) — schemat treści, spec.ts, render i scripts/validate-iso.mjs. */
export const LABEL_MAX = 28;
/**
 * Podpis „zawiera liczbę”: cyfra, która nie stoi wewnątrz słowa („B2B” — dozwolone; „Art 5”, „10”, „5G”, „5%” — nie).
 * Jedna reguła dla schematu treści (content.config.ts), cleanLabel (spec.ts) i scripts/validate-iso.mjs.
 */
export const HAS_NUMBER = /(?:^|[^\p{L}])\d|\d(?:[^\p{L}]|$)|%/u;

/** Kadr: „w” nagłówek szeroki, „n” nagłówek wąski, „t” miniatura 360×190 (plik). */
export type FrameKind = 'w' | 'n' | 't';

/**
 * Role (kolor i grubość — tokeny w render.ts ROLE_ATTR i src/styles/iso.css, klasa .i-<rola>).
 * Ściany (wypełnienie + obrys):
 *   top / side-r / side-l — biała góra, dwie szare ściany (tusz),
 *   top-hi / side-hi       — błękit: część niosąca moduł ochrony (obrys tuszem),
 *   top-sig / side-sig     — czerwień: dokładnie jedna rzecz poza ochroną (obrys czerwony),
 *   bore                   — wnętrze otworu, gniazda, wnęki (ciemniejsza szarość),
 *   mask                   — białe wypełnienie bez obrysu (zasłonięcie),
 *   solid / solid-hi / solid-sig — pełne wypełnienie (groty strzałek, dziurka klucza, kropki).
 * Linie (bez wypełnienia):
 *   edge (tusz), fine (grafit, cienka), fine-ink (tusz, cienka), fine-d (grafit przerywana — linia ukryta),
 *   cl (linia konstrukcyjna; z `stretch` rozciąga się przy rozstrzeleniu), axis (kreska-kropka: oś),
 *   proj (błękit przerywana — rzutowanie), trace-hi (błękitna droga/przewód), edge-sig (czerwona linia),
 *   fault (czerwona przerywana — przerwanie), hatch (kreskowanie przekroju), hatch-sig (czerwone kreskowanie).
 */
export const ROLES = [
  'top',
  'side-r',
  'side-l',
  'top-hi',
  'side-hi',
  'top-sig',
  'side-sig',
  'bore',
  'mask',
  'solid',
  'solid-hi',
  'solid-sig',
  'edge',
  'fine',
  'fine-ink',
  'fine-d',
  'cl',
  'axis',
  'proj',
  'trace-hi',
  'edge-sig',
  'fault',
  'hatch',
  'hatch-sig',
] as const;
export type Role = (typeof ROLES)[number];

/** Ton części i etykiety: tusz, błękit (moduł ochrony), czerwień (poza ochroną). */
export type Tone = 'ink' | 'hi' | 'sig';

/**
 * Odcinek ścieżki na płaszczyźnie rysunku (przed skalą kadru):
 * M/L punkt, A = łuk eliptyczny SVG (rx, ry, obrót°, duży łuk, kierunek, x, y), Z = zamknięcie.
 */
export type Seg =
  | readonly ['M', number, number]
  | readonly ['L', number, number]
  | readonly ['A', number, number, number, 0 | 1, 0 | 1, number, number]
  | readonly ['Z'];

export interface Item {
  g: number;
  role: Role;
  d: Seg[];
  /** Punkty obrysu (rysunek) do kadrowania — łuki próbkowane; nie trafiają do SVG. */
  bb: V2[];
  /** Linia konstrukcyjna między grupami: rozciąga się przy rozstrzeleniu (dokładnie n·G0 wzdłuż osi sceny). */
  stretch?: boolean;
  /** Obrys przerywany (część warunkowa, np. podpora „USA i Kanada”, szuflada „ocena indywidualna”). */
  dash?: boolean;
  /** Wypełnienie evenodd (pierścień, ściana z otworem). */
  eo?: boolean;
  /** Część „poza ochroną”: odsuwa się w bok przy wejściu w widok. */
  out?: boolean;
  /** Pomiń w kadrowaniu (np. długa oś wybiegająca poza płytę). */
  nobox?: boolean;
}

export interface LabelReq {
  text: string;
  /** Kotwica (kropka) na rysunku, przed skalą kadru. */
  at: V2;
  /** Kolumna: prawa domyślnie; lewa tylko dla wlotów (rurociąg) albo gdy odnośnik przeciąłby przedmiot. */
  side: 'r' | 'l';
  g: number;
  tone: Tone;
  /** Etykieta części „out” — rusza się razem z nią. */
  out?: boolean;
  /** Najdłuższy wiersz (znaki) zamiast domyślnego dla kolumny kadru — węższa kolumna zostawia miejsce rysunkowi. */
  wrap?: number;
}

/** Napis „wygrawerowany” (tabliczka znamionowa) na płaszczyźnie: kierunek tekstu u, „w dół litery” v (3D). */
export interface Mark {
  text: string;
  at: V2;
  /** Obrazy wektorów u i v (jednostkowych 3D) na rysunku. */
  u: V2;
  v: V2;
  /** Wysokość pisma w jednostkach sceny. */
  size: number;
  /** Największa długość napisu (jednostki sceny) — dłuższy jest zmniejszany. */
  max: number;
  g: number;
  out?: boolean;
  /** Obrys tabliczki (rysunek): rysowany tylko razem z napisem — w kadrze, gdzie napis byłby za mały, znika cały. */
  plate?: V2[];
}

export interface Scene {
  items: Item[];
  labels: LabelReq[];
  marks: Mark[];
  /** Kierunek rozstrzelenia: 'z' (w górę, domyślnie) albo 'x' (wzdłuż osi x sceny — zespół na osi). */
  axis?: 'z' | 'x';
  /** Kierunek odsunięcia części „out”: wzdłuż +x (domyślnie), −x, +y albo −y sceny. */
  outDir?: 'x' | '-x' | 'y' | '-y';
  /** Spokojna scena (strony prawne): bez podpisów, bez błękitu i czerwieni, bez ruchu. */
  calm?: boolean;
  /** Stała skala dla kadru (zamiast dopasowania); render i tak ją zmniejszy, gdy rysunek się nie mieści. */
  k?: Partial<Record<FrameKind, number>>;
  /**
   * Powiększenie małej sceny: mnoży największą skalę kadru (FRAMES.kmax). Działa przez macierz skali, więc ruch
   * (STEP0, OUT0) i linie konstrukcyjne rosną razem z rysunkiem (zamiast przeskalowanej geometrii).
   */
  zoom?: number;
}

/** Wejście motywu: wszystko, co strona mówi o rysunku. Teksty etykiet są już WERSALIKAMI. */
export interface MotifInput {
  /** Wariant sylwetki (z tabeli spec.ts albo iso.variant) — zawsze jeden z MotifModule.variants. */
  variant: string;
  /** Podpisy modułów w kolejności slotów motywu (labels[0] → pierwszy slot …). */
  labels: string[];
  /** Wloty (lewa kolumna) — tylko rurociąg (kolektor, rozdzielacz). */
  inputs: string[];
  /** Czerwony podpis: konkretne wyłączenie (≤ 28 znaków) albo brak. */
  fault?: string;
  /** Tabliczka znamionowa (np. „D&O”, „W&I”, „LLMJACKING”) albo brak. */
  plate?: string;
  /** Spokojna miniatura strony prawnej. */
  calm: boolean;
  frame: FrameKind;
  /** frame === 't' — budżet detali miniatury (~60 ścieżek, bez nakrętek, podkładek, śrub i sprężyn). */
  thumb: boolean;
  /** Ile etykiet zmieści kadr RAZEM z wlotami i czerwoną (t: 3, w/n: 4). */
  maxLabels: number;
}

/**
 * Dane do opisu dostępnego (title/desc) — teksty w pisowni źródła, nie wersalikami.
 * labels[i] = podpis slotu i; pusty napis = slot, którego ten kadr nie pokazuje (opis go pomija).
 */
export interface DescInput {
  variant: string;
  labels: string[];
  inputs: string[];
  fault?: string;
  calm: boolean;
}

/** Moduł motywu: src/lib/iso/motifs/<id>.ts eksportuje `motif` tego typu. */
export interface MotifModule {
  id: MotifId;
  /** Nazwa rysunku po polsku (mianownik), np. „Przekładnia zębata”. */
  name: string;
  /** Warianty sylwetki; pierwszy jest domyślny. */
  variants: readonly string[];
  /** Co widać w danym wariancie — fraza do opisu, np. „duże koło i zębnik z wyłamanym zębem”. */
  what: Readonly<Record<string, string>>;
  build: (m: MotifInput) => Scene;
  /** Własny opis dostępny (desc); bez niego — szablon z motifs/index.ts. */
  describe?: (d: DescInput) => string;
}

/** Punkt kotwicy etykiety: 3D (rzutowany) albo już na rysunku. */
export type At = V3 | V2;
