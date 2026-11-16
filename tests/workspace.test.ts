import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toAiIdea } from '../src/modules/ai/proposal';
import { simulateProposal } from '../src/modules/ai/simulate';
import { pairKey } from '../src/modules/duplicates/detect';
import { createWorkspace, decideDuplicate, dismissedIdeas, parseWorkspace, saveEvaluation, toggleShortlisted } from '../src/modules/workspace/workspace';
import { evaluation, idea, realIdeas } from './helpers';

const ideas = ['A', 'B', 'C'].map(id => idea({ id }));
const fresh = () => createWorkspace('export.csv', ideas, ideas.map(item => simulateProposal(toAiIdea(item))), new Date('2026-11-16T10:00:00Z'));

test('un nouvel espace de travail est vide de toute décision et n’expose pas les auteurs par défaut', () => {
  const workspace = fresh();
  assert.equal(workspace.importedAt, '2026-11-16T10:00:00.000Z');
  assert.deepEqual(Object.keys(workspace.proposals), ['A', 'B', 'C']);
  assert.deepEqual([workspace.evaluations, workspace.decisions, workspace.shortlist], [{}, {}, []]);
  assert.equal(workspace.includeAuthors, false);
});

test('l’espace de travail du vrai export se relit à l’identique après enregistrement', async () => {
  const real = await realIdeas();
  let workspace = createWorkspace('idees_hexavia.csv', real, real.map(item => simulateProposal(toAiIdea(item))));
  workspace = saveEvaluation(workspace, evaluation('IDEA-023', 5, 3, 3, 3, 'Projet porté par son auteur.'));
  workspace = decideDuplicate(workspace, pairKey('IDEA-002', 'IDEA-014'), { status: 'duplicate', keptId: 'IDEA-002', dismissedId: 'IDEA-014' });
  workspace = toggleShortlisted(workspace, 'IDEA-023');
  assert.deepEqual(parseWorkspace(JSON.stringify(workspace)), workspace);
});

test('un contenu absent, illisible, d’une autre version ou falsifié est ignoré sans erreur', () => {
  assert.equal(parseWorkspace(null), null);
  assert.equal(parseWorkspace(''), null);
  assert.equal(parseWorkspace('{pas du json'), null);
  assert.equal(parseWorkspace(JSON.stringify({ ...fresh(), version: 2 })), null);
  assert.equal(parseWorkspace(JSON.stringify({ ...fresh(), ideas: [] })), null);
  const tampered = saveEvaluation(fresh(), { ...evaluation('A', 3, 3, 3, 3), scores: { impact: 9, feasibility: 3, alignment: 3, innovation: 3 } });
  assert.equal(parseWorkspace(JSON.stringify(tampered)), null);
});

test('les notes et la shortlist d’idées absentes du fichier sont écartées à la relecture', () => {
  const workspace = { ...fresh(), evaluations: { Z: evaluation('Z', 3, 3, 3, 3), A: evaluation('A', 4, 4, 4, 4) }, shortlist: ['Z', 'A'] };
  const parsed = parseWorkspace(JSON.stringify(workspace))!;
  assert.deepEqual(Object.keys(parsed.evaluations), ['A']);
  assert.deepEqual(parsed.shortlist, ['A']);
});

test('enregistrer une évaluation remplace la précédente sans modifier l’état d’origine', () => {
  const before = fresh();
  const after = saveEvaluation(saveEvaluation(before, evaluation('A', 2, 2, 2, 2)), evaluation('A', 5, 4, 4, 5));
  assert.deepEqual(before.evaluations, {});
  assert.equal(after.evaluations.A.scores.impact, 5);
  assert.equal(Object.keys(after.evaluations).length, 1);
});

test('écarter un doublon le retire de la shortlist, sans jamais supprimer l’idée', () => {
  const key = pairKey('A', 'B');
  const shortlisted = toggleShortlisted(toggleShortlisted(fresh(), 'A'), 'B');
  const decided = decideDuplicate(shortlisted, key, { status: 'duplicate', keptId: 'A', dismissedId: 'B' });
  assert.deepEqual(decided.shortlist, ['A']);
  assert.deepEqual([...dismissedIdeas(decided)], [['B', 'A']]);
  assert.equal(decided.ideas.length, 3);
});

test('une décision s’annule, et deux idées jugées distinctes restent dans la course', () => {
  const key = pairKey('A', 'B');
  const decided = decideDuplicate(fresh(), key, { status: 'duplicate', keptId: 'A', dismissedId: 'B' });
  const cancelled = decideDuplicate(decided, key, null);
  assert.deepEqual(cancelled.decisions, {});
  assert.equal(dismissedIdeas(cancelled).size, 0);
  const distinct = decideDuplicate(toggleShortlisted(fresh(), 'B'), key, { status: 'distinct' });
  assert.equal(dismissedIdeas(distinct).size, 0);
  assert.deepEqual(distinct.shortlist, ['B']);
});

test('retenir puis retirer une idée de la shortlist', () => {
  const once = toggleShortlisted(fresh(), 'C');
  assert.deepEqual(once.shortlist, ['C']);
  assert.deepEqual(toggleShortlisted(once, 'C').shortlist, []);
});
