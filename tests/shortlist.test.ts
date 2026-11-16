import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankIdeas, shortlistToCsv, suggestShortlist } from '../src/modules/shortlist/shortlist';
import { evaluation, idea } from './helpers';

const ideas = ['A', 'B', 'C', 'D', 'E'].map(id => idea({ id, title: `Idée ${id}` }));
const evaluations = {
  A: evaluation('A', 3, 3, 3, 3),
  B: evaluation('B', 5, 4, 4, 5),
  C: evaluation('C', 4, 2, 3, 3), // même moyenne que A, impact plus fort
  E: evaluation('E', 5, 5, 5, 5),
};

test('le classement suit la moyenne, ignore les idées non évaluées et les doublons écartés', () => {
  const ranked = rankIdeas(ideas, evaluations, new Set(['E']));
  assert.deepEqual(ranked.map(entry => entry.idea.id), ['B', 'C', 'A']);
  assert.deepEqual(ranked.map(entry => entry.rank), [1, 2, 3]);
  assert.deepEqual(ranked.map(entry => entry.average), [4.5, 3, 3]);
});

test('à moyenne égale, l’impact puis la faisabilité départagent, puis l’identifiant', () => {
  const tied = { A: evaluation('A', 4, 2, 3, 3), B: evaluation('B', 4, 3, 2, 3), C: evaluation('C', 4, 3, 3, 2), D: evaluation('D', 3, 3, 3, 3) };
  assert.deepEqual(rankIdeas(ideas, tied, new Set()).map(entry => entry.idea.id), ['B', 'C', 'A', 'D']);
});

test('la suggestion retient les mieux classées, dans la limite demandée', () => {
  const ranked = rankIdeas(ideas, evaluations, new Map());
  assert.deepEqual(suggestShortlist(ranked, 2), ['E', 'B']);
  assert.deepEqual(suggestShortlist(ranked, 8), ['E', 'B', 'C', 'A']);
  assert.deepEqual(suggestShortlist(ranked, 0), []);
  assert.deepEqual(suggestShortlist([], 8), []);
});

test('l’export s’ouvre dans Excel : BOM, point-virgule, guillemets et virgule décimale', () => {
  const tricky = idea({ id: 'B', title: 'Kanban "digital"; écrans', description: 'Ligne 1\nLigne 2' });
  const csv = shortlistToCsv(rankIdeas([tricky], { B: evaluation('B', 5, 4, 4, 5, 'À présenter en premier') }, new Set()), { includeAuthors: false });
  assert.ok(csv.startsWith('﻿"Rang";"Identifiant";"Titre"'));
  assert.ok(csv.endsWith('\r\n'));
  assert.match(csv, /"Kanban ""digital""; écrans"/);
  assert.match(csv, /"Ligne 1\nLigne 2"/);
  assert.match(csv, /"5";"4";"4";"5";"4,5";"À présenter en premier"/);
  assert.equal(csv.split('\r\n')[0].split(';').length, 15);
});

test('les noms des auteurs ne sortent que si la consultante le demande', () => {
  const ranked = rankIdeas(ideas, evaluations, new Set());
  const anonymous = shortlistToCsv(ranked, { includeAuthors: false });
  assert.doesNotMatch(anonymous, /Auteur|Julie|Marchand/);
  const named = shortlistToCsv(ranked, { includeAuthors: true });
  assert.match(named, /"Auteur"/);
  assert.match(named, /"Julie Marchand"/);
});

test('un texte qui ressemble à une formule est neutralisé avant l’export', () => {
  const risky = idea({ id: 'B', title: '=HYPERLINK("http://exemple.test")', benefits: '+33 gains', budgetRaw: '-500 €', description: '@commande' });
  const csv = shortlistToCsv(rankIdeas([risky], { B: evaluation('B', 3, 3, 3, 3) }, new Set()), { includeAuthors: false });
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/exemple.test""\)"/);
  assert.match(csv, /"'\+33 gains"/);
  assert.match(csv, /"'-500 €"/);
  assert.match(csv, /"'@commande"/);
});

test('une shortlist vide donne un fichier avec la seule ligne de titres', () => {
  assert.equal(shortlistToCsv([], { includeAuthors: false }).trim().split('\r\n').length, 1);
});
