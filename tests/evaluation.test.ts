import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageScore, evaluationSchema, scoresSchema } from '../src/modules/evaluations/evaluation';
import { validateEvaluation } from '../src/modules/evaluations/validate-evaluation';

const valid = { ideaId: 'IDEA-001', scores: { impact: 4, feasibility: 3, alignment: 2, innovation: 5 }, comment: 'Pilote à cadrer.' };

test('les quatre critères ont le même poids, avec les bornes de 1 à 5', () => {
  assert.equal(averageScore(valid.scores), 3.5);
  assert.equal(averageScore({ impact: 1, feasibility: 1, alignment: 1, innovation: 2 }), 1.25);
  assert.equal(averageScore({ impact: 1, feasibility: 1, alignment: 1, innovation: 1 }), 1);
  assert.equal(averageScore({ impact: 5, feasibility: 5, alignment: 5, innovation: 5 }), 5);
  for (const key of Object.keys(valid.scores)) {
    assert.equal(averageScore({ impact: 1, feasibility: 1, alignment: 1, innovation: 1, [key]: 5 }), 2);
  }
});

test('aucune note par défaut ne complète une évaluation incomplète', () => {
  assert.equal(scoresSchema.safeParse({}).success, false);
  const { alignment: _alignment, ...partial } = valid.scores;
  assert.equal(scoresSchema.safeParse(partial).success, false);
  assert.equal(validateEvaluation({ ...valid, scores: partial }).success, false);
});

test('les notes décimales, hors bornes, non numériques et les critères inconnus sont refusés', () => {
  for (const value of [0, 6, -1, 2.5, NaN, Infinity, '3', null, undefined]) {
    assert.equal(validateEvaluation({ ...valid, scores: { ...valid.scores, impact: value } }).success, false);
  }
  assert.equal(validateEvaluation({ ...valid, scores: { ...valid.scores, bonus: 5 } }).success, false);
});

test('le commentaire est facultatif, nettoyé et limité à 2000 caractères', () => {
  const cleaned = validateEvaluation({ ...valid, comment: '  Test du pilote  ' });
  assert.equal(cleaned.success, true);
  if (cleaned.success) assert.equal(cleaned.evaluation.comment, 'Test du pilote');
  assert.equal(validateEvaluation({ ...valid, comment: '' }).success, true);
  assert.equal(validateEvaluation({ ...valid, comment: 'x'.repeat(2000) }).success, true);
  assert.equal(validateEvaluation({ ...valid, comment: 'x'.repeat(2001) }).success, false);
});

test('une évaluation reste liée à un identifiant valide et ne peut injecter de métadonnées', () => {
  for (const ideaId of ['', '../idea', '<script>', 'x'.repeat(65), null]) {
    assert.equal(evaluationSchema.safeParse({ ...valid, ideaId }).success, false);
  }
  assert.equal(validateEvaluation({ ...valid, validatedAt: 'date inventée' }).success, false);
  assert.equal(validateEvaluation(null).success, false);
});

test('la validation produit un résultat horodaté sans modifier la saisie', () => {
  const copy = structuredClone(valid);
  const before = Date.now();
  const result = validateEvaluation(valid);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.evaluation.ideaId, 'IDEA-001');
    assert.deepEqual(result.evaluation.scores, valid.scores);
    assert.ok(Date.parse(result.evaluation.validatedAt) >= before);
  }
  assert.deepEqual(valid, copy);
});
