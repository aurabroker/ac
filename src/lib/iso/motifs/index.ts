/**
 * Rejestr 16 motywów (plan grafik): id → moduł src/lib/iso/motifs/<id>.ts.
 * Każdy moduł eksportuje `motif: MotifModule` (nazwa, warianty, „co widać” w wariancie, build, opcjonalnie describe).
 */
import type { DescInput, MotifId, MotifModule } from '../scene.ts';
import { motif as archiwum } from './archiwum.ts';
import { motif as belka } from './belka.ts';
import { motif as budynek } from './budynek.ts';
import { motif as kaseta } from './kaseta.ts';
import { motif as manometr } from './manometr.ts';
import { motif as maszynaAi } from './maszyna-ai.ts';
import { motif as pompa } from './pompa.ts';
import { motif as prasa } from './prasa.ts';
import { motif as przekladnia } from './przekladnia.ts';
import { motif as przenosnik } from './przenosnik.ts';
import { motif as rurociag } from './rurociag.ts';
import { motif as stol } from './stol.ts';
import { motif as szafaSerwerowa } from './szafa-serwerowa.ts';
import { motif as zamek } from './zamek.ts';
import { motif as zespolOsiowy } from './zespol-osiowy.ts';
import { motif as zuraw } from './zuraw.ts';

export const MOTIFS: Record<MotifId, MotifModule> = {
  'zespol-osiowy': zespolOsiowy,
  belka,
  przekladnia,
  'szafa-serwerowa': szafaSerwerowa,
  'maszyna-ai': maszynaAi,
  manometr,
  przenosnik,
  rurociag,
  zamek,
  stol,
  prasa,
  pompa,
  budynek,
  zuraw,
  kaseta,
  archiwum,
};

for (const [id, m] of Object.entries(MOTIFS)) if (m.id !== id) throw new Error(`iso: moduł ${id} ma id „${m.id}”`);

/** Wariant motywu: podany (musi istnieć) albo domyślny (pierwszy). */
export function resolveVariant(id: MotifId, variant?: string): string {
  const m = MOTIFS[id];
  if (!variant) return m.variants[0];
  if (!m.variants.includes(variant)) throw new Error(`iso: motyw ${id} nie ma wariantu „${variant}” (są: ${m.variants.join(', ')})`);
  return variant;
}

const list = (a: string[]) => a.join(', ');

/**
 * Opis dostępny (desc) po polsku: co przedstawia maszyna, podpisane części i część poza ochroną.
 * Motyw może podać własny `describe`; wtedy to on mówi, co jest czym.
 */
export function describeMotif(id: MotifId, d: DescInput): string {
  const m = MOTIFS[id];
  if (m.describe) return m.describe(d);
  const what = m.what[d.variant];
  if (d.calm) return `${m.name}${what ? `: ${what}` : ''}.`;
  let s = `${m.name} w widoku rozstrzelonym${what ? `: ${what}` : ''}.`;
  if (d.inputs.length) s += ` Wloty: ${list(d.inputs)}.`;
  if (d.labels.some(Boolean)) s += ` ${d.inputs.length ? 'Wyloty i części' : 'Podpisane części'}: ${list(d.labels.filter(Boolean))}.`;
  if (d.fault) s += ` Czerwienią oznaczono to, czego polisa nie obejmuje: ${d.fault}.`;
  return s;
}
