import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { importCsv, parseBudget, parseDate } from '../src/modules/ideas/import-csv';
import { previewImport } from '../src/modules/ideas/preview-import';
import { analyzeCsv } from '../src/app/actions';

const headers = 'id;date_depot;prenom;nom;direction;site;theme;titre;description;benefices_attendus;budget_estime';
const row = 'IDEA-001;2026-10-03;Julie;Marchand;Maintenance;Lyon;Énergie;Capteurs;Installer des capteurs;Moins de pannes;15k€';
const fixture = (content = row) => `${headers}\n${content}`;

test('le vrai export fournit 40 idées, sans perte de lignes ni de caractères', async () => {
  const csv = await readFile(new URL('../data/idees_hexavia.csv', import.meta.url), 'utf8');
  const ideas = importCsv(csv);
  assert.equal(ideas.length, 40);
  assert.equal(ideas[0].firstName, 'Julie');
  assert.equal(ideas.find(i => i.id === 'IDEA-033')?.date, '2026-10-03');
  assert.equal(ideas.find(i => i.id === 'IDEA-033')?.dateRaw, '03/10/2026');
  assert.ok(ideas.find(i => i.id === 'IDEA-023')!.description.length > 700);
  assert.match(ideas.find(i => i.id === 'IDEA-021')!.description, /Build a digital twin/);
  assert.equal(ideas.filter(i => i.warnings.length).length, 8);
  assert.equal(ideas.filter(i => i.budget === null).length, 7);
  assert.equal(ideas.find(i => i.id === 'IDEA-030')?.budget, 0);
  assert.equal(ideas.find(i => i.id === 'IDEA-019')?.benefits, '');
});

test('les formats de budget sont reconnus et les inconnus restent inconnus', () => {
  for (const [value, expected] of [
    ['40 000 €', 40000], ['15k€', 15000], ['35k', 35000], ['30 000 euros', 30000],
    ['0 €', 0], ['0', 0], ['1,5k€', 1500], ['40\u202f000 €', 40000],
    ['80 000 € (machines et formation)', 80000], ['', null], ['?', null], ['-500 €', null],
    ['entre 10 et 20k', null], ['999999999999999999999', null],
  ] as const) assert.equal(parseBudget(value), expected, value);
});

test('les dates françaises et ISO convergent et les dates impossibles sont refusées', () => {
  assert.equal(parseDate('03/10/2026'), '2026-10-03');
  assert.equal(parseDate('2026-10-03'), '2026-10-03');
  assert.equal(parseDate('2024-02-29'), '2024-02-29');
  for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '31/04/2026', '', '03-10-2026']) {
    assert.throws(() => parseDate(value), /Date invalide/);
  }
});

test('BOM, CRLF, point-virgule cité, guillemets échappés et description multiligne', () => {
  const quoted = row.replace('Installer des capteurs', '"Installer; des ""capteurs""\r\nsur site"');
  const [idea] = importCsv('\ufeff' + fixture(quoted).replace(`${headers}\n`, `${headers}\r\n`));
  assert.equal(idea.description, 'Installer; des "capteurs"\nsur site');
});

test('les champs optionnels vides produisent des avertissements sans supprimer l’idée', () => {
  const [idea] = importCsv(fixture('A;2026-10-03;Julie;Marchand;RH;;;Une idée;Description;;'));
  assert.equal(idea.budget, null);
  assert.equal(idea.warnings.length, 4);
  assert.equal(idea.theme, '');
});

test('des contenus identiques avec des identifiants distincts restent deux idées', () => {
  assert.equal(importCsv(fixture(row + '\n' + row.replace('IDEA-001', 'IDEA-002'))).length, 2);
});

test('un identifiant répété bloque le fichier entier', () => {
  assert.throws(() => importCsv(fixture(row + '\n' + row)), /Identifiant répété/);
});

test('les colonnes manquantes, répétées, supplémentaires et le mauvais séparateur sont refusés', () => {
  for (const content of [fixture().replace('budget_estime', 'titre'), fixture().replace(';budget_estime', ''), fixture().replace(headers, headers + ';autre'), fixture().replaceAll(';', ',')]) {
    assert.throws(() => importCsv(content), /CSV invalide/);
  }
});

test('des colonnes réordonnées restent valides', () => {
  const columns = headers.split(';').reverse().join(';');
  const values = row.split(';').reverse().join(';');
  assert.equal(importCsv(`${columns}\n${values}`)[0].id, 'IDEA-001');
});

test('un nombre incorrect de cellules et des guillemets cassés donnent une erreur lisible', () => {
  for (const content of [row + ';extra', row.replace(';Lyon', ''), row.replace('Capteurs', '"Capteurs'), row.replace('Capteurs', 'Cap"teurs'), row.replace('Capteurs', '"Capteurs"suite')]) {
    assert.throws(() => importCsv(fixture(content)), /CSV invalide/);
  }
});

test('les champs obligatoires et les dates sont contrôlés avec le numéro de ligne', () => {
  for (const content of [row.replace('IDEA-001', '../bad'), row.replace('Capteurs;', ';'), row.replace('Installer des capteurs', ''), row.replace('Maintenance', ''), row.replace('2026-10-03', '2026-02-30')]) {
    assert.throws(() => importCsv(fixture(content)), /Ligne 2/);
  }
});

test('les fichiers vides, trop grands, champs trop longs et lots de plus de 1000 idées sont refusés', () => {
  assert.throws(() => importCsv(''), /CSV invalide/);
  assert.throws(() => importCsv(headers), /entre 1 et 1 000/);
  assert.throws(() => importCsv('é'.repeat(1_000_001)), /2 Mo/);
  assert.throws(() => importCsv(fixture(row.replace('Capteurs;', 'x'.repeat(25_001) + ';'))), /Champ trop long/);
  const tooMany = Array.from({ length: 1001 }, (_, i) => row.replace('IDEA-001', `IDEA-${i}`)).join('\n');
  assert.throws(() => importCsv(fixture(tooMany)), /entre 1 et 1 000/);
});

test('le service accepte un vrai fichier CSV UTF-8 et retourne l’aperçu', async () => {
  const result = await previewImport(new File([fixture()], 'export.CSV'));
  assert.equal(result.status, 'success');
  if (result.status === 'success') { assert.equal(result.filename, 'export.CSV'); assert.equal(result.ideas.length, 1); }
});

test('le service rejette un fichier vide, mauvais format, trop grand ou non UTF-8', async () => {
  await assert.rejects(previewImport(new File([], 'empty.csv')), /vide/);
  await assert.rejects(previewImport(new File([fixture()], 'export.xlsx')), /format .csv/);
  await assert.rejects(previewImport(new File(['x'.repeat(2_000_001)], 'large.csv')), /2 Mo/);
  await assert.rejects(previewImport(new File([new Uint8Array([0xff, 0xfe, 0xc0])], 'bad.csv')), /UTF-8/);
});

test('l’action serveur traite un formulaire sans fichier, invalide et valide', async () => {
  const empty = await analyzeCsv({ status: 'idle' }, new FormData());
  assert.equal(empty.status, 'error');
  const invalid = new FormData(); invalid.set('csv', new File(['bad csv'], 'bad.csv'));
  assert.equal((await analyzeCsv({ status: 'idle' }, invalid)).status, 'error');
  const valid = new FormData(); valid.set('csv', new File([fixture()], 'valid.csv'));
  assert.equal((await analyzeCsv({ status: 'idle' }, valid)).status, 'success');
});
