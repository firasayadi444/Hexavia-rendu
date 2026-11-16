import { readFile } from 'node:fs/promises';
import type { Idea } from '../src/modules/ideas/idea';
import { importCsv } from '../src/modules/ideas/import-csv';
import type { Evaluation } from '../src/modules/evaluations/evaluation';

/** Les 40 idées du vrai export fourni par la consultante. */
export async function realIdeas(): Promise<Idea[]> {
  return importCsv(await readFile(new URL('../public/exemple-idees-hexavia.csv', import.meta.url), 'utf8'));
}

export function idea(overrides: Partial<Idea> = {}): Idea {
  return { id: 'A-1', date: '2026-10-03', dateRaw: '2026-10-03', firstName: 'Julie', lastName: 'Marchand', direction: 'Maintenance',
    site: 'Lyon', theme: 'Énergie', title: 'Capteurs de vibration', description: 'Installer des capteurs connectés sur les compresseurs du site pour détecter l’usure avant la panne.',
    benefits: 'Moins d’arrêts non planifiés', budgetRaw: '40 000 €', budget: 40000, warnings: [], ...overrides };
}

export function evaluation(ideaId: string, impact: number, feasibility: number, alignment: number, innovation: number, comment = ''): Evaluation {
  return { ideaId, scores: { impact, feasibility, alignment, innovation }, comment, validatedAt: '2026-11-16T10:00:00.000Z' };
}
