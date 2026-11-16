import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proposalSchema, toAiIdea } from '../src/modules/ai/proposal';
import { proposeEvaluations, readAiSettings } from '../src/modules/ai/provider';
import { simulateProposal } from '../src/modules/ai/simulate';
import { idea, realIdeas } from './helpers';

const ai = (overrides = {}) => toAiIdea(idea(overrides));

test('l’IA ne reçoit ni le nom, ni le prénom, ni le site de l’auteur', () => {
  assert.deepEqual(Object.keys(ai()).sort(), ['benefits', 'budget', 'description', 'id', 'theme', 'title']);
  assert.doesNotMatch(JSON.stringify(ai()), /Julie|Marchand|Lyon/);
});

test('chaque idée du vrai export reçoit quatre notes de 1 à 5 et quatre justifications', async () => {
  const ideas = await realIdeas();
  const proposals = await proposeEvaluations(ideas.map(toAiIdea), readAiSettings({}));
  assert.equal(proposals.length, 40);
  for (const proposal of proposals) {
    assert.equal(proposalSchema.safeParse(proposal).success, true, proposal.ideaId);
    assert.equal(proposal.source, 'simulation');
    for (const text of Object.values(proposal.justifications)) assert.ok(text.length > 10, proposal.ideaId);
  }
  assert.deepEqual(proposals.map(proposal => proposal.ideaId), ideas.map(item => item.id));
});

test('la même idée reçoit toujours la même proposition', () => {
  assert.deepEqual(simulateProposal(ai()), simulateProposal(ai()));
});

test('la faisabilité suit le budget déclaré, et un budget inconnu reste neutre', () => {
  const score = (budget: number | null) => simulateProposal(ai({ budget })).scores.feasibility;
  assert.deepEqual([0, 15_000, 15_001, 50_000, 100_000, 200_000, 400_000].map(score), [5, 5, 4, 4, 3, 2, 1]);
  const unknown = simulateProposal(ai({ budget: null }));
  assert.equal(unknown.scores.feasibility, 3);
  assert.match(unknown.justifications.feasibility, /non renseigné/);
  assert.ok(unknown.reserves.includes('budget non renseigné'));
});

test('un test à petite échelle améliore la faisabilité, sans dépasser 5', () => {
  const pilot = { description: 'Tester des exosquelettes au poste de chargement, où les opérateurs manipulent plus de 2 tonnes par jour.' };
  assert.equal(simulateProposal(ai({ ...pilot, budget: 70_000 })).scores.feasibility, 4);
  assert.equal(simulateProposal(ai({ ...pilot, budget: 0 })).scores.feasibility, 5);
});

test('sans bénéfice annoncé, l’impact est bas et la réserve est dite', () => {
  const proposal = simulateProposal(ai({ benefits: '' }));
  assert.equal(proposal.scores.impact, 2);
  assert.ok(proposal.reserves.includes('bénéfices non renseignés'));
  assert.ok(simulateProposal(ai({ benefits: 'Environ 3 jours de production gagnés par an' })).scores.impact > proposal.scores.impact);
});

test('l’alignement reste neutre tant que les priorités du client ne sont pas renseignées', () => {
  const neutral = simulateProposal(ai());
  assert.equal(neutral.scores.alignment, 3);
  assert.match(neutral.justifications.alignment, /à confirmer/);
  assert.equal(simulateProposal(ai(), ['Énergie']).scores.alignment, 4);
  assert.equal(simulateProposal(ai(), ['énergie', 'compresseurs']).scores.alignment, 5);
  assert.equal(simulateProposal(ai(), ['Recrutement']).scores.alignment, 2);
});

test('le caractère innovant distingue une technologie nouvelle d’une pratique courante', () => {
  const score = (title: string, description: string) => simulateProposal(ai({ title, description })).scores.innovation;
  assert.equal(score('Réalité augmentée pour les techniciens', 'Des lunettes de réalité augmentée pour guider un technicien à distance.'), 4);
  assert.equal(score('Maintenance prédictive', 'Un modèle qui apprend à partir de l’historique pour une maintenance prédictive.'), 5);
  assert.equal(score('Café gratuit', 'Rendre le café gratuit dans tous les ateliers.'), 2);
  assert.equal(score('Kanban digital', 'Remplacer les cartes kanban papier par des écrans.'), 3);
  // « ia » ne doit être reconnu que comme mot entier, pas dans « fiable » ou « matériau ».
  assert.equal(score('Matériau fiable', 'Choisir un matériau plus fiable pour les pièces.'), 3);
});

test('la clé se renseigne par configuration et ne sort jamais des réglages', () => {
  assert.equal(readAiSettings({}).keyConfigured, false);
  assert.equal(readAiSettings({ AI_API_KEY: '   ' }).keyConfigured, false);
  const settings = readAiSettings({ AI_API_KEY: 'cle-de-test', AI_MODEL: 'modele-test', STRATEGIC_PRIORITIES: ' Sécurité, énergie ,, ' });
  assert.equal(settings.keyConfigured, true);
  assert.equal(settings.model, 'modele-test');
  assert.deepEqual(settings.priorities, ['Sécurité', 'énergie']);
  assert.doesNotMatch(JSON.stringify(settings), /cle-de-test/);
});

test('avec ou sans clé, la V1 répond par la simulation', async () => {
  const withKey = await proposeEvaluations([ai()], readAiSettings({ AI_API_KEY: 'cle-de-test' }));
  assert.equal(withKey[0].source, 'simulation');
  assert.deepEqual(withKey, await proposeEvaluations([ai()], readAiSettings({})));
});
