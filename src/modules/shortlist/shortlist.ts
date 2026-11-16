import type { Idea } from '../ideas/idea';
import { averageScore, type Evaluation } from '../evaluations/evaluation';

export interface RankedIdea {
  rank: number;
  idea: Idea;
  evaluation: Evaluation;
  average: number;
}

/**
 * Classement des idées évaluées, hors doublons écartés.
 * Ordre : moyenne, puis impact, puis faisabilité, puis identifiant pour rester stable d'un affichage à l'autre.
 */
export function rankIdeas(ideas: Idea[], evaluations: Record<string, Evaluation>, dismissed: ReadonlySet<string> | ReadonlyMap<string, string>): RankedIdea[] {
  return ideas
    .filter(idea => evaluations[idea.id] && !dismissed.has(idea.id))
    .map(idea => ({ idea, evaluation: evaluations[idea.id], average: averageScore(evaluations[idea.id].scores) }))
    .sort((a, b) => b.average - a.average
      || b.evaluation.scores.impact - a.evaluation.scores.impact
      || b.evaluation.scores.feasibility - a.evaluation.scores.feasibility
      || a.idea.id.localeCompare(b.idea.id))
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}

/** Les mieux classées, dans la limite de la taille visée. Une suggestion : la consultante garde la main. */
export function suggestShortlist(ranked: RankedIdea[], target: number): string[] {
  return ranked.slice(0, Math.max(0, target)).map(entry => entry.idea.id);
}

// Un texte saisi par un salarié peut commencer par = + - ou @ : Excel l'exécuterait comme une formule.
function cell(value: string | number): string {
  const text = typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Export lisible par Excel en français : point-virgule, guillemets, UTF-8 avec BOM. */
export function shortlistToCsv(entries: RankedIdea[], options: { includeAuthors: boolean }): string {
  const author = options.includeAuthors;
  const header = ['Rang', 'Identifiant', 'Titre', 'Direction', 'Site', 'Thème', ...(author ? ['Auteur'] : []), 'Description',
    'Bénéfices attendus', 'Budget déclaré', 'Impact', 'Faisabilité', 'Alignement', 'Caractère innovant', 'Moyenne', 'Commentaire'];
  const rows = entries.map((entry, index) => {
    const { idea, evaluation: { scores, comment } } = entry;
    return [index + 1, idea.id, idea.title, idea.direction, idea.site, idea.theme, ...(author ? [`${idea.firstName} ${idea.lastName}`.trim()] : []),
      idea.description, idea.benefits, idea.budgetRaw, scores.impact, scores.feasibility, scores.alignment, scores.innovation, entry.average, comment];
  });
  return '﻿' + [header, ...rows].map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
}
