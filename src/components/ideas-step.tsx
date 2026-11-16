'use client';

import { useMemo, useRef, useState } from 'react';
import { NotebookPen, Search } from 'lucide-react';
import type { DuplicatePair } from '../modules/duplicates/detect';
import { averageScore, type Evaluation } from '../modules/evaluations/evaluation';
import { proposalAverage } from '../modules/ai/proposal';
import { NOT_PROVIDED, applyFilters, defaultFilters, distinctValues, hasActiveFilters, type FilterContext, type FilterField, type IdeaFilters } from '../modules/ideas/filter';
import { dismissedIdeas, type Workspace } from '../modules/workspace/workspace';
import { EvaluationPanel } from './evaluation-panel';
import { formatDate, formatScore } from './format';

interface Props {
  workspace: Workspace;
  pairs: DuplicatePair[];
  onEvaluated: (evaluation: Evaluation) => void;
  onOpenDuplicates: () => void;
}

const selects: { field: FilterField; label: string; all: string }[] = [
  { field: 'direction', label: 'Direction', all: 'Toutes les directions' },
  { field: 'theme', label: 'Thème', all: 'Tous les thèmes' },
  { field: 'site', label: 'Site', all: 'Tous les sites' },
];

export function IdeasStep({ workspace, pairs, onEvaluated, onOpenDuplicates }: Props) {
  const { ideas, evaluations, proposals, decisions } = workspace;
  const [filters, setFilters] = useState<IdeaFilters>(defaultFilters);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const opener = useRef<HTMLButtonElement | null>(null);

  const dismissed = useMemo(() => dismissedIdeas(workspace), [workspace]);
  const options = useMemo(() => Object.fromEntries(selects.map(({ field }) => [field, distinctValues(ideas, field)])), [ideas]);
  const pendingPairs = pairs.filter(pair => !decisions[pair.key]);
  const toReview = new Set(pendingPairs.flatMap(pair => [pair.firstId, pair.secondId]));
  const context: FilterContext = {
    score: id => (evaluations[id] ? averageScore(evaluations[id].scores) : null),
    proposal: id => (proposals[id] ? proposalAverage(proposals[id]) : null),
    dismissed: id => dismissed.has(id),
  };
  const visible = applyFilters(ideas, filters, context);
  const evaluatedCount = ideas.filter(idea => evaluations[idea.id]).length;
  const incompleteCount = ideas.filter(idea => idea.warnings.length > 0).length;
  const activeIdea = ideas.find(idea => idea.id === activeId);
  const set = (change: Partial<IdeaFilters>) => setFilters(current => ({ ...current, ...change }));

  return <section aria-labelledby="ideas-title">
    <div className="section-heading">
      <div>
        <h2 id="ideas-title">Toutes les idées</h2>
        <p>Filtrez la liste, ouvrez une idée et notez-la. L’IA propose une première note, que vous corrigez.</p>
      </div>
    </div>

    <div className="summary">
      <div><strong>{ideas.length}</strong><span>idées importées</span></div>
      <div><strong>{evaluatedCount}</strong><span>évaluées sur {ideas.length}</span></div>
      <div><strong>{pendingPairs.length}</strong><span>{pendingPairs.length > 1 ? 'doublons possibles' : 'doublon possible'} à examiner{pendingPairs.length > 0 && <> · <button type="button" className="link-button" onClick={onOpenDuplicates}>Voir</button></>}</span></div>
      <div><strong>{incompleteCount}</strong><span>idées à compléter</span></div>
    </div>

    <form className="filters" role="search" aria-label="Filtrer les idées" onSubmit={event => event.preventDefault()}>
      <label className="filter-search">Rechercher
        <span className="search-field"><Search size={16} aria-hidden="true"/><input type="search" value={filters.search} onChange={event => set({ search: event.target.value })} placeholder="Mot-clé, identifiant, auteur…"/></span>
      </label>
      {selects.map(({ field, label, all }) => <label key={field}>{label}
        <select value={filters[field]} onChange={event => set({ [field]: event.target.value })}>
          <option value="">{all}</option>
          {options[field].map(value => <option key={value} value={value}>{value === NOT_PROVIDED ? 'Non renseigné' : value}</option>)}
        </select>
      </label>)}
      <label>Avancement
        <select value={filters.status} onChange={event => set({ status: event.target.value as IdeaFilters['status'] })}>
          <option value="all">Toutes les idées</option>
          <option value="todo">À évaluer</option>
          <option value="done">Déjà évaluées</option>
        </select>
      </label>
      <label>Trier par
        <select value={filters.sort} onChange={event => set({ sort: event.target.value as IdeaFilters['sort'] })}>
          <option value="file">Ordre du fichier</option>
          <option value="score">Votre note, la meilleure d’abord</option>
          <option value="proposal">Note proposée par l’IA</option>
          <option value="recent">Date de dépôt, la plus récente d’abord</option>
        </select>
      </label>
      {dismissed.size > 0 && <label className="filter-check"><input type="checkbox" checked={filters.hideDismissed} onChange={event => set({ hideDismissed: event.target.checked })}/>Masquer les doublons écartés</label>}
    </form>

    <p className="result-count" role="status">
      {visible.length === ideas.length ? `${ideas.length} idées affichées` : `${visible.length} ${visible.length > 1 ? 'idées affichées' : 'idée affichée'} sur ${ideas.length}`}
      {hasActiveFilters(filters) && <> · <button type="button" className="link-button" onClick={() => setFilters({ ...defaultFilters, sort: filters.sort })}>Réinitialiser les filtres</button></>}
    </p>
    {message && <p className="session-feedback" role="status">{message}</p>}

    {visible.length === 0 ? <div className="empty-state">
      <h3>Aucune idée ne correspond à ces filtres</h3>
      <p>Élargissez la recherche ou revenez à la liste complète.</p>
      <button type="button" className="secondary" onClick={() => setFilters(defaultFilters)}>Afficher toutes les idées</button>
    </div> : <div className="table-wrap" tabIndex={0} role="region" aria-label="Idées et évaluations, tableau à défilement horizontal">
      <table>
        <thead><tr><th scope="col">Idée</th><th scope="col">Direction · thème · site</th><th scope="col">Budget déclaré</th><th scope="col">Note proposée par l’IA</th><th scope="col">Votre évaluation</th></tr></thead>
        <tbody>{visible.map(idea => {
          const evaluation = evaluations[idea.id];
          const proposal = proposals[idea.id];
          const keptId = dismissed.get(idea.id);
          return <tr key={idea.id} className={keptId ? 'is-dismissed' : undefined}>
            <td>
              <small>{idea.id} · <time dateTime={idea.date}>{formatDate(idea.date)}</time></small>
              <strong>{idea.title}</strong>
              {keptId && <span className="tag tag-muted">Écartée · doublon de {keptId}</span>}
              {!keptId && toReview.has(idea.id) && <button type="button" className="tag tag-alert" onClick={onOpenDuplicates}>Doublon possible · examiner</button>}
              <details>
                <summary>Lire la proposition</summary>
                <p className="description">{idea.description}</p>
                <p><b>Bénéfices :</b> {idea.benefits || 'Non renseignés'}</p>
                <p><b>Auteur :</b> {idea.firstName} {idea.lastName}</p>
              </details>
              {idea.warnings.length > 0 && <p className="row-warning">À compléter : {idea.warnings.join(' · ')}</p>}
            </td>
            <td>{idea.direction}<span className="theme">{idea.theme || 'Thème non renseigné'}</span><span className="theme">{idea.site || 'Site non renseigné'}</span></td>
            <td>{idea.budgetRaw || 'Non renseigné'}{idea.budget !== null && <small>Valeur reconnue : {idea.budget.toLocaleString('fr-FR')} €</small>}</td>
            <td>{proposal ? <><span className="proposal-score">{formatScore(proposalAverage(proposal))} / 5</span><small>Simulée · à valider</small></> : <span className="evaluation-pending">Indisponible</span>}</td>
            <td>
              <span className={evaluation ? 'evaluation-score' : 'evaluation-pending'}>{evaluation ? `${formatScore(averageScore(evaluation.scores))} / 5` : 'À évaluer'}</span>
              <button type="button" className="evaluate-button" onClick={event => { opener.current = event.currentTarget; setActiveId(idea.id); setMessage(''); }} aria-label={`${evaluation ? 'Revoir l’évaluation de' : 'Évaluer'} ${idea.title}`}>
                <NotebookPen size={15} aria-hidden="true"/>{evaluation ? 'Revoir' : 'Évaluer'}
              </button>
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>}

    {activeIdea && <EvaluationPanel key={activeIdea.id} idea={activeIdea} proposal={proposals[activeIdea.id]} saved={evaluations[activeIdea.id]} opener={opener}
      onClose={() => setActiveId(null)}
      onValidated={evaluation => { onEvaluated(evaluation); setMessage(`Évaluation de ${evaluation.ideaId} enregistrée dans ce navigateur.`); setActiveId(null); }}/>}
  </section>;
}
