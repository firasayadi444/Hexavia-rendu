import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Élan — Challenge innovation',
  description: 'Dépouillez les idées d’un challenge innovation : notation, doublons et shortlist pour le jury.',
  icons: { icon: '/icon.svg' },
  // Outil interne : inutile de le faire apparaître dans les moteurs de recherche.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
