import { evaluationSchema, type ValidationResult } from './evaluation';

export function validateEvaluation(input: unknown): ValidationResult {
  const result = evaluationSchema.safeParse(input);
  if (!result.success) return { success: false, message: 'Renseignez les quatre notes avec des entiers de 1 à 5 et limitez le commentaire à 2 000 caractères.' };
  return { success: true, evaluation: { ...result.data, validatedAt: new Date().toISOString() } };
}
