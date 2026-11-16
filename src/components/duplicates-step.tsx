'use client';

import { RotateCcw } from 'lucide-react';
import type { DuplicatePair } from '../modules/duplicates/detect';
import type { Idea } from '../modules/ideas/idea';
import type { DuplicateDecision, Workspace } from '../modules/workspace/workspace';
import { formatDate } from './format';

interface Props {
  workspace: Workspace;
  pairs: DuplicatePair[];
  onDecide: (pairKey: string, decision: DuplicateDecision | null) => void;
}

function IdeaCard({ idea }: { idea: Idea }) {
  return <article className="duplicate-idea">
    <small>{idea.id} · déposée le {formatDate(idea.date)}</small>
    <h4>{idea.title}</h4>
    <p className="duplicate-meta">{idea.firstName} {idea.lastName} · {idea.direction} · {idea.site || 'site non renseigné'}</p>
    <p className="description">{idea.description}</p>
    <p><b>Bénéfices :</b> {idea.benefits || 'non renseignés'}</p>
    <p><b>Budget déclaré :</b> {idea.budgetRaw || 'non renseigné'}</p>
  </article>;
}

export function DuplicatesStep({ workspace, pairs, onDecide }: Props) {
  const byId = new Map(workspace.ideas.map(idea => [idea.id, idea]));
  const pending = pairs.filter(pair => !workspace.decisions[pair.key]);
  const decided = pairs.filter(pair => workspace.decisions[pair.key]);

  return <section aria-labelledby="duplicates-title">
    <div className="section-heading">
      <div>
        <h2 id="duplicates-title">Doublons possibles</h2>
        <p>L’outil rapproche les idées qui emploient les mêmes mots. Il peut se tromper : c’est vous qui décidez. Une idée écartée n’est jamais supprimée, elle sort seulement du classement et de la shortlist.</p>
      </div>
      <span className="badge">{pending.length} à examiner</span>
    </div>

    {pairs.length === 0 && <div className="empty-state">
      <h3>Aucun doublon possible dans ce fichier</h3>
      <p>Aucune idée ne ressemble assez à une autre pour être signalée. Deux idées formulées avec des mots très différents peuvent toutefois échapper à ce repérage.</p>
    </div>}
    {pairs.length > 0 && pending.length === 0 && <p className="message" role="status">Toutes les suggestions ont été examinées. Vous pouvez revenir sur une décision ci-dessous.</p>}

    {pending.map(pair => {
      const first = byId.get(pair.firstId)!, second = byId.get(pair.secondId)!;
      return <article key={pair.key} className="duplicate-pair" aria-label={`${first.id} et ${second.id}`}>
        <header>
          <span className={pair.kind === 'exact' ? 'tag tag-alert' : 'tag'}>{pair.kind === 'exact' ? 'Contenu identique' : `Idées proches · ${Math.round(pair.similarity * 100)} %`}</span>
          {pair.kind === 'similar' && pair.sharedTerms.length > 0 && <span className="shared-terms">Mots en commun : {pair.sharedTerms.join(', ')}</span>}
        </header>
        <div className="duplicate-columns"><IdeaCard idea={first}/><IdeaCard idea={second}/></div>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => onDecide(pair.key, { status: 'duplicate', keptId: first.id, dismissedId: second.id })}>Garder {first.id}, écarter {second.id}</button>
          <button type="button" className="secondary" onClick={() => onDecide(pair.key, { status: 'duplicate', keptId: second.id, dismissedId: first.id })}>Garder {second.id}, écarter {first.id}</button>
          <button type="button" className="secondary" onClick={() => onDecide(pair.key, { status: 'distinct' })}>Ce sont deux idées distinctes</button>
        </div>
      </article>;
    })}

    {decided.length > 0 && <>
      <h3 className="subheading">Décisions prises</h3>
      <ul className="decision-list">{decided.map(pair => {
        const decision = workspace.decisions[pair.key];
        return <li key={pair.key}>
          <span>{decision.status === 'duplicate'
            ? <><b>{decision.dismissedId}</b> écartée comme doublon de <b>{decision.keptId}</b> ({byId.get(decision.keptId)?.title})</>
            : <><b>{pair.firstId}</b> et <b>{pair.secondId}</b> conservées comme deux idées distinctes</>}</span>
          <button type="button" className="link-button" onClick={() => onDecide(pair.key, null)}><RotateCcw size={13} aria-hidden="true"/>Annuler</button>
        </li>;
      })}</ul>
    </>}
  </section>;
}
