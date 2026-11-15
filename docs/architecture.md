# Architecture — import et évaluation manuelle

Une application Next.js contient le rendu React et les actions serveur. Le module métier ne connaît ni les composants React, ni HTTP, ni Supabase.

```text
Navigateur
  import-form.tsx : choix du fichier et aperçu
       |
       | formulaire multipart
       v
Serveur Next.js
  actions.ts : frontière du formulaire, erreurs lisibles
       |
       v
Module ideas
  preview-import.ts : fichier -> résultat d'analyse
  import-csv.ts     : texte CSV -> idées validées
  idea.ts           : modèle partagé
       |
       | résultat sérialisable
       v
Navigateur : tableau et informations à compléter
```

## Pourquoi ces séparations ?

La lecture CSV se teste sans navigateur et sans base. Le formulaire peut évoluer sans modifier les règles d'import. La future persistance pourra être appelée côté serveur après validation, sans réécrire l'analyse CSV.

Les animations Motion restent dans les composants clients d'import et d'évaluation. `LazyMotion` et `domAnimation` fournissent les transitions des blocs et du bouton ; aucune animation n'est créée pour chaque ligne d'idée. Les préférences de réduction des mouvements sont respectées et le formulaire initial reste visible sans animation d'entrée.

## Évaluation manuelle

`ideas-preview.tsx` conserve les évaluations dans l'état React de la page. Chaque idée s'ouvre dans `evaluation-panel.tsx`, une modale latérale Radix Dialog avec des icônes Lucide et une entrée Motion. L'état du formulaire reste un brouillon jusqu'à sa validation.

La grille, le calcul de moyenne et les schémas Zod vivent dans `modules/evaluations`. L'action `confirmSessionEvaluation` revérifie la saisie côté serveur et retourne un résultat horodaté. Elle ne stocke rien. Les champs supplémentaires, notes partielles, décimales et hors limites sont refusés.

Chaque analyse CSV reçoit un identifiant d'aperçu distinct : un nouvel import, même avec le même nom de fichier et les mêmes identifiants d'idées, crée une nouvelle session d'évaluation. Les statuts de l'interface parlent de validation dans la page, jamais de sauvegarde durable.

L'identité de l'idée est contrôlée syntaxiquement à cette étape. Lors de l'ajout de la base, il faudra également vérifier son existence et l'autorisation de l'utilisateur dans le challenge avant toute écriture.

## Ce qui est effectivement présent

Les requêtes sont indépendantes : aucune donnée métier n'est conservée entre deux requêtes dans le processus serveur. Il n'existe encore ni base, ni authentification, ni worker, ni cache distribué. Le résultat reste dans la page ouverte et ne constitue pas un enregistrement durable.

Les limites de taille sont vérifiées côté serveur. Next.js limite aussi le corps des actions à 3 Mo, afin de transporter un fichier de 2 Mo avec les métadonnées du formulaire. React affiche les données comme du texte.

## Évolution prévue, à implémenter séparément

Supabase/PostgreSQL conservera les idées. L'import devra alors être transactionnel, lié à un challenge et autorisé pour l'utilisateur connecté. La contrainte d'unicité sera portée par la base, et non par la mémoire d'une instance.

L'application pourra recevoir plus de CPU/RAM ou plusieurs instances derrière un répartiteur. La base et les connexions devront être dimensionnées en parallèle. Aucun test de charge n'a encore mesuré une capacité de production.
