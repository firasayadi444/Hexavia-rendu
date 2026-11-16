'use client';
import { useMemo, useState } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { challenge } from '../config/challenge';
import { findDuplicatePairs } from '../modules/duplicates/detect';
import { createWorkspace, decideDuplicate, dismissedIdeas, saveEvaluation, toggleShortlisted } from '../modules/workspace/workspace';
import { rankIdeas } from '../modules/shortlist/shortlist';
import { DuplicatesStep } from '../components/duplicates-step';
import { IdeasStep } from '../components/ideas-step';
import { ShortlistStep } from '../components/shortlist-step';
import { ImportForm } from './import-form';
import { useWorkspace } from './use-workspace';

type StepKey = 'ideas' | 'duplicates' | 'shortlist';

export function WorkspaceApp() {
  const { ready, workspace, storageFailed, open, update, clear } = useWorkspace();
  const [step, setStep] = useState<StepKey>('ideas');
  const ideas = workspace?.ideas;
  // Le repérage des doublons ne dépend que des idées : il n'est recalculé qu'à l'import.
  const pairs = useMemo(() => (ideas ? findDuplicatePairs(ideas) : []), [ideas]);

  if (!ready) return <p className="message" role="status">Chargement de votre travail…</p>;

  if (!workspace) return <LazyMotion features={domAnimation} strict>
    <section className="intro">
      <p className="eyebrow">CHALLENGE INNOVATION · {challenge.clientName.toUpperCase()}</p>
      <h1>Des idées déposées à la shortlist du jury.</h1>
      <p>Importez l’export du formulaire, notez chaque idée sur la grille du client avec l’aide de l’IA, écartez les doublons et préparez le document à envoyer.</p>
    </section>
    <ImportForm onImported={result => { open(createWorkspace(result.filename, result.ideas, result.proposals)); setStep('ideas'); }}/>
  </LazyMotion>;

  const evaluated = workspace.ideas.filter(idea => workspace.evaluations[idea.id]).length;
  const pendingPairs = pairs.filter(pair => !workspace.decisions[pair.key]).length;
  const shortlisted = rankIdeas(workspace.ideas, workspace.evaluations, dismissedIdeas(workspace)).filter(entry => workspace.shortlist.includes(entry.idea.id)).length;
  const steps: { key: StepKey; label: string; detail: string }[] = [
    { key: 'ideas', label: 'Idées', detail: `${evaluated}/${workspace.ideas.length} évaluées` },
    { key: 'duplicates', label: 'Doublons', detail: `${pendingPairs} à examiner` },
    { key: 'shortlist', label: 'Shortlist', detail: `${shortlisted} retenue${shortlisted > 1 ? 's' : ''}` },
  ];

  function changeFile() {
    if (window.confirm('Importer un autre fichier effacera de ce navigateur les idées, vos notes et votre shortlist. Continuer ?')) clear();
  }

  return <LazyMotion features={domAnimation} strict>
    <section className="workspace-bar no-print">
      <div>
        <p className="eyebrow">CHALLENGE EN COURS</p>
        <p className="filename">{workspace.filename} · {workspace.ideas.length} idées · importé le {new Date(workspace.importedAt).toLocaleDateString('fr-FR')}</p>
      </div>
      <button type="button" className="secondary small" onClick={changeFile}>Importer un autre fichier</button>
    </section>

    {storageFailed && <p className="message error no-print" role="alert">Ce navigateur refuse l’enregistrement local : votre travail sera perdu à la fermeture de la page. Désactivez la navigation privée ou exportez votre shortlist avant de quitter.</p>}

    <nav className="steps no-print" aria-label="Étapes du dépouillement">
      {steps.map((item, index) => <button key={item.key} type="button" className={item.key === step ? 'is-current' : ''} aria-current={item.key === step ? 'step' : undefined} onClick={() => setStep(item.key)}>
        <span className="step-number" aria-hidden="true">{index + 1}</span>
        <span><strong>{item.label}</strong><small>{item.detail}</small></span>
      </button>)}
    </nav>

    {step === 'ideas' && <IdeasStep workspace={workspace} pairs={pairs} onEvaluated={evaluation => update(current => saveEvaluation(current, evaluation))} onOpenDuplicates={() => setStep('duplicates')}/>}
    {step === 'duplicates' && <DuplicatesStep workspace={workspace} pairs={pairs} onDecide={(key, decision) => update(current => decideDuplicate(current, key, decision))}/>}
    {step === 'shortlist' && <ShortlistStep workspace={workspace} pendingDuplicates={pendingPairs}
      onToggle={ideaId => update(current => toggleShortlisted(current, ideaId))}
      onReplace={ideaIds => update(current => ({ ...current, shortlist: ideaIds }))}
      onIncludeAuthors={includeAuthors => update(current => ({ ...current, includeAuthors }))}
      onOpenIdeas={() => setStep('ideas')} onOpenDuplicates={() => setStep('duplicates')}/>}
  </LazyMotion>;
}
