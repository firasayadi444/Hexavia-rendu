'use client';

import { useState, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Info, NotebookPen, Sparkles, X } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import type { Idea } from '../modules/ideas/idea';
import type { Proposal } from '../modules/ai/proposal';
import { averageScore, criteria, scoresSchema, type Evaluation, type ScoreKey, type Scores } from '../modules/evaluations/evaluation';
import { validateEvaluation } from '../modules/evaluations/validate-evaluation';
import { formatScore } from './format';

interface Props {
  idea: Idea;
  proposal?: Proposal;
  saved?: Evaluation;
  opener: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onValidated: (evaluation: Evaluation) => void;
}

export function EvaluationPanel({ idea, proposal, saved, opener, onClose, onValidated }: Props) {
  // Aucune note n'est préremplie : la proposition de l'IA s'affiche à côté, la consultante choisit de la reprendre ou non.
  const [scores, setScores] = useState<Partial<Scores>>(saved?.scores ?? {});
  const [comment, setComment] = useState(saved?.comment ?? '');
  const [error, setError] = useState('');
  const reduceMotion = useReducedMotion();
  const completed = criteria.filter(criterion => scores[criterion.key] !== undefined).length;
  const parsedScores = scoresSchema.safeParse(scores);
  const dirty = comment !== (saved?.comment ?? '') || criteria.some(criterion => scores[criterion.key] !== saved?.scores[criterion.key]);
  const status = dirty ? 'Modifications non enregistrées' : saved ? 'Évaluation enregistrée dans ce navigateur' : 'Aucune note attribuée';

  function close() {
    if (!dirty || window.confirm('Fermer sans enregistrer vos modifications ?')) onClose();
  }
  function rate(key: ScoreKey, value: number) {
    setScores(previous => ({ ...previous, [key]: value }));
    setError('');
  }
  function submit() {
    const result = validateEvaluation({ ideaId: idea.id, scores, comment });
    if (result.success) onValidated(result.evaluation);
    else setError(result.message);
  }

  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay asChild>
        <m.div className="panel-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}/>
      </Dialog.Overlay>
      <Dialog.Content asChild
        onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}
        onOpenAutoFocus={event => { event.preventDefault(); document.getElementById('evaluation-heading')?.focus(); }}>
        <m.aside className="evaluation-panel" initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}>
          <header className="panel-heading">
            <div>
              <p className="eyebrow">ÉVALUER UNE IDÉE · {idea.id}</p>
              <Dialog.Title id="evaluation-heading" tabIndex={-1}>{idea.title}</Dialog.Title>
            </div>
            <button type="button" className="icon-button" onClick={close} aria-label="Fermer l’évaluation"><X size={20} aria-hidden="true"/></button>
          </header>
          <Dialog.Description className="panel-description">Relisez la proposition, puis attribuez les quatre notes. L’IA suggère, vous décidez.</Dialog.Description>
          <form className="evaluation-form" onSubmit={event => { event.preventDefault(); submit(); }}>
            <div className="panel-body">
              <section className="idea-context" aria-labelledby="proposal-title">
                <div className="context-tags"><span>{idea.direction}</span><span>{idea.theme || 'Thème non renseigné'}</span><span>{idea.site || 'Site non renseigné'}</span></div>
                <h3 id="proposal-title">La proposition</h3>
                <p className="description">{idea.description}</p>
                <dl>
                  <div><dt>Bénéfices attendus</dt><dd>{idea.benefits || 'À préciser avec l’auteur'}</dd></div>
                  <div><dt>Budget déclaré</dt><dd>{idea.budgetRaw || 'Non renseigné'}</dd></div>
                </dl>
                {idea.warnings.length > 0 && <p className="quality-note">À préciser : {idea.warnings.join(' · ')}.</p>}
              </section>

              <section className="rating-section" aria-labelledby="rating-title">
                <div className="rating-heading">
                  <h3 id="rating-title"><NotebookPen size={18} aria-hidden="true"/> Votre évaluation</h3>
                  <span className="rating-progress">{completed}/4 critères</span>
                </div>
                <p className="rating-explanation">Les quatre critères ont le même poids. Les repères sont proposés pour ce prototype et restent à confirmer avec le client.</p>

                {proposal && <div className="ai-proposal">
                  <Sparkles size={18} aria-hidden="true"/>
                  <div>
                    <strong>Première note proposée par l’IA : {formatScore(averageScore(proposal.scores))} / 5</strong>
                    <p>Proposition simulée par des règles simples, sans modèle. Reprenez-la, puis corrigez chaque note : rien n’est enregistré sans votre validation.</p>
                    {proposal.reserves.length > 0 && <p>Réserves : {proposal.reserves.join(', ')}.</p>}
                    <button type="button" className="secondary small" onClick={() => { setScores(proposal.scores); setError(''); }}>Reprendre les quatre notes proposées</button>
                  </div>
                </div>}

                <div className="strategy-note"><Info size={17} aria-hidden="true"/><p>La stratégie du client n’est pas fournie. Précisez votre hypothèse dans le commentaire avant d’évaluer l’alignement.</p></div>

                {criteria.map(criterion => <fieldset key={criterion.key} className="criterion">
                  <legend>{criterion.label}</legend>
                  <p id={`${criterion.key}-help`} className="criterion-question">{criterion.question}</p>
                  {proposal && <p className="ai-hint"><span className="ai-chip">IA · {proposal.scores[criterion.key]}/5</span>{proposal.justifications[criterion.key]}</p>}
                  <div className="rating-options" aria-describedby={`${criterion.key}-help`}>
                    {[1, 2, 3, 4, 5].map(value => <label key={value} className={[scores[criterion.key] === value ? 'is-selected' : '', proposal?.scores[criterion.key] === value ? 'is-suggested' : ''].join(' ')}>
                      <input type="radio" name={criterion.key} value={value} checked={scores[criterion.key] === value} required onChange={() => rate(criterion.key, value)} aria-label={`${criterion.label} : ${value} sur 5`}/>
                      <span>{value}</span>
                    </label>)}
                  </div>
                  <details className="rating-guide">
                    <summary>Repères pour noter ce critère</summary>
                    <dl>{criterion.anchors.map(anchor => <div key={anchor.value}><dt>{anchor.value}/5</dt><dd>{anchor.description}</dd></div>)}</dl>
                    <p>2 et 4 correspondent aux niveaux intermédiaires. Une information absente appelle une réserve, pas automatiquement une mauvaise note.</p>
                  </details>
                </fieldset>)}

                <label className="comment-label" htmlFor="evaluation-comment">Votre raisonnement et vos réserves
                  <textarea id="evaluation-comment" value={comment} maxLength={2000} rows={4} onChange={event => { setComment(event.target.value); setError(''); }} placeholder="Quels bénéfices retenez-vous ? Quelles hypothèses ou vérifications restent nécessaires ?"/>
                  <span>{comment.length}/2 000 caractères · facultatif · repris dans la shortlist</span>
                </label>
              </section>
              {error && <p className="message error" role="alert">{error}</p>}
            </div>
            <div className="panel-footer">
              <div className="rating-total">
                <span>Moyenne des quatre critères</span>
                <strong>{parsedScores.success ? formatScore(averageScore(parsedScores.data)) : '—'}<small> / 5</small></strong>
              </div>
              <div className="validation-status" role="status">{status}</div>
              <button type="submit" disabled={!parsedScores.success || (Boolean(saved) && !dirty)}><Check size={18} aria-hidden="true"/>Enregistrer l’évaluation</button>
            </div>
          </form>
        </m.aside>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
