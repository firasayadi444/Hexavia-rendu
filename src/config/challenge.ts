// Ce qui change d'un client à l'autre. Les valeurs viennent de l'environnement
// pour réutiliser l'outil sur un autre challenge sans toucher au code.
export const challenge = {
  clientName: process.env.NEXT_PUBLIC_CLIENT_NAME?.trim() || 'Hexavia',
  /** Taille indicative de la shortlist présentée au jury. */
  shortlistTarget: 8,
};
