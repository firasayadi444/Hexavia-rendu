/** Note à la française : 3,5 plutôt que 3.5. */
export function formatScore(value: number): string {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

/** Date ISO (2026-10-03) affichée à la française (03/10/2026). */
export function formatDate(isoDate: string): string {
  return isoDate.slice(0, 10).split('-').reverse().join('/');
}
