/**
 * Komponenty dostępne w MDX BEZ importu (przekazywane do <Content components={…} />).
 * Np. w pliku .mdx: <NoteBlock variant="scenario">…</NoteBlock>, <BOM caption="…" rows={frontmatter.coverage} />,
 * <FigPillarIT />, <AnnotatedFigure figure="FigPillarIT" />.
 */
import AnnotatedFigure from './AnnotatedFigure.astro';
import AnswerBox from './AnswerBox.astro';
import BOM from './BOM.astro';
import CardGrid from './CardGrid.astro';
import ContactChannels from './ContactChannels.astro';
import CoverageBadge from './CoverageBadge.astro';
import DimensionLine from './DimensionLine.astro';
import Figure from './Figure.astro';
import NoteBlock from './NoteBlock.astro';
import PlotterHero from './PlotterHero.astro';
import SectionView from './SectionView.astro';
import SheetCard from './SheetCard.astro';
import SpecTable from './SpecTable.astro';
import Term from './Term.astro';
import { FIGURES } from './figures/index.ts';

export const mdxComponents = {
  AnnotatedFigure,
  AnswerBox,
  BOM,
  CardGrid,
  ContactChannels,
  CoverageBadge,
  DimensionLine,
  Figure,
  NoteBlock,
  PlotterHero,
  SectionView,
  SheetCard,
  SpecTable,
  Term,
  ...FIGURES,
};
