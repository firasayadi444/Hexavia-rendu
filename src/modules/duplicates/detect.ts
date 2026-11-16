import type { Idea } from '../ideas/idea';
import { normalizeText } from '../text';

// Détection par règles, sans modèle : elle suggère des paires, elle ne décide jamais à la place de la consultante.
export type DuplicateKind = 'exact' | 'similar';
export interface DuplicatePair {
  key: string;
  firstId: string;
  secondId: string;
  kind: DuplicateKind;
  /** Proximité de 0 à 1 ; 1 pour un contenu identique. */
  similarity: number;
  /** Mots communs les plus distinctifs, pour expliquer la suggestion. */
  sharedTerms: string[];
}

// Seuil réglé sur l'export Hexavia : mieux vaut une suggestion en trop (un clic pour l'écarter) qu'un doublon manqué.
export const SIMILARITY_THRESHOLD = 0.25;

// Expressions équivalentes dans le vocabulaire des challenges ; liste volontairement courte, à enrichir par client.
const EQUIVALENTS: [RegExp, string][] = [
  [/\bcomptes? rendus?\b/g, 'rapport'],
  [/\bchatbot\b/g, 'assistant'],
];

const STOPWORDS = new Set(`a au aux avec ce ces cet cette chaque comme dans de des du elle elles en entre est et eux il ils la le les leur leurs
mais meme ne nos notre nous on ou par pas plus pour qu que qui sa sans se ses son sont sur tous tout toute toutes tres un une vos votre vous
aujourd hui avant apres aussi afin alors etre avoir fait faire font peut peuvent pourrait permettre mettre place lieu chez depuis lors
the and for from with that this are our under one most find build line different better`.split(/\s+/));

/** Racine approximative : assez pour rapprocher « pannes » et « panne », « dictent » et « dicter ». */
export function stem(word: string): string {
  if (word.length <= 4) return word;
  const root = word.replace(/(ements?|ations?|ent|er|ees?|es|e|s|x)$/, '');
  return root.length >= 3 ? root : word;
}

function terms(text: string): string[] {
  let normalized = normalizeText(text);
  for (const [pattern, replacement] of EQUIVALENTS) normalized = normalized.replace(pattern, replacement);
  return normalized.split(' ').filter(word => word.length >= 2 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export function findDuplicatePairs(ideas: Idea[], threshold = SIMILARITY_THRESHOLD): DuplicatePair[] {
  const labels = new Map<string, string>();
  // Le titre compte double : c'est le résumé que l'auteur a lui-même choisi.
  const vectors = ideas.map(idea => {
    const counts = new Map<string, number>();
    const add = (text: string, weight: number) => {
      // Libellés lisibles (avec accents) pour expliquer la suggestion.
      for (const word of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
        const root = stem(normalizeText(word));
        if (word && !labels.has(root)) labels.set(root, word);
      }
      for (const word of terms(text)) {
        const root = stem(word);
        counts.set(root, (counts.get(root) ?? 0) + weight);
      }
    };
    add(idea.title, 2);
    add(idea.description, 1);
    return counts;
  });
  // Un mot présent dans beaucoup d'idées (« site », « salariés ») pèse moins qu'un mot rare (« compresseurs »).
  const documentCount = new Map<string, number>();
  for (const vector of vectors) for (const root of vector.keys()) documentCount.set(root, (documentCount.get(root) ?? 0) + 1);
  const weight = (root: string) => Math.log(1 + ideas.length / (documentCount.get(root) ?? 1));
  const weighted = vectors.map(vector => {
    const result = new Map<string, number>();
    let norm = 0;
    for (const [root, count] of vector) {
      const value = (1 + Math.log(count)) * weight(root);
      result.set(root, value);
      norm += value * value;
    }
    return { values: result, norm: Math.sqrt(norm) };
  });
  const fingerprint = (idea: Idea) => normalizeText(`${idea.title} ${idea.description}`);

  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = weighted[i], b = weighted[j];
      const shared = [...a.values.keys()].filter(root => b.values.has(root));
      const exact = fingerprint(ideas[i]) === fingerprint(ideas[j]);
      let dot = 0;
      for (const root of shared) dot += a.values.get(root)! * b.values.get(root)!;
      const similarity = exact ? 1 : a.norm && b.norm ? dot / (a.norm * b.norm) : 0;
      if (!exact && similarity < threshold) continue;
      const sharedTerms = shared
        .sort((x, y) => a.values.get(y)! * b.values.get(y)! - a.values.get(x)! * b.values.get(x)!)
        .slice(0, 5).map(root => labels.get(root) ?? root);
      pairs.push({ key: pairKey(ideas[i].id, ideas[j].id), firstId: ideas[i].id, secondId: ideas[j].id,
        kind: exact ? 'exact' : 'similar', similarity: Math.round(similarity * 100) / 100, sharedTerms });
    }
  }
  return pairs.sort((x, y) => y.similarity - x.similarity || x.key.localeCompare(y.key));
}
