import { z } from 'zod';

const rating = z.number().int().min(1).max(5);
export const scoresSchema = z.object({
  impact: rating,
  feasibility: rating,
  alignment: rating,
  innovation: rating,
}).strict();

export type Scores = z.infer<typeof scoresSchema>;
export type ScoreKey = keyof Scores;
export const evaluationSchema = z.object({
  ideaId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  scores: scoresSchema,
  comment: z.string().trim().max(2000),
}).strict();
export type EvaluationInput = z.infer<typeof evaluationSchema>;
export type Evaluation = EvaluationInput & { validatedAt: string };
export type ValidationResult =
  | { success: true; evaluation: Evaluation }
  | { success: false; message: string };

export function averageScore(scores: Scores): number {
  // Même poids pour chaque critère ; arrondi au centième seulement à la fin.
  return Math.round((scores.impact + scores.feasibility + scores.alignment + scores.innovation) / 4 * 100) / 100;
}

export interface Criterion {
  key: ScoreKey;
  label: string;
  question: string;
  anchors: { value: 1 | 3 | 5; description: string }[];
}

// Repères proposés pour le prototype, pas une grille officielle d'Hexavia.
export const criteria: Criterion[] = [
  {
    key: 'impact', label: 'Impact pour l’entreprise',
    question: 'Quelle amélioration concrète cette idée peut-elle apporter ?',
    anchors: [
      { value: 1, description: 'Bénéfice limité, sans effet significatif identifié.' },
      { value: 3, description: 'Bénéfice concret à l’échelle d’une équipe ou d’un site.' },
      { value: 5, description: 'Bénéfice majeur, étayé et potentiellement déployable dans le groupe.' },
    ],
  },
  {
    key: 'feasibility', label: 'Faisabilité',
    question: 'Les moyens, les compétences et les dépendances permettent-ils d’essayer cette idée ?',
    anchors: [
      { value: 1, description: 'Obstacles majeurs ; ressources ou dépendances non maîtrisées.' },
      { value: 3, description: 'Pilote envisageable, avec des contraintes identifiées à lever.' },
      { value: 5, description: 'Pilote simple à lancer avec des moyens disponibles et des risques maîtrisés.' },
    ],
  },
  {
    key: 'alignment', label: 'Alignement stratégique',
    question: 'L’idée contribue-t-elle aux priorités que le client aura confirmées ?',
    anchors: [
      { value: 1, description: 'Lien faible ou contradictoire avec les priorités retenues.' },
      { value: 3, description: 'Contribution plausible, à préciser avec le client.' },
      { value: 5, description: 'Contribution directe et argumentée à une priorité explicite.' },
    ],
  },
  {
    key: 'innovation', label: 'Caractère innovant',
    question: 'Qu’est-ce qui change réellement par rapport aux pratiques actuelles d’Hexavia ?',
    anchors: [
      { value: 1, description: 'Pratique déjà courante dans le périmètre concerné.' },
      { value: 3, description: 'Adaptation nouvelle pour l’équipe ou combinaison utile de pratiques connues.' },
      { value: 5, description: 'Approche nettement nouvelle pour Hexavia, avec un avantage différenciant crédible.' },
    ],
  },
];
