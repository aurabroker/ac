/**
 * Rysunek izometryczny w nagłówku: przy pierwszym wejściu w widok części rozsuwają się odrobinę dalej
 * (klasa .is-open; ruch w CSS: src/styles/iso.css). Jednorazowo; przy prefers-reduced-motion — nic (rysunek już rozsunięty).
 */
const figs = document.querySelectorAll<HTMLElement>('[data-iso]');
if (figs.length && 'IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-open');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.5 },
  );
  figs.forEach((f) => io.observe(f));
}
