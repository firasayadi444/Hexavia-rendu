import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicatePairs, pairKey, stem } from '../src/modules/duplicates/detect';
import { idea, realIdeas } from './helpers';

test('le vrai export fait ressortir cinq paires, et aucune autre', async () => {
  const pairs = findDuplicatePairs(await realIdeas());
  assert.deepEqual(pairs.map(pair => pair.key).sort(), [
    'IDEA-001|IDEA-007', // capteurs et maintenance prédictive sur les compresseurs
    'IDEA-002|IDEA-014', // même idée déposée deux fois
    'IDEA-003|IDEA-019', // assistant IA et chatbot RH
    'IDEA-008|IDEA-027', // deux applications de covoiturage
    'IDEA-017|IDEA-018', // rapports d'intervention dictés
  ]);
});

test('un contenu identique est signalé comme tel, en tête de liste', async () => {
  const [first, ...others] = findDuplicatePairs(await realIdeas());
  assert.equal(first.key, 'IDEA-002|IDEA-014');
  assert.equal(first.kind, 'exact');
  assert.equal(first.similarity, 1);
  assert.ok(others.every(pair => pair.kind === 'similar' && pair.similarity < 1));
  assert.deepEqual(others.map(pair => pair.similarity), others.map(pair => pair.similarity).sort((a, b) => b - a));
});

test('la casse, les accents et la ponctuation ne cachent pas un doublon exact', () => {
  const pairs = findDuplicatePairs([
    idea({ id: 'A-1', title: 'Café gratuit', description: 'Rendre le café gratuit dans tous les ateliers.' }),
    idea({ id: 'A-2', title: 'CAFE GRATUIT !', description: 'Rendre le cafe gratuit, dans tous les ateliers' }),
  ]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].kind, 'exact');
});

test('une suggestion s’explique par les mots communs, affichés avec leurs accents', async () => {
  const pairs = findDuplicatePairs(await realIdeas());
  const hr = pairs.find(pair => pair.key === 'IDEA-003|IDEA-019')!;
  assert.ok(hr.sharedTerms.includes('rh'));
  assert.ok(hr.sharedTerms.includes('congés'));
  assert.ok(hr.sharedTerms.length <= 5);
});

test('des idées sans rapport ne sont pas rapprochées', () => {
  const pairs = findDuplicatePairs([
    idea({ id: 'A-1' }),
    idea({ id: 'A-2', title: 'Parrainage des nouveaux arrivants', description: 'Associer chaque nouvel arrivant à un parrain volontaire pendant trois mois.' }),
    idea({ id: 'A-3', title: 'Ombrières solaires', description: 'Couvrir les parkings d’ombrières photovoltaïques.' }),
  ]);
  assert.deepEqual(pairs, []);
});

test('le seuil règle la sensibilité : plus bas, plus de suggestions', async () => {
  const ideas = await realIdeas();
  assert.ok(findDuplicatePairs(ideas, 0.15).length > findDuplicatePairs(ideas).length);
  assert.equal(findDuplicatePairs(ideas, 0.99).length, 1);
});

test('la clé d’une paire ne dépend pas de l’ordre, et les listes vides ou d’une idée ne cassent rien', () => {
  assert.equal(pairKey('IDEA-014', 'IDEA-002'), pairKey('IDEA-002', 'IDEA-014'));
  assert.deepEqual(findDuplicatePairs([]), []);
  assert.deepEqual(findDuplicatePairs([idea()]), []);
  assert.deepEqual(findDuplicatePairs([idea({ id: 'A-1', title: '', description: '' }), idea({ id: 'A-2', title: '?', description: '…' })]).map(pair => pair.kind), ['exact']);
});

test('les variantes d’un même mot partagent une racine', () => {
  assert.equal(stem('pannes'), stem('panne'));
  assert.equal(stem('dictent'), stem('dicter'));
  assert.equal(stem('rapports'), stem('rapport'));
  assert.notEqual(stem('capteurs'), stem('compresseurs'));
});
