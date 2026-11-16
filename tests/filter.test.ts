import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOT_PROVIDED, applyFilters, defaultFilters, distinctValues, hasActiveFilters, type FilterContext, type IdeaFilters } from '../src/modules/ideas/filter';
import { realIdeas } from './helpers';

const noContext: FilterContext = { score: () => null, proposal: () => null, dismissed: () => false };
const ids = async (filters: Partial<IdeaFilters>, context = noContext) =>
  applyFilters(await realIdeas(), { ...defaultFilters, ...filters }, context).map(idea => idea.id);

test('sans filtre, les 40 idées restent dans l’ordre du fichier', async () => {
  const all = await ids({});
  assert.equal(all.length, 40);
  assert.equal(all[0], 'IDEA-001');
  assert.equal(all[39], 'IDEA-040');
  assert.equal(hasActiveFilters(defaultFilters), false);
});

test('les filtres par direction, thème et site se combinent', async () => {
  assert.deepEqual(await ids({ direction: 'Maintenance' }), ['IDEA-001', 'IDEA-007', 'IDEA-012', 'IDEA-018', 'IDEA-029', 'IDEA-035']);
  assert.deepEqual(await ids({ direction: 'Maintenance', theme: 'Énergie' }), ['IDEA-001', 'IDEA-007']);
  assert.deepEqual(await ids({ direction: 'Maintenance', theme: 'Énergie', site: 'Metz' }), ['IDEA-007']);
  assert.deepEqual(await ids({ direction: 'Finance', site: 'Lyon' }), []);
});

test('les idées sans thème ou sans site se retrouvent avec « non renseigné »', async () => {
  assert.deepEqual(await ids({ theme: NOT_PROVIDED }), ['IDEA-015', 'IDEA-029']);
  assert.deepEqual(await ids({ site: NOT_PROVIDED }), ['IDEA-040']);
  const ideas = await realIdeas();
  assert.equal(distinctValues(ideas, 'theme').at(-1), NOT_PROVIDED);
  assert.equal(distinctValues(ideas, 'direction').includes(NOT_PROVIDED), false);
  assert.deepEqual(distinctValues(ideas, 'site'), ['Grenoble', 'Lille', 'Lyon', 'Metz', 'Nantes', 'Siège', NOT_PROVIDED]);
});

test('la recherche ignore la casse et les accents, et cherche tous les mots', async () => {
  assert.deepEqual(await ids({ search: 'COVOITURAGE' }), ['IDEA-008', 'IDEA-027']);
  assert.deepEqual(await ids({ search: 'realite augmentee' }), ['IDEA-012']);
  assert.deepEqual(await ids({ search: 'idea-023' }), ['IDEA-023']);
  assert.deepEqual(await ids({ search: 'lefevre' }), ['IDEA-002', 'IDEA-014']);
  assert.deepEqual(await ids({ search: 'covoiturage formations' }), ['IDEA-027']);
  assert.deepEqual(await ids({ search: 'introuvable' }), []);
  assert.equal((await ids({ search: '   ' })).length, 40);
});

test('l’avancement sépare les idées évaluées des autres', async () => {
  const context: FilterContext = { ...noContext, score: id => (id === 'IDEA-005' ? 4 : id === 'IDEA-010' ? 2.5 : null) };
  assert.deepEqual(await ids({ status: 'done' }, context), ['IDEA-005', 'IDEA-010']);
  assert.equal((await ids({ status: 'todo' }, context)).length, 38);
});

test('les doublons écartés ne sont masqués que sur demande', async () => {
  const context: FilterContext = { ...noContext, dismissed: id => id === 'IDEA-014' };
  assert.equal((await ids({}, context)).length, 40);
  const hidden = await ids({ hideDismissed: true }, context);
  assert.equal(hidden.length, 39);
  assert.equal(hidden.includes('IDEA-014'), false);
});

test('les tris placent la meilleure note en tête et les idées sans note à la fin', async () => {
  const scores: Record<string, number> = { 'IDEA-005': 4, 'IDEA-010': 2.5, 'IDEA-030': 4.75 };
  const context: FilterContext = { ...noContext, score: id => scores[id] ?? null, proposal: id => (id === 'IDEA-040' ? 5 : 3) };
  assert.deepEqual((await ids({ sort: 'score' }, context)).slice(0, 4), ['IDEA-030', 'IDEA-005', 'IDEA-010', 'IDEA-001']);
  assert.equal((await ids({ sort: 'proposal' }, context))[0], 'IDEA-040');
  const recent = await ids({ sort: 'recent' });
  assert.deepEqual(recent.slice(0, 2), ['IDEA-039', 'IDEA-040']);
  assert.equal(recent.at(-1), 'IDEA-002');
});
