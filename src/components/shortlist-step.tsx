'use client';

import { Download, ListChecks, Printer } from 'lucide-react';
import { challenge } from '../config/challenge';
import { criteria } from '../modules/evaluations/evaluation';
import { rankIdeas, shortlistToCsv, suggestShortlist } from '../modules/shortlist/shortlist';
import { dismissedIdeas, type Workspace } from '../modules/workspace/workspace';
import { formatScore } from './format';

interface Props {
  workspace: Workspace;
  /** Doublons possibles encore sans décision. */
  pendingDuplicates: number;
  onToggle: (ideaId: string) => void;
  onReplace: (ideaIds: string[]) => void;
  onIncludeAuthors: (include: boolean) => void;
  onOpenIdeas: () => void;
  onOpenDuplicates: () => void;
}

export function ShortlistStep({ workspace, pendingDuplicates, onToggle, onReplace, onIncludeAuthors, onOpenIdeas, onOpenDuplicates }: Props) {
  const { ideas, evaluations, shortlist, includeAuthors } = workspace;
  const target = challenge.shortlistTarget;
  const ranked = rankIdeas(ideas, evaluations, dismissedIdeas(workspace));
  const selected = ranked.filter(entry => shortlist.includes(entry.idea.id));
  const today = new Date();

  function suggest() {
    if (selected.length > 0 && !window.confirm('Remplacer votre sélection actuelle par les idées les mieux notées ?')) return;
    onReplace(suggestShortlist(ranked, target));
  }
  function download() {
    const blob = new Blob([shortlistToCsv(selected, { includeAuthors })], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shortlist-${challenge.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${today.toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (ranked.length === 0) return <section aria-labelledby="shortlist-title">
    <div className="section-heading"><div><h2 id="shortlist-title">Shortlist pour le jury</h2></div></div>
    <div className="empty-state">
      <h3>Aucune idée évaluée pour l’instant</h3>
      <p>La shortlist se construit à partir de vos notes. Évaluez quelques idées, puis revenez ici pour choisir celles que vous présenterez au jury.</p>
      <button type="button" onClick={onOpenIdeas}>Évaluer les idées</button>
    </div>
  </section>;

  return <section aria-labelledby="shortlist-title">
    <div className="section-heading no-print">
      <div>
        <h2 id="shortlist-title">Shortlist pour le jury</h2>
        <p>Cochez les idées à présenter, ou partez des mieux notées. Le document en bas de page est celui que vous envoyez au client.</p>
      </div>
      <span className="badge">{selected.length} retenue{selected.length > 1 ? 's' : ''} · objectif : environ {target}</span>
    </div>

    {ranked.length < ideas.length && <p className="session-note no-print">Le classement porte sur les {ranked.length} idée{ranked.length > 1 ? 's' : ''} déjà évaluée{ranked.length > 1 ? 's' : ''}, hors doublons écartés, sur {ideas.length} importées.</p>}

    {pendingDuplicates > 0 && <p className="session-note no-print">{pendingDuplicates > 1 ? `${pendingDuplicates} doublons possibles restent` : 'Un doublon possible reste'} à examiner : deux idées proches pourraient se retrouver ensemble devant le jury. <button type="button" className="link-button" onClick={onOpenDuplicates}>Examiner les doublons</button></p>}

    <div className="button-row no-print">
      <button type="button" className="secondary" onClick={suggest}><ListChecks size={16} aria-hidden="true"/>Proposer les {Math.min(target, ranked.length)} mieux notées</button>
    </div>

    <div className="table-wrap no-print" tabIndex={0} role="region" aria-label="Classement des idées évaluées, tableau à défilement horizontal">
      <table className="ranking">
        <thead><tr><th scope="col">Retenir</th><th scope="col">Rang</th><th scope="col">Idée</th>{criteria.map(criterion => <th key={criterion.key} scope="col">{criterion.label}</th>)}<th scope="col">Moyenne</th></tr></thead>
        <tbody>{ranked.map(({ rank, idea, evaluation, average }) => {
          const checked = shortlist.includes(idea.id);
          return <tr key={idea.id} className={checked ? 'is-selected' : undefined}>
            <td><input type="checkbox" checked={checked} onChange={() => onToggle(idea.id)} aria-label={`Retenir ${idea.title} pour le jury`}/></td>
            <td>{rank}</td>
            <td><small>{idea.id} · {idea.direction}</small><strong>{idea.title}</strong></td>
            {criteria.map(criterion => <td key={criterion.key}>{evaluation.scores[criterion.key]}</td>)}
            <td><span className="evaluation-score">{formatScore(average)} / 5</span></td>
          </tr>;
        })}</tbody>
      </table>
    </div>

    <div className="export-bar no-print">
      <div>
        <h3>Envoyer au client</h3>
        <label className="filter-check"><input type="checkbox" checked={includeAuthors} onChange={event => onIncludeAuthors(event.target.checked)}/>Inclure le nom des auteurs dans le document et le fichier</label>
      </div>
      <div className="button-row">
        <button type="button" disabled={selected.length === 0} onClick={() => window.print()}><Printer size={16} aria-hidden="true"/>Imprimer ou enregistrer en PDF</button>
        <button type="button" className="secondary" disabled={selected.length === 0} onClick={download}><Download size={16} aria-hidden="true"/>Télécharger pour Excel (CSV)</button>
      </div>
    </div>

    {selected.length === 0 ? <div className="empty-state no-print">
      <h3>Aucune idée retenue</h3>
      <p>Cochez des idées dans le classement ci-dessus : le document à envoyer apparaîtra ici.</p>
    </div> : <article className="jury-document" aria-label="Document à envoyer au client">
      <header>
        <p className="eyebrow">CHALLENGE INNOVATION · {challenge.clientName.toUpperCase()}</p>
        <h2>Shortlist proposée au jury</h2>
        <p>{selected.length} idée{selected.length > 1 ? 's' : ''} · établie le {today.toLocaleDateString('fr-FR')} · notes de 1 à 5, moyenne à poids égaux des quatre critères.</p>
      </header>
      <ol>{selected.map(({ idea, evaluation, average }, index) => <li key={idea.id}>
        <div className="jury-title">
          <h3><span>{index + 1}.</span> {idea.title}</h3>
          <strong>{formatScore(average)} / 5</strong>
        </div>
        <p className="duplicate-meta">{[idea.id, idea.direction, idea.site, idea.theme, includeAuthors ? `${idea.firstName} ${idea.lastName}`.trim() : ''].filter(Boolean).join(' · ')}</p>
        <p className="description">{idea.description}</p>
        <dl>
          <div><dt>Bénéfices attendus</dt><dd>{idea.benefits || 'Non renseignés'}</dd></div>
          <div><dt>Budget déclaré</dt><dd>{idea.budgetRaw || 'Non renseigné'}</dd></div>
          <div><dt>Notes</dt><dd>{criteria.map(criterion => `${criterion.label} ${evaluation.scores[criterion.key]}`).join(' · ')}</dd></div>
          {evaluation.comment && <div><dt>Avis de la consultante</dt><dd>{evaluation.comment}</dd></div>}
        </dl>
      </li>)}</ol>
    </article>}
  </section>;
}
