import { z } from 'zod';
import type { Idea } from '../ideas/idea';
import { evaluationSchema, type Evaluation } from '../evaluations/evaluation';
import { proposalSchema, type Proposal } from '../ai/proposal';

// L'espace de travail : tout ce que la consultante a produit sur un fichier d'idées.
// V1 : il est conservé dans le navigateur. Ce module ne connaît ni React ni localStorage,
// pour que le passage à une base de données ne change que l'endroit où on le lit et l'écrit.

const text = z.string().max(25_000);
const ideaSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  date: text, dateRaw: text, firstName: text, lastName: text, direction: text, site: text, theme: text,
  title: text, description: text, benefits: text, budgetRaw: text,
  budget: z.number().nullable(),
  warnings: z.array(text),
});

const decisionSchema = z.discriminatedUnion('status', [
  // Les deux idées sont distinctes : la suggestion est classée.
  z.object({ status: z.literal('distinct') }),
  // L'une est écartée comme doublon de l'autre. Elle n'est jamais supprimée.
  z.object({ status: z.literal('duplicate'), keptId: z.string(), dismissedId: z.string() }),
]);
export type DuplicateDecision = z.infer<typeof decisionSchema>;

const workspaceSchema = z.object({
  version: z.literal(1),
  filename: z.string().max(300),
  importedAt: z.string(),
  ideas: z.array(ideaSchema).min(1).max(1000),
  proposals: z.record(z.string(), proposalSchema),
  evaluations: z.record(z.string(), evaluationSchema.extend({ validatedAt: z.string() })),
  /** Décisions sur les doublons possibles, par clé de paire (voir pairKey). */
  decisions: z.record(z.string(), decisionSchema),
  shortlist: z.array(z.string()),
  includeAuthors: z.boolean(),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export function createWorkspace(filename: string, ideas: Idea[], proposals: Proposal[], now = new Date()): Workspace {
  return {
    version: 1, filename, importedAt: now.toISOString(), ideas,
    proposals: Object.fromEntries(proposals.map(proposal => [proposal.ideaId, proposal])),
    evaluations: {}, decisions: {}, shortlist: [],
    // Par défaut, le document envoyé au client ne contient pas de nom.
    includeAuthors: false,
  };
}

/** Relit un espace de travail enregistré. Un contenu illisible ou d'un autre format donne `null`, jamais une erreur. */
export function parseWorkspace(raw: string | null): Workspace | null {
  if (!raw) return null;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return null; }
  const result = workspaceSchema.safeParse(data);
  if (!result.success) return null;
  const workspace = result.data;
  const known = new Set(workspace.ideas.map(idea => idea.id));
  const keepKnown = <T>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([id]) => known.has(id)));
  return { ...workspace, proposals: keepKnown(workspace.proposals), evaluations: keepKnown(workspace.evaluations), shortlist: workspace.shortlist.filter(id => known.has(id)) };
}

/** Idées écartées comme doublons : identifiant écarté → identifiant conservé. */
export function dismissedIdeas(workspace: Workspace): Map<string, string> {
  const dismissed = new Map<string, string>();
  for (const decision of Object.values(workspace.decisions)) {
    if (decision.status === 'duplicate') dismissed.set(decision.dismissedId, decision.keptId);
  }
  return dismissed;
}

export function saveEvaluation(workspace: Workspace, evaluation: Evaluation): Workspace {
  return { ...workspace, evaluations: { ...workspace.evaluations, [evaluation.ideaId]: evaluation } };
}

/** Enregistre une décision sur une paire, ou l'annule avec `null`. Une idée écartée quitte la shortlist. */
export function decideDuplicate(workspace: Workspace, key: string, decision: DuplicateDecision | null): Workspace {
  const decisions = { ...workspace.decisions };
  if (decision) decisions[key] = decision; else delete decisions[key];
  const shortlist = decision?.status === 'duplicate' ? workspace.shortlist.filter(id => id !== decision.dismissedId) : workspace.shortlist;
  return { ...workspace, decisions, shortlist };
}

export function toggleShortlisted(workspace: Workspace, ideaId: string): Workspace {
  const shortlist = workspace.shortlist.includes(ideaId) ? workspace.shortlist.filter(id => id !== ideaId) : [...workspace.shortlist, ideaId];
  return { ...workspace, shortlist };
}
