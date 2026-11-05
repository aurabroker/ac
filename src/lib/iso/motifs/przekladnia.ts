/**
 * Motyw „Przekładnia zębata” (OC zawodowe): Twoja usługa to koło w napędzie klienta, wyłamany ząb to błąd.
 *   para   — /oc-zawodowe/: duże koło napędzane (projekt klienta) i zębnik (usługa) z wyłamanym zębem.
 *   zebnik — /wiedza/oc-programisty-b2b/: bardzo mały zębnik przez koło pośrednie napędza dużo większe koło.
 * Wyłamany ząb (zdarzenie objęte ochroną — tusz): pusta luka na przednim prawym obrzeżu zębnika (ok. godz. 4 na tarczy
 * zegara, na tle pustej płyty, z dala od zazębienia), u nasady zygzak pęknięcia, przerywany zarys gniazda; odłamek (lekko przechylony) unosi się
 * tuż nad luką (≤ 8 jedn.) w tej samej grupie co koło — widać go w każdym kadrze, odnośniki go nie przecinają.
 * Czerwień: luźne, niezazębione koło poza obrysem ochrony (kary umowne, gwarancje rezultatu).
 * Grupy: g0 płyta, oprawy łożysk, luźne koło; g1 koła z wałkami, luka i odłamek; g2 podkładka na wale zębnika (nagłówek).
 * Sloty podpisów: para — [zębnik, podkładka, duże koło]; zebnik — [zębnik, koło pośrednie, podkładka].
 * Bez nakrętek. Miniatura: koła nisko (zwarta wysokość), bez otworów odciążających i piasty, bez podkładki — moduł
 * slotu „podkładka” niesie wtedy piasta zębnika (wypukły pierścień na kole).
 */
import { G0, Sketch, plate, take, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, MotifModule, Tone } from '../scene.ts';
import { gearLite, meshPh, protectPoly, slotTone, toothNear, type GearLite } from './_g2.ts';

interface GearDef {
  x: number;
  y: number;
  teeth: number;
  m: number;
  phase: number;
  tone: Tone;
  missing?: number[];
  hub?: number;
  holes?: boolean;
}

/** Oprawa łożyska (blok) z gniazdem wałka. */
function bearing(s: Sketch, x: number, y: number, z: number, big: boolean) {
  const b = big ? 17 : 13;
  s.box(0, x - b, y - b, z, 2 * b, 2 * b, 9);
}

