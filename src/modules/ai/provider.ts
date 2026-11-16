import type { AiIdea, Proposal } from './proposal';
import { simulateProposal } from './simulate';

export interface AiSettings {
  /** Vrai dès qu'une clé est renseignée dans l'environnement. La clé elle-même ne quitte jamais le serveur. */
  keyConfigured: boolean;
  model: string;
  /** Priorités stratégiques du client, pour le critère d'alignement. */
  priorities: string[];
}

type Env = Record<string, string | undefined>;

export function readAiSettings(env: Env = process.env): AiSettings {
  return {
    keyConfigured: Boolean(env.AI_API_KEY?.trim()),
    model: env.AI_MODEL?.trim() ?? '',
    priorities: (env.STRATEGIC_PRIORITIES ?? '').split(',').map(value => value.trim()).filter(Boolean),
  };
}

/**
 * Point de branchement unique d'un vrai modèle.
 * V1 : les propositions sont simulées, avec ou sans clé. Le jour où un modèle est branché,
 * c'est ici qu'on l'appelle quand `settings.keyConfigured` est vrai, en gardant la simulation en secours.
 */
export async function proposeEvaluations(ideas: AiIdea[], settings: AiSettings = readAiSettings()): Promise<Proposal[]> {
  return ideas.map(idea => simulateProposal(idea, settings.priorities));
}
