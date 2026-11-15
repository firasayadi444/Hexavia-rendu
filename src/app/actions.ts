'use server';
import { ImportError } from '../modules/ideas/idea';
import { previewImport, type ImportState } from '../modules/ideas/preview-import';

// Frontière HTTP : valide le fichier puis délègue au module métier.
export async function analyzeCsv(_previousState: ImportState, data: FormData): Promise<ImportState> {
  const file = data.get('csv');
  if (!(file instanceof File)) return { status: 'error', message: 'Choisissez un fichier CSV à analyser.' };
  try { return await previewImport(file); }
  catch (error) {
    if (error instanceof ImportError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'L’analyse a échoué. Réessayez avec votre fichier CSV.' };
  }
}