function build(m: MotifInput) {
  const s = new Sketch();
  const L = take(m);
  const small = m.variant === 'zebnik';
  const thumb = m.thumb;
  const W = 290;
  const D = 166;
  // obrys ochrony z wycięciem w przednim prawym narożniku: tam leży luźne koło (poza ochroną)
  const { zt } = plate(s, { x0: 0, y0: 0, w: W, d: D, protect: null });
  protectPoly(s, [[10, 10], [W - 10, 10], [W - 10, 100], [204, 100], [204, D - 10], [10, D - 10]], zt);

  // koła
  const mod = small ? 7 : 9;
  const A: GearDef = { x: small ? 72 : 80, y: 78, teeth: small ? 15 : 14, m: mod, phase: 0, tone: 'ink', holes: true };
  const chain: GearDef[] = [A];
  const next = (prev: GearDef, teeth: number, tone: Tone): GearDef => {
    const g: GearDef = { x: prev.x + (mod * (prev.teeth + teeth)) / 2, y: prev.y, teeth, m: mod, phase: 0, tone };
    g.phase = meshPh(prev, g, 0);
    return g;
  };
  // zebnik: [duże, pośrednie, zębnik]; para: [duże, zębnik]
  const tPin = slotTone(m, L.labels[0]);
  if (small) chain.push(next(A, 9, slotTone(m, L.labels[1])));
  const Pn = next(chain[chain.length - 1], small ? 7 : 9, tPin);
  chain.push(Pn);
  // wyłamany ząb: przednie prawe obrzeże zębnika (kąt sceny ~5° ≈ godz. 4 na rysunku — ząb widać z boku, na tle pustej
  // płyty), daleko od zazębienia (180°); kotwica podpisu zębnika — koniec odłamka
  const brokenAt = small ? 10 : 5;
  const iBroken = toothNear(Pn.teeth, Pn.phase, brokenAt);
  Pn.missing = [iBroken];

  // poziomy: oprawy łożysk na płycie, koła nad nimi (nagłówek: o G0 — rozstrzelenie), podkładka i odłamek wyżej
  const zB = zt + 9;
  const lift = thumb ? 15 : G0 - 9;
  const zG = zB + lift;
  const thk = 10;

  for (const q of chain) bearing(s, q.x, q.y, zt, q === A);

  // luźne koło (czerwień) — leży na płycie poza obrysem, niezazębione
  if (L.fault)
    s.out(() => {
      const loose = gearLite(s, 0, [246, 134, zt], { teeth: 7, m: 7, thk: 6, tone: 'sig', phase: 12, bore: thumb ? undefined : 5 });
      s.label(L.fault, loose.at(loose.ra, -40, zt + 6), 'r', 0, 'sig');
    });

  // koła z wałkami (od tyłu: najpierw duże)
  const washerSlot = small ? 2 : 1;
  const tW = slotTone(m, L.labels[washerSlot]);
  const G: GearLite[] = [];
  for (const q of chain) {
    s.cylZ(1, [q.x, q.y, zB - 4], lift + 4, 5.5, { noCap: true });
    const big = q === A;
    const boss = thumb && q === Pn && !!L.labels[washerSlot];
    G.push(
      gearLite(s, 1, [q.x, q.y, zG], {
        teeth: q.teeth,
        m: q.m,
        thk,
        tone: q.tone,
        phase: q.phase,
        missing: q.missing,
        hub: big && !thumb ? 15 : undefined,
        holes: big && !thumb ? { n: 4, r: small ? 10 : 9, at: small ? 32 : 28 } : undefined,
      }),
    );
    // miniatura: piasta zębnika (wypukły pierścień) niesie moduł slotu „podkładka”; inaczej sam czop wałka
    if (boss) s.cylZ(1, [q.x, q.y, zG + thk], 4, 12, { tone: tW, bore: 5.5 });
    else s.cylZ(1, [q.x, q.y, zG + thk], big ? 6 : 5, 5.5);
  }
  const gA = G[0];
  const gP = G[G.length - 1];

  // wyłamany ząb: przerywany zarys gniazda, zygzak pęknięcia u nasady (tusz), odłamek tuż nad luką
  const a0 = gP.angle(iBroken);
  s.poly(1, 'fine-d', gP.tooth(iBroken, gP.zt), false);
  const jag: V3[] = [];
  for (let j = 0; j <= 6; j++) jag.push(gP.at(gP.rr + (j % 2 ? 2.6 : -0.6), a0 - 0.3 * gP.step + (0.6 * gP.step * j) / 6));
  s.poly(1, 'edge', jag, false);
  // odłamek: 8 jedn. nad gniazdem, lekko na zewnątrz i przechylony (jeden róg wyżej) — czyta się jak ułamany ząb
  const frag = gP.tooth(iBroken, gP.zt + 7, 4).map((p, j): V3 => [p[0], p[1], p[2] + [0, 2, 6, 7][j]]);
  s.prism(1, frag, [0, 0, thk * 0.8], 'ink');

  // podkładka na wale zębnika (moduł) — tylko nagłówek; bez nakrętek
  const zW = gP.zt + 5 + 16;
  if (L.labels[washerSlot] && !thumb) s.cylZ(2, [Pn.x, Pn.y, zW], 3, 12, { tone: tW, bore: 5.5 });

  // podpisy
  // zębnik (usługa): kotwica na zewnętrznym końcu odłamka — podpis mówi, co niesie wyłamany ząb
  const fTip: V3 = [(frag[1][0] + frag[2][0]) / 2, (frag[1][1] + frag[2][1]) / 2, (frag[1][2] + frag[2][2]) / 2 + thk * 0.8];
  s.label(L.labels[0], fTip, 'r', 1, tPin);
  if (small) s.label(L.labels[1], G[1].at(G[1].ra, -150), 'r', 1, slotTone(m, L.labels[1]));
  else s.label(L.labels[2], gA.at(gA.ra, -95), 'r', 1, 'ink');
  if (L.labels[washerSlot]) {
    // piasta: tylny prawy skraj (wyżej niż kotwica zębnika — odnośnik idzie poziomo, nad odłamkiem)
    if (thumb) s.label(L.labels[washerSlot], [Pn.x + 6, Pn.y - 10.4, zG + thk + 4], 'r', 1, tW);
    else s.label(L.labels[washerSlot], [Pn.x + 9, Pn.y - 9, zW + 3], 'r', 2, tW);
  }
  return s.scene();
}

const PART: Record<string, string[]> = {
  para: ['zębnik', 'podkładka na wale zębnika', 'duże koło klienta'],
  zebnik: ['mały zębnik', 'koło pośrednie', 'podkładka na wale zębnika'],
};

function describe(d: DescInput): string {
  const what = motif.what[d.variant] ?? motif.what.para;
  if (d.calm) return `Przekładnia zębata: ${what}.`;
  let s = `Przekładnia zębata w widoku rozstrzelonym: ${what}.`;
  const parts = PART[d.variant] ?? PART.para;
  const named = d.labels.slice(0, 3).flatMap((l, i) => (l ? [`${parts[i]} — ${l}`] : []));
  if (named.length) s += ` Podpisane części: ${named.join('; ')}.`;
  s += ' Z przodu zębnika brakuje zęba: odłamek unosi się tuż nad pustym gniazdem z linią pęknięcia.';
  if (d.fault) s += ` Poza obrysem ochrony leży luźne, niezazębione koło: ${d.fault}.`;
  return s;
}

export const motif: MotifModule = {
  id: 'przekladnia',
  name: 'Przekładnia zębata',
  variants: ['para', 'zebnik'],
  what: {
    para: 'duże koło klienta zazębia się z zębnikiem usługi, który ma wyłamany ząb',
    zebnik: 'bardzo mały zębnik z wyłamanym zębem przez koło pośrednie napędza dużo większe koło klienta',
  },
  build,
  describe,
};
