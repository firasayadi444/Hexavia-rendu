import type { Idea } from './idea';
import { normalizeText } from '../text';

export type StatusFilter = 'all' | 'todo' | 'done';
export type SortOrder = 'file' | 'score' | 'proposal' | 'recent';
export type FilterField = 'direction' | 'theme' | 'site';

export interface IdeaFilters {
  search: string;
  direction: string;
  theme: string;
  site: string;
  status: StatusFilter;
  sort: SortOrder;
  hideDismissed: boolean;
}

/** Valeur de filtre pour les idées dont le champ est vide dans l'export. */
export const NOT_PROVIDED = '__non_renseigne__';

export const defaultFilters: IdeaFilters = { search: '', direction: '', theme: '', site: '', status: 'all', sort: 'file', hideDismissed: false };

/** Ce que les filtres ont besoin de savoir en dehors de l'idée elle-même. */
export interface FilterContext {
  score: (ideaId: string) => number | null;
  proposal: (ideaId: string) => number | null;
  dismissed: (ideaId: string) => boolean;
}

/** Valeurs proposées dans une liste déroulante, triées, « non renseigné » en dernier. */
export function distinctValues(ideas: Idea[], field: FilterField): string[] {
  const values = [...new Set(ideas.map(idea => idea[field]))];
  const filled = values.filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'));
  return values.includes('') ? [...filled, NOT_PROVIDED] : filled;
}

const matches = (value: string, filter: string) => !filter || (filter === NOT_PROVIDED ? value === '' : value === filter);

export function applyFilters(ideas: Idea[], filters: IdeaFilters, context: FilterContext): Idea[] {
  const words = normalizeText(filters.search).split(' ').filter(Boolean);
  const kept = ideas.filter(idea => {
    if (!matches(idea.direction, filters.direction) || !matches(idea.theme, filters.theme) || !matches(idea.site, filters.site)) return false;
    const evaluated = context.score(idea.id) !== null;
    if (filters.status === 'todo' && evaluated) return false;
    if (filters.status === 'done' && !evaluated) return false;
    if (filters.hideDismissed && context.dismissed(idea.id)) return false;
    if (!words.length) return true;
    const text = normalizeText(`${idea.id} ${idea.title} ${idea.description} ${idea.benefits} ${idea.firstName} ${idea.lastName}`);
    return words.every(word => text.includes(word));
  });
  if (filters.sort === 'file') return kept;
  // Les idées sans note passent après les autres ; à égalité, l'ordre du fichier est conservé.
  const value = (idea: Idea) => filters.sort === 'score' ? context.score(idea.id) : filters.sort === 'proposal' ? context.proposal(idea.id) : Date.parse(idea.date);
  return [...kept].sort((a, b) => (value(b) ?? -1) - (value(a) ?? -1));
}

export function hasActiveFilters(filters: IdeaFilters): boolean {
  return Boolean(filters.search.trim() || filters.direction || filters.theme || filters.site || filters.status !== 'all' || filters.hideDismissed);
}
