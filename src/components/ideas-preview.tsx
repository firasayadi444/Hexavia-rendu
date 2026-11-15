'use client';

import { useRef, useState } from 'react';
import { CheckCheck, NotebookPen } from 'lucide-react';
import type { Idea } from '../modules/ideas/idea';
import { averageScore, type Evaluation } from '../modules/evaluations/evaluation';
import { EvaluationPanel } from './evaluation-panel';

interface Props { ideas: Idea[]; onEvaluationCountChange: (count: number) => void }

export function IdeasPreview({ ideas, onEvaluationCountChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState(() => new Map<string, Evaluation>());
  const [message, setMessage] = useState('');
  const opener = useRef<HTMLButtonElement | null>(null);
  const activeIdea = ideas.find(idea => idea.id === activeId);
  const count = evaluations.size;

  return <>
    <div className="evaluation-overview"><div><h3>Commencer l’évaluation</h3><p>Ouvrez une idée pour la noter sans quitter votre liste.</p></div><span className="badge"><CheckCheck size={15} aria-hidden="true"/> {count}/{ideas.length} évaluées</span></div>
    <p className="session-note">Les évaluations sont conservées dans cette page uniquement. Une actualisation ou un changement de fichier les efface.</p>
    {message && <p className="session-feedback" role="status">{message}</p>}
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Idées et évaluations, tableau à défilement horizontal"><table><thead><tr><th scope="col">Idée</th><th scope="col">Direction / thème</th><th scope="col">Budget déclaré</th><th scope="col">Qualité des données</th><th scope="col">Évaluation</th></tr></thead><tbody>{ideas.map(idea => {
      const evaluation = evaluations.get(idea.id);
      return <tr key={idea.id}>
        <td><small>{idea.id} · <time dateTime={idea.date}>{idea.date.split('-').reverse().join('/')}</time></small><strong>{idea.title}</strong><details><summary>Lire la proposition</summary><p className="description">{idea.description}</p><p><b>Bénéfices :</b> {idea.benefits || 'Non renseignés'}</p><p><b>Auteur :</b> {idea.firstName} {idea.lastName} · {idea.site || 'Site non renseigné'}</p></details></td>
        <td>{idea.direction}<span className="theme">{idea.theme || 'Thème non renseigné'}</span></td>
        <td>{idea.budgetRaw || 'Non renseigné'}{idea.budget !== null && <small>Valeur reconnue : {idea.budget.toLocaleString('fr-FR')} €</small>}</td>
        <td>{idea.warnings.length ? <ul className="warnings">{idea.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul> : <span className="complete">Informations renseignées</span>}</td>
        <td><span className={evaluation ? 'evaluation-score' : 'evaluation-pending'}>{evaluation ? `${averageScore(evaluation.scores).toLocaleString('fr-FR')} / 5` : 'À évaluer'}</span>{evaluation && <small>Validée · session</small>}<button type="button" className="evaluate-button" onClick={event => { opener.current = event.currentTarget; setActiveId(idea.id); setMessage(''); }} aria-label={`${evaluation ? 'Revoir l’évaluation de' : 'Évaluer'} ${idea.title}`}><NotebookPen size={15} aria-hidden="true"/>{evaluation ? 'Revoir' : 'Évaluer'}</button></td>
      </tr>;
    })}</tbody></table></div>
    {activeIdea && <EvaluationPanel key={activeIdea.id} idea={activeIdea} saved={evaluations.get(activeIdea.id)} opener={opener} onClose={() => setActiveId(null)} onValidated={evaluation => {
      const updated = new Map(evaluations).set(evaluation.ideaId, evaluation);
      setEvaluations(updated); onEvaluationCountChange(updated.size);
      setMessage(`Évaluation de ${evaluation.ideaId} validée pour cette session. Elle n’est pas encore enregistrée en base.`);
      setActiveId(null);
    }}/>}
  </>;
}
