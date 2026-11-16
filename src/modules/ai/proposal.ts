import { z } from 'zod';
import type { Idea } from '../ideas/idea';
import { averageScore, scoresSchema } from '../evaluations/evaluation';

/** Ce que l'IA reçoit d'une idée : ni nom, ni prénom, ni site. */
export interface AiIdea {
  id: string;
  title: string;
  description: string;
  benefits: string;
  theme: string;
  budget: number | null;
}

export function toAiIdea(idea: Idea): AiIdea {
  return { id: idea.id, title: idea.title, description: idea.description, benefits: idea.benefits, theme: idea.theme, budget: idea.budget };
}

const justification = z.string().max(600);
export const proposalSchema = z.object({
  ideaId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  scores: scoresSchema,
  justifications: z.object({ impact: justification, feasibility: justification, alignment: justification, innovation: justification }),
  /** Informations manquantes qui fragilisent la proposition. */
  reserves: z.array(z.string().max(200)).max(10),
  /** « simulation » tant qu'aucun modèle n'est branché. */
  source: z.enum(['simulation', 'model']),
});
export type Proposal = z.infer<typeof proposalSchema>;

export function proposalAverage(proposal: Proposal): number {
  return averageScore(proposal.scores);
}
