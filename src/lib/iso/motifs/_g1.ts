/**
 * Pomocnicze kształty motywów grupy 1 (rurociąg, zespół na osi, manometr, belka) — prywatne dla tych plików.
 * Tylko złożenia z prims.ts (bez nowych ról i kolorów).
 */
import { P, Sketch, add, circ, ellPoint, mul, solidRole, lineRole, type Circ, type V2, type V3 } from '../prims.ts';
import { BASIS, type AxisName } from '../geom.ts';
import type { Role, Tone } from '../scene.ts';

/** Kąt w stopniach → punkt na okręgu w płaszczyźnie ⟂ osi (baza geom.BASIS). */
export function onCircle(c: V3, axis: AxisName, r: number, deg: number): V3 {
  const [u, v] = BASIS[axis];
  const t = (deg * Math.PI) / 180;
  return add(c, add(mul(u, r * Math.cos(t)), mul(v, r * Math.sin(t))));
}

/** Elipsa okręgu (bez rysowania) — do kotwic etykiet. */
export function ellOf(c: V3, axis: AxisName, r: number): Circ {
  const [u, v] = BASIS[axis];
  return circ(c, u, v, r);
}

/** Kotwica na obrzeżu okręgu w kierunku dir na rysunku (np. [1, -0.6] — prawy górny skraj). */
export const rimAt = (c: V3, axis: AxisName, r: number, dir: V2): V2 => ellPoint(ellOf(c, axis, r), dir);

/**
 * Kilka strzałek jednym rzutem: najpierw wszystkie trzony, potem groty (dwie ścieżki zamiast 2·n).
 * a → b w 3D, grot na b.
 */
export function arrows(s: Sketch, g: number, list: [V3, V3][], o: { tone?: Tone; hl?: number; hw?: number; role?: Role } = {}) {
  const hl = o.hl ?? 8;
  const hw = o.hw ?? 6;
  const heads: V2[][] = [];
  for (const [a, b] of list) {
    const A = P(a);
    const B = P(b);
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const l = Math.hypot(dx, dy) || 1;
    const t: V2 = [dx / l, dy / l];
    const n: V2 = [-t[1], t[0]];
    const base: V2 = [B[0] - t[0] * hl, B[1] - t[1] * hl];
    s.poly2(g, o.role ?? lineRole(o.tone), [A, base], false);
    heads.push([B, [base[0] + (n[0] * hw) / 2, base[1] + (n[1] * hw) / 2], [base[0] - (n[0] * hw) / 2, base[1] - (n[1] * hw) / 2]]);
  }
  for (const h of heads) s.poly2(g, solidRole(o.tone), h, true);
}
