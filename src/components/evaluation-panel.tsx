'use client';

import { useState, useTransition, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Info, NotebookPen, X } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import type { Idea } from '../modules/ideas/idea';
import { averageScore, criteria, scoresSchema, type Evaluation, type ScoreKey, type Scores } from '../modules/evaluations/evaluation';
import { confirmSessionEvaluation } from '../app/evaluation-actions';

interface Props {
  idea: Idea;
  saved?: Evaluation;
  opener: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onValidated: (evaluation: Evaluation) => void;
}

export function EvaluationPanel({ idea, saved, opener, onClose, onValidated }: Props) {
  const [scores, setScores] = useState<Partial<Scores>>(saved?.scores ?? {});
  const [comment, setComment] = useState(saved?.comment ?? '');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();
  const completed = criteria.filter(c => scores[c.key] !== undefined).length;
  const parsedScores = scoresSchema.safeParse(scores);
  const dirty = comment !== (saved?.comment ?? '') || criteria.some(c => scores[c.key] !== saved?.scores[c.key]);
  const status = dirty ? 'Modifications non validées' : saved ? 'Validée dans cette page uniquement' : 'Aucune note attribuée';

  function close() {
    if (pending) return;
    if (!dirty || window.confirm('Fermer sans conserver vos modifications ?')) onClose();
  }
  function rate(key: ScoreKey, value: number) {
    setScores(previous => ({ ...previous, [key]: value })); setError('');
  }

  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay asChild><m.div className="panel-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}/></Dialog.Overlay>
      <Dialog.Content asChild onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }} onOpenAutoFocus={event => { event.preventDefault(); document.getElementById('evaluation-heading')?.focus(); }}>
        <m.aside className="evaluation-panel" initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}>
          <header className="panel-heading"><div><p className="eyebrow">ÉVALUER UNE IDÉE · {idea.id}</p><Dialog.Title id="evaluation-heading" tabIndex={-1}>{idea.title}</Dialog.Title></div><button type="button" className="icon-button" onClick={close} disabled={pending} aria-label="Fermer l’évaluation"><X size={20} aria-hidden="true"/></button></header>
          <Dialog.Description className="panel-description">Relisez la proposition, puis attribuez les quatre notes. Votre évaluation reste dans cette page jusqu’à son actualisation.</Dialog.Description>
          <form className="evaluation-form" aria-busy={pending} onSubmit={event => {
            event.preventDefault(); setError('');
            startTransition(async () => {
              try {
                const result = await confirmSessionEvaluation({ ideaId: idea.id, scores, comment });
                if (!result.success) { setError(result.message); return; }
                onValidated(result.evaluation);
              } catch { setError('La validation est indisponible. Vos notes restent dans le panneau ; réessayez.'); }
            });
          }}>
            <div className="panel-body">
              <section className="idea-context" aria-labelledby="proposal-title"><div className="context-tags"><span>{idea.direction}</span><span>{idea.theme || 'Thème non renseigné'}</span></div><h3 id="proposal-title">La proposition</h3><p className="description">{idea.description}</p><dl><div><dt>Bénéfices attendus</dt><dd>{idea.benefits || 'À préciser avec l’auteur'}</dd></div><div><dt>Budget déclaré</dt><dd>{idea.budgetRaw || 'Non renseigné'}</dd></div></dl>{idea.warnings.length > 0 && <p className="quality-note">À préciser : {idea.warnings.join(' · ')}.</p>}</section>
              <section className="rating-section" aria-labelledby="rating-title"><div className="rating-heading"><h3 id="rating-title"><NotebookPen size={18} aria-hidden="true"/> Votre évaluation</h3><span className="rating-progress">{completed}/4 critères</span></div><p className="rating-explanation">Les quatre critères ont le même poids. Les repères ci-dessous sont proposés pour ce prototype et restent à confirmer avec le client.</p>
                <div className="strategy-note"><Info size={17} aria-hidden="true"/><p>La stratégie d’Hexavia n’est pas fournie. Précisez votre hypothèse dans le commentaire avant d’évaluer l’alignement.</p></div>
                {criteria.map(criterion => <fieldset key={criterion.key} className="criterion" disabled={pending}><legend>{criterion.label}</legend><p id={`${criterion.key}-help`} className="criterion-question">{criterion.question}</p><div className="rating-options" aria-describedby={`${criterion.key}-help`}>{[1, 2, 3, 4, 5].map(value => <label key={value} className={scores[criterion.key] === value ? 'is-selected' : ''}><input type="radio" name={criterion.key} value={value} checked={scores[criterion.key] === value} required onChange={() => rate(criterion.key, value)} aria-label={`${criterion.label} : ${value} sur 5`}/><span>{value}</span></label>)}</div><details className="rating-guide"><summary>Repères pour noter ce critère</summary><dl>{criterion.anchors.map(anchor => <div key={anchor.value}><dt>{anchor.value}/5</dt><dd>{anchor.description}</dd></div>)}</dl><p>2 et 4 correspondent aux niveaux intermédiaires. Une information absente appelle une réserve, pas automatiquement une mauvaise note.</p></details></fieldset>)}
                <label className="comment-label" htmlFor="evaluation-comment">Votre raisonnement et vos réserves<textarea id="evaluation-comment" value={comment} maxLength={2000} rows={4} disabled={pending} onChange={event => { setComment(event.target.value); setError(''); }} placeholder="Quels bénéfices retenez-vous ? Quelles hypothèses ou vérifications restent nécessaires ?"/><span>{comment.length}/2 000 caractères · facultatif</span></label>
              </section>
              {error && <p className="message error" role="alert">{error}</p>}
            </div>
            <div className="panel-footer"><div className="rating-total"><span>Moyenne des quatre critères</span><strong>{parsedScores.success ? averageScore(parsedScores.data).toLocaleString('fr-FR') : '—'}<small> / 5</small></strong></div><div className="validation-status" role="status">{status}</div><button type="submit" disabled={pending || !parsedScores.success || (Boolean(saved) && !dirty)}><Check size={18} aria-hidden="true"/>{pending ? 'Validation…' : 'Valider pour cette session'}</button><p>Aucune sauvegarde en base à cette étape.</p></div>
          </form>
        </m.aside>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
