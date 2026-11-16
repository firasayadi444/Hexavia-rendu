/** Minuscules, sans accents ni ponctuation : sert à la recherche et à la comparaison de textes. */
export function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
