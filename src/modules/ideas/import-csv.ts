import { ImportError, type Idea } from './idea';

const headers = ['id', 'date_depot', 'prenom', 'nom', 'direction', 'site', 'theme', 'titre', 'description', 'benefices_attendus', 'budget_estime'];
// Analyse stricte : délimiteurs, guillemets échappés, retours ligne dans un champ.
function parseRows(source: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false, closed = false;
  const text = source.replace(/^\ufeff/, '').replace(/\r\n/g, '\n');
  const endField = () => { row.push(field.trim()); field = ''; closed = false; };
  const endRow = () => { endField(); if (row.some(Boolean)) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ';') endField();
    else if (c === '\n') endRow();
    else if (c === '"' && !field && !closed) quoted = true;
    else if (closed || c === '"') throw new Error('Guillemets mal formés.');
    else field += c;
    if (field.length > 25_000) throw new Error('Champ trop long.');
  }
  if (quoted) throw new Error('Guillemets non fermés.');
  if (field || row.length || closed) endRow();
  return rows;
}
export function parseBudget(raw: string): number | null {
  const text = raw.trim().replace(/[\u00a0\u202f]/g, ' ');
  const match = text.match(/^(\d[\d ]*(?:[,.]\d+)?)\s*(k)?\s*(?:€|euros?)?(?:\s*\([^\n]*\))?$/i);
  if (!match) return null;
  const n = Number(match[1].replace(/ /g, '').replace(',', '.')) * (match[2] ? 1000 : 1);
  return Number.isFinite(n) && n <= 1e12 ? n : null;
}
export function parseDate(raw: string): string {
  let value = raw;
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) value = `${match[3]}-${match[2]}-${match[1]}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ImportError(`Date invalide : ${raw}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ImportError(`Date invalide : ${raw}`);
  return value;
}
export function importCsv(text: string): Idea[] {
  if (new TextEncoder().encode(text).byteLength > 2_000_000) throw new ImportError('Le fichier dépasse 2 Mo.');
  let rows: Record<string, string>[];
  try {
    const [columns, ...data] = parseRows(text);
    if (!columns || columns.length !== headers.length || headers.some(h => !columns.includes(h))) {
      throw new Error('Colonnes attendues : ' + headers.join(';'));
    }
    rows = data.map((r, index) => {
      if (r.length !== columns.length) throw new Error(`Ligne ${index + 2} : nombre de colonnes incorrect.`);
      return Object.fromEntries(columns.map((column, i) => [column, r[i]]));
    });
  } catch (e) { throw new ImportError(`CSV invalide. ${e instanceof Error ? e.message : ''}`); }
  if (!rows.length || rows.length > 1000) throw new ImportError('Importez entre 1 et 1 000 idées par challenge.');
  const ids = new Set<string>();
  return rows.map((r, index) => {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(r.id) || !r.titre || !r.description || !r.direction) {
      throw new ImportError(`Ligne ${index + 2} : identifiant, titre, description ou direction invalide.`);
    }
    if (ids.has(r.id)) throw new ImportError(`Identifiant répété dans le fichier : ${r.id}.`);
    ids.add(r.id);
    const budget = parseBudget(r.budget_estime);
    const warnings = [];
    if (!r.site) warnings.push('Site non renseigné');
    if (!r.theme) warnings.push('Thème non renseigné');
    if (!r.benefices_attendus) warnings.push('Bénéfices non renseignés');
    if (budget === null) warnings.push('Budget à préciser');
    let date: string;
    try { date = parseDate(r.date_depot); }
    catch { throw new ImportError(`Ligne ${index + 2} (${r.id}) : date de dépôt invalide.`); }
    return { id: r.id, date, dateRaw: r.date_depot, firstName: r.prenom, lastName: r.nom,
      direction: r.direction, site: r.site, theme: r.theme, title: r.titre,
      description: r.description, benefits: r.benefices_attendus, budgetRaw: r.budget_estime, budget, warnings };
  });
}
