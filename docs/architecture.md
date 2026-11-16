# Architecture

Une application Next.js. Le serveur ne fait que deux choses : lire le fichier importé et demander une première note à l'IA. Tout le travail de la consultante vit ensuite dans son navigateur.

```text
Navigateur                                   Serveur Next.js
----------                                   ---------------
import-form.tsx    -- fichier CSV -->        actions.ts (action serveur)
                                               modules/ideas : CSV -> idées validées
                                               modules/ai    : idées sans nom -> notes proposées
workspace-app.tsx  <-- idées + propositions --
  use-workspace.ts : lit et écrit localStorage
  modules/workspace : notes, décisions, shortlist
  modules/duplicates, ideas/filter, shortlist : calculs à l'affichage
  components/ : idées, doublons, shortlist
```

## Les modules métier (`src/modules`)

Aucun ne connaît React, Next.js ou le navigateur : ils se testent avec `node --test`.

| Module | Rôle |
| --- | --- |
| `ideas/import-csv.ts` | Lit le CSV : guillemets, dates françaises, budgets saisis librement, champs obligatoires. |
| `ideas/filter.ts` | Filtres, recherche sans accents, tris. |
| `evaluations/` | Grille à quatre critères, repères, moyenne à poids égaux, validation d'une note. |
| `ai/` | `simulate.ts` propose quatre notes justifiées par des règles ; `provider.ts` est le seul point où brancher un vrai modèle. |
| `duplicates/detect.ts` | Rapproche les idées par leurs mots (titre compté double, mots rares pondérés). |
| `shortlist/shortlist.ts` | Classement, suggestion des mieux notées, export CSV pour Excel. |
| `workspace/workspace.ts` | L'état de travail : création, relecture validée, décisions. |

## Pourquoi le navigateur plutôt qu'une base

Une seule consultante dépouille un challenge, sur son poste. Sans base, il n'y a ni compte à créer, ni données personnelles conservées sur un serveur, ni secret à déployer. Le prix : le travail ne suit pas la consultante sur un autre poste et ne se partage pas. `modules/workspace` isole cet état pour que le passage à Supabase ne change que `use-workspace.ts`.

Ce qui est relu depuis `localStorage` est validé par Zod comme une entrée externe : un contenu abîmé ou d'une ancienne version est ignoré, l'application repart de l'import.

## L'IA

`actions.ts` appelle `proposeEvaluations` juste après l'import. L'IA ne reçoit que l'identifiant, le titre, la description, les bénéfices, le thème et le budget. `readAiSettings` lit `AI_API_KEY`, `AI_MODEL` et `STRATEGIC_PRIORITIES` côté serveur. En V1 la réponse est toujours simulée, clé présente ou non ; chaque proposition porte `source: 'simulation'` et l'interface le dit.

## Limites connues

- Pas d'authentification : l'URL est ouverte, mais aucune donnée n'y est stockée.
- Détection des doublons lexicale : deux idées identiques sur le fond mais sans mot commun lui échappent. Le seuil est réglé sur l'export Hexavia.
- Le parcours au clavier et au lecteur d'écran n'a pas été vérifié de bout en bout.
- Aucun test de charge ; la limite de 1 000 idées est une garde, pas une capacité mesurée.
