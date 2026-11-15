'use client';
import { useActionState, useEffect, useState } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { analyzeCsv } from './actions';
import type { ImportState } from '../modules/ideas/preview-import';
import { IdeasPreview } from '../components/ideas-preview';

const initialState: ImportState = { status: 'idle' };
export function ImportForm() {
  const [state, action, pending] = useActionState(analyzeCsv, initialState);
  const [filename, setFilename] = useState('');
  const [changed, setChanged] = useState(false);
  const [evaluationCount, setEvaluationCount] = useState(0);
  useEffect(() => {
    if (!evaluationCount) return;
    const warnOnLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warnOnLeave);
    return () => window.removeEventListener('beforeunload', warnOnLeave);
  }, [evaluationCount]);
  const result = !changed && state.status === 'success' ? state : null;
  const reduceMotion = useReducedMotion();
  // Les animations concernent les blocs, jamais chaque ligne du tableau.
  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' as const },
  };
  return <LazyMotion features={domAnimation} strict>
    <section className="upload-card" aria-labelledby="upload-title"><div className="step">1</div><div className="upload-content"><h2 id="upload-title">Vérifier le fichier CSV</h2><p>Utilisez l’export du formulaire : séparateur point-virgule, encodage UTF-8.</p>
      <form action={action} aria-busy={pending} onSubmit={() => { setChanged(false); setFilename(''); }}>
        <label className="file-label" htmlFor="csv">Fichier des idées</label>
        <input id="csv" name="csv" type="file" accept=".csv,text/csv" required disabled={pending} aria-describedby="file-help" onChange={e => {
          if (evaluationCount && !window.confirm('Changer de fichier effacera les évaluations de cette page. Continuer ?')) { e.target.value = ''; setFilename(''); return; }
          setFilename(e.target.files?.[0]?.name ?? ''); setChanged(true); setEvaluationCount(0);
        }}/>
        <p id="file-help" className="help">2 Mo maximum · de 1 à 1 000 idées · les 11 colonnes de l’export sont attendues.</p>
        <m.button type="submit" disabled={pending || !filename} whileTap={reduceMotion || pending || !filename ? undefined : { scale: 0.98 }} transition={{ duration: 0.12 }}>{pending ? 'Analyse en cours…' : 'Analyser le fichier'}<span aria-hidden="true">→</span></m.button>
      </form><p className="privacy">Le fichier est analysé pour cet aperçu. Aucune idée n’est encore enregistrée en base.</p>
    </div></section>
    <AnimatePresence initial={false}>
    {pending && <m.p key="pending" {...reveal} className="message" role="status">Lecture du fichier et vérification des idées…</m.p>}
    {!pending && !changed && state.status === 'error' && <m.div key="error" {...reveal} className="message error" role="alert"><strong>Le fichier n’a pas pu être analysé.</strong><p>{state.message}</p></m.div>}
    {!pending && result && <m.section key={result.previewId} {...reveal} className="preview" aria-labelledby="preview-title"><div className="preview-heading"><div><p className="eyebrow">VOTRE FICHIER EST LISIBLE</p><h2 id="preview-title">Aperçu des idées</h2><p className="filename">{result.filename}</p></div><span className="badge">Aperçu · non enregistré</span></div>
      <div className="summary" role="status"><div><strong>{result.ideas.length}</strong><span>idées reconnues</span></div><div><strong>{result.incomplete}</strong><span>idées à compléter</span></div><div><strong>{result.ideas.filter(i => i.budget === null).length}</strong><span>budgets à préciser</span></div></div>
      <p className="explanation">Les informations manquantes restent visibles. Un budget inconnu n’est jamais remplacé par zéro.</p>
      <IdeasPreview ideas={result.ideas} onEvaluationCountChange={setEvaluationCount}/>
    </m.section>}
    </AnimatePresence>
  </LazyMotion>;
}
