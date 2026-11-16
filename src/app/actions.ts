'use server';
import { ImportError, type Idea } from '../modules/ideas/idea';
import { previewImport } from '../modules/ideas/preview-import';
import { toAiIdea, type Proposal } from '../modules/ai/proposal';
import { proposeEvaluations } from '../modules/ai/provider';

export type AnalyzeResult =
  | { status: 'error'; message: string }
  | { status: 'success'; filename: string; ideas: Idea[]; proposals: Proposal[] };

// Frontière serveur : valide le fichier, délègue l'analyse au module métier, puis demande une première note à l'IA.
// Rien n'est stocké ni journalisé ici. L'IA ne reçoit que le contenu des idées, sans le nom des auteurs.
export async function analyzeCsv(data: FormData): Promise<AnalyzeResult> {
  const file = data.get('csv');
  if (!(file instanceof File)) return { status: 'error', message: 'Choisissez un fichier CSV à analyser.' };
  try {
    const preview = await previewImport(file);
    if (preview.status !== 'success') return { status: 'error', message: 'L’analyse a échoué. Réessayez avec votre fichier CSV.' };
    const proposals = await proposeEvaluations(preview.ideas.map(toAiIdea));
    return { status: 'success', filename: preview.filename, ideas: preview.ideas, proposals };
  } catch (error) {
    if (error instanceof ImportError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'L’analyse a échoué. Réessayez avec votre fichier CSV.' };
  }
}
