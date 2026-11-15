'use server';
import { validateEvaluation } from '../modules/evaluations/validate-evaluation';
import type { ValidationResult } from '../modules/evaluations/evaluation';

// Validation serveur seulement : aucune écriture en base à cette étape.
export async function confirmSessionEvaluation(input: unknown): Promise<ValidationResult> {
  return validateEvaluation(input);
}
