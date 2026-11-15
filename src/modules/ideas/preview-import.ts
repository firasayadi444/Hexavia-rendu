import { ImportError, type Idea } from './idea';
import { importCsv } from './import-csv';

export type ImportState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; previewId: string; filename: string; ideas: Idea[]; incomplete: number };

export async function previewImport(file: File): Promise<ImportState> {
  if (!/\.csv$/i.test(file.name)) throw new ImportError('Choisissez un fichier au format .csv.');
  if (file.size === 0) throw new ImportError('Le fichier est vide.');
  if (file.size > 2_000_000) throw new ImportError('Le fichier dépasse 2 Mo.');
  let csv: string;
  try { csv = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); }
  catch { throw new ImportError('Encodage invalide : exportez votre CSV en UTF-8.'); }
  const ideas = importCsv(csv);
  return { status: 'success', previewId: crypto.randomUUID(), filename: file.name, ideas, incomplete: ideas.filter(i => i.warnings.length > 0).length };
}
