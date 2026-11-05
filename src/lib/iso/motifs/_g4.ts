/**
 * Pomocnicze kształty motywów grupy 4 (budynek, szafa serwerowa, prasa, archiwum) — prywatne dla tych plików.
 * Tylko złożenia z prims.ts: bez nowych ról, kolorów i tokenów.
 *
 * Linie konstrukcyjne między grupami o odstępie innym niż n·G0: `link()` rysuje je w grupie DOLNEJ, dłuższe
 * o STEP0·Δg — w stanie wyjściowym nadmiar chowa się pod krawędzią części górnej (grubość ≥ STEP0·Δg),
 * a po rozsunięciu koniec linii trafia dokładnie w spód części górnej.
 */
import { BASIS, P, STEP0, Sketch, arcSegs, circ, type V3 } from '../prims.ts';
import type { DescInput, MotifInput, Role, Seg, Tone } from '../scene.ts';

export { slotTone } from '../prims.ts';

/** Role ścian dla tonu. */
export const TOP: Record<Tone, Role> = { ink: 'top', hi: 'top-hi', sig: 'top-sig' };
export const SIDE_R: Record<Tone, Role> = { ink: 'side-r', hi: 'side-hi', sig: 'side-sig' };
export const SIDE_L: Record<Tone, Role> = { ink: 'side-l', hi: 'side-hi', sig: 'side-sig' };
/** Cienka linia w tonie: grafit / błękit / czerwień (hatch-sig = cienka czerwona linia). */
export const THIN: Record<Tone, Role> = { ink: 'fine-ink', hi: 'trace-hi', sig: 'hatch-sig' };

/** Prostokąt w płaszczyźnie x = const (czoło: y w lewo-w dół, z w górę). */
export const rectX = (x: number, y0: number, y1: number, z0: number, z1: number): V3[] => [
  [x, y0, z0],
  [x, y1, z0],
  [x, y1, z1],
  [x, y0, z1],
];
/** Prostokąt w płaszczyźnie y = const. */
export const rectY = (y: number, x0: number, x1: number, z0: number, z1: number): V3[] => [
  [x0, y, z0],
  [x1, y, z0],
  [x1, y, z1],
  [x0, y, z1],
];
/** Prostokąt w płaszczyźnie z = const. */
export const rectZ = (x0: number, y0: number, x1: number, y1: number, z: number): V3[] => [
  [x0, y0, z],
  [x1, y0, z],
  [x1, y1, z],
  [x0, y1, z],
];

/**
 * Linia konstrukcyjna (pionowa) od części w grupie gLo do części w grupie gHi, odstęp gap (jednostki z):
 * rysowana w gLo, długość gap + STEP0·(gHi − gLo). Rysuj PRZED częścią górną (zasłoni nadmiar).
 */
export function link(s: Sketch, gLo: number, gHi: number, a: V3, gap: number, role: Role = 'cl') {
  s.line(gLo, role, a, [a[0], a[1], a[2] + gap + STEP0 * (gHi - gLo)]);
}

/** Obrót punktu (u, v) wokół (cx, cy) o kąt ang, na wysokości z. */
export const rot = (cx: number, cy: number, ang: number, z: number) => {
  const co = Math.cos(ang);
  const si = Math.sin(ang);
  return (u: number, v: number, zz = z): V3 => [cx + u * co - v * si, cy + u * si + v * co, zz];
};

/**
 * Opis dostępny: co przedstawia rysunek, która część niesie który podpis i co leży poza obrysem ochrony.
 * parts[i] — nazwa części slotu i (mianownik), red — opis czerwonej części.
 */
export function describeParts(name: string, what: string | undefined, d: DescInput, parts: readonly string[], red?: string): string {
  if (d.calm) return `${name}${what ? `: ${what}` : ''}.`;
  let s = `${name} w widoku rozstrzelonym${what ? `: ${what}` : ''}.`;
  const named = d.labels.slice(0, parts.length).flatMap((l, i) => (l ? [`${parts[i]} — ${l}`] : []));
  if (named.length) s += ` Podpisane części: ${named.join('; ')}.`;
  if (d.fault) s += ` Poza obrysem ochrony, na czerwono, ${red ?? 'część wyjęta z zespołu'} — tego polisa nie obejmuje: ${d.fault}.`;
  return s;
}

/**
 * Kłódka na czole x = const (szeroka ściana zwrócona do +x): korpus x…x+d × y…y+w × z…z+h i kabłąk w kształcie U
 * (proste nóżki + półokrąg) nad korpusem — kabłąk czytelny także w miniaturze. Zwraca kotwicę (prawy bok korpusu).
 */
export function padlockU(s: Sketch, g: number, at: V3, o: { w: number; h: number; d: number; leg: number; tone: Tone }) {
  const [x, y, z] = at;
  const { w, h, d, leg, tone } = o;
  const xc = x + d / 2;
  const yc = y + w / 2;
  const ro = w * 0.36;
  const ri = w * 0.22;
  const z0 = z + h;
  const z1 = z0 + leg;
  const [u, v] = BASIS.x;
  const eo = circ([xc, yc, z1], u, v, ro);
  const ei = circ([xc, yc, z1], u, v, ri);
  const pt = (yy: number, zz: number) => P([xc, yy, zz]);
  const p0 = pt(yc - ro, z0);
  const p1 = pt(yc - ro, z1);
  const oa = arcSegs(eo, Math.PI, 0);
  const p2 = pt(yc + ro, z0);
  const p3 = pt(yc + ri, z0);
  const p4 = pt(yc + ri, z1);
  const ia = arcSegs(ei, 0, Math.PI);
  const p5 = pt(yc - ri, z0);
  const d0: Seg[] = [['M', p0[0], p0[1]], ['L', p1[0], p1[1]], ...oa.d, ['L', p2[0], p2[1]], ['L', p3[0], p3[1]], ['L', p4[0], p4[1]], ...ia.d, ['L', p5[0], p5[1]], ['Z']];
  s.add(g, TOP[tone], d0, [p0, p2, ...oa.bb]);
  s.box(g, x, y, z, d, w, h, tone);
  s.ell(g, 'solid', [x + d + 0.05, yc, z + h * 0.62], 'x', 1.5);
  s.line(g, 'edge', [x + d + 0.05, yc, z + h * 0.62], [x + d + 0.05, yc, z + h * 0.3]);
  return [x + d, y + 2, z + h * 0.72] as V3;
}
