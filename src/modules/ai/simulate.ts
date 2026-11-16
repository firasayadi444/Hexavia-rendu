import { normalizeText } from '../text';
import type { AiIdea, Proposal } from './proposal';

// Simulation d'un modèle : des règles simples, lisibles et déterministes.
// Elle sert à éprouver le parcours « l'IA propose, la consultante corrige », pas à juger les idées.

const clamp = (value: number) => Math.min(5, Math.max(1, value));
const euros = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;
const sentence = (lead: string, reasons: string[]) => (reasons.length ? `${lead} : ${reasons.join(', ')}.` : `${lead}.`);

const WIDE_SCOPE = ['client', 'tous les', 'toutes les', 'accident', 'revenu'];
const PILOT = ['tester', 'pilote', 'experimenter', 'deja installe'];
const NEW_TECHNOLOGIES: [string, string][] = [
  [' ia ', 'IA'], ['realite augmentee', 'réalité augmentée'], ['digital twin', 'jumeau numérique'],
  ['jumeau numerique', 'jumeau numérique'], ['exosquelette', 'exosquelettes'], ['predicti', 'maintenance prédictive'],
  ['ceramique', 'revêtement céramique'], ['qui apprend', 'apprentissage automatique'], ['photovolta', 'photovoltaïque'],
];
const COMMON_PRACTICES = ['cafe', 'parrain', 'enquete', 'covoiturage', 'wifi', 'tableau de bord'];

function impact(idea: AiIdea, text: string): [number, string] {
  if (!idea.benefits) return [2, 'Aucun bénéfice n’est annoncé : l’impact reste à préciser avec l’auteur.'];
  let score = 3;
  const reasons: string[] = [];
  if (/\d/.test(idea.benefits)) { score++; reasons.push('le gain annoncé est chiffré'); }
  if (WIDE_SCOPE.some(word => text.includes(word))) { score++; reasons.push('l’idée touche les clients ou un large périmètre'); }
  if (idea.description.length < 80) { score--; reasons.push('la description est très courte'); }
  const lead = score >= 5 ? 'Bénéfice majeur et étayé' : score === 4 ? 'Bénéfice net' : score === 3 ? 'Bénéfice concret mais non chiffré' : 'Bénéfice encore peu étayé';
  return [clamp(score), sentence(lead, reasons)];
}

function feasibility(idea: AiIdea, text: string): [number, string] {
  if (idea.budget === null) return [3, 'Budget non renseigné : note neutre, la faisabilité reste à confirmer.'];
  const tiers: [number, number, string][] = [
    [15_000, 5, 'un essai est possible avec des moyens limités'],
    [50_000, 4, 'investissement modéré'],
    [100_000, 3, 'investissement significatif, à arbitrer'],
    [200_000, 2, 'investissement lourd'],
    [Infinity, 1, 'investissement très lourd pour un challenge interne'],
  ];
  const [, base, comment] = tiers.find(([limit]) => idea.budget! <= limit)!;
  const lead = idea.budget === 0 ? 'Aucun budget demandé' : `Budget déclaré de ${euros(idea.budget)}`;
  const pilot = PILOT.some(word => text.includes(word));
  return [clamp(base + (pilot ? 1 : 0)), sentence(lead, pilot ? [comment, 'l’auteur prévoit un test à petite échelle'] : [comment])];
}

function alignment(text: string, priorities: string[]): [number, string] {
  if (!priorities.length) return [3, 'Les priorités stratégiques du client ne sont pas renseignées : note neutre, à confirmer.'];
  const matched = priorities.filter(priority => text.includes(normalizeText(priority)));
  if (!matched.length) return [2, 'Aucun lien direct repéré avec les priorités renseignées.'];
  return [matched.length > 1 ? 5 : 4, `Contribue aux priorités renseignées : ${matched.join(', ')}.`];
}

function innovation(text: string): [number, string] {
  const technologies = [...new Set(NEW_TECHNOLOGIES.filter(([needle]) => text.includes(needle)).map(([, label]) => label))];
  if (technologies.length) return [technologies.length > 1 ? 5 : 4, `S’appuie sur une technologie encore peu répandue dans l’entreprise : ${technologies.join(', ')}.`];
  if (COMMON_PRACTICES.some(word => text.includes(word))) return [2, 'Pratique déjà courante dans beaucoup d’entreprises.'];
  return [3, 'Amélioration d’une pratique existante, sans rupture identifiée.'];
}

export function simulateProposal(idea: AiIdea, priorities: string[] = []): Proposal {
  const text = ` ${normalizeText(`${idea.theme} ${idea.title} ${idea.description} ${idea.benefits}`)} `;
  const [impactScore, impactWhy] = impact(idea, text);
  const [feasibilityScore, feasibilityWhy] = feasibility(idea, text);
  const [alignmentScore, alignmentWhy] = alignment(text, priorities);
  const [innovationScore, innovationWhy] = innovation(text);
  const reserves: string[] = [];
  if (!idea.benefits) reserves.push('bénéfices non renseignés');
  if (idea.budget === null) reserves.push('budget non renseigné');
  if (idea.description.length < 80) reserves.push('description très courte');
  return {
    ideaId: idea.id,
    scores: { impact: impactScore, feasibility: feasibilityScore, alignment: alignmentScore, innovation: innovationScore },
    justifications: { impact: impactWhy, feasibility: feasibilityWhy, alignment: alignmentWhy, innovation: innovationWhy },
    reserves,
    source: 'simulation',
  };
}
