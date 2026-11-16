'use client';
import { useState, useTransition } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { FileSpreadsheet } from 'lucide-react';
import { analyzeCsv, type AnalyzeResult } from './actions';

type Imported = Extract<AnalyzeResult, { status: 'success' }>;
const EXAMPLE_URL = '/exemple-idees-hexavia.csv';

export function ImportForm({ onImported }: { onImported: (result: Imported) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();
  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' as const },
  };

  function analyze(load: () => Promise<File>) {
    setError('');
    startTransition(async () => {
      try {
        const data = new FormData();
        data.set('csv', await load());
        const result = await analyzeCsv(data);
        if (result.status === 'success') onImported(result);
        else setError(result.message);
      } catch {
        setError('Le serveur ne répond pas. Vérifiez votre connexion, puis réessayez.');
      }
    });
  }

  async function loadExample(): Promise<File> {
    const response = await fetch(EXAMPLE_URL);
    if (!response.ok) throw new Error('Exemple indisponible');
    return new File([await response.blob()], 'exemple-idees-hexavia.csv', { type: 'text/csv' });
  }

  return <>
    <section className="upload-card" aria-labelledby="upload-title">
      <div className="step" aria-hidden="true">1</div>
      <div className="upload-content">
        <h2 id="upload-title">Importer le fichier des idées</h2>
        <p>Utilisez l’export du formulaire tel quel : fichier CSV, séparateur point-virgule, encodage UTF-8.</p>
        <form aria-busy={pending} onSubmit={event => { event.preventDefault(); if (file) analyze(async () => file); }}>
          <label className="file-label" htmlFor="csv">Fichier des idées</label>
          <input id="csv" name="csv" type="file" accept=".csv,text/csv" required disabled={pending} aria-describedby="file-help"
            onChange={event => { setFile(event.target.files?.[0] ?? null); setError(''); }}/>
          <p id="file-help" className="help">2 Mo maximum · de 1 à 1 000 idées · les 11 colonnes de l’export sont attendues.</p>
          <div className="button-row">
            <m.button type="submit" disabled={pending || !file} whileTap={reduceMotion || pending || !file ? undefined : { scale: 0.98 }} transition={{ duration: 0.12 }}>
              {pending ? 'Analyse en cours…' : 'Analyser le fichier'}
            </m.button>
            <button type="button" className="secondary" disabled={pending} onClick={() => analyze(loadExample)}>
              <FileSpreadsheet size={16} aria-hidden="true"/>Essayer avec l’exemple Hexavia
            </button>
          </div>
        </form>
        <p className="privacy">Le fichier est lu pour l’analyse, puis oublié par le serveur. Vos idées et vos notes restent dans ce navigateur. L’exemple contient des données fictives.</p>
      </div>
    </section>
    <AnimatePresence initial={false}>
      {pending && <m.p key="pending" {...reveal} className="message" role="status">Lecture du fichier, vérification des idées et préparation des premières notes…</m.p>}
      {!pending && error && <m.div key="error" {...reveal} className="message error" role="alert">
        <strong>Le fichier n’a pas pu être analysé.</strong>
        <p>{error}</p>
      </m.div>}
    </AnimatePresence>
  </>;
}
