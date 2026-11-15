# Élan — Challenge innovation

## État de cette étape

Deux étapes sont disponibles : analyser un CSV et évaluer manuellement les idées depuis un panneau latéral. Aucune sauvegarde en base à ce stade. L'aperçu et les évaluations sont perdus en quittant ou en actualisant la page.

Le fichier fourni donne **40 idées**, **8 idées à compléter**, **7 budgets inconnus ou absents**. Un budget déclaré à zéro est conservé à zéro. Les contenus identiques avec des identifiants différents restent deux idées.

L'interface utilise Motion via le paquet `framer-motion` : transitions de 200 ms pour les messages et l'aperçu, retour discret à l'appui sur le bouton. `LazyMotion` limite les fonctionnalités chargées ; le tableau s'anime en un bloc. `useReducedMotion` désactive ces mouvements lorsque l'utilisateur demande moins d'animations.

## Développement du frontend

Codex a été utilisé pour aider à construire les composants React, les styles et les animations du frontend. Les choix d’interface ont été affinés progressivement : aperçu CSV, panneau latéral d’évaluation, repères de notation et statuts de validation. La vérification visuelle et des interactions au clavier reste à effectuer dans un navigateur.

## Lancer l'outil

Prérequis : Node.js 22.12 ou supérieur et npm.

```sh
git clone https://github.com/firasayadi444/Hexavia-rendu.git
cd Hexavia-rendu
npm ci
npm run dev
```

Ouvrir http://localhost:3000, sélectionner `data/idees_hexavia.csv`, puis cliquer sur **Analyser le fichier**. Aucun secret ni service externe n'est nécessaire pour cette étape.

Dans le tableau, cliquer sur **Évaluer**. Relire l'idée, ouvrir les repères de notation et attribuer les quatre notes. **Valider pour cette session** vérifie la saisie sur le serveur, ferme le panneau et affiche la moyenne dans la liste. **Revoir** permet de corriger une évaluation conservée dans la page.

La validation ne constitue pas une sauvegarde en base. Une confirmation protège les modifications non validées à la fermeture et les évaluations existantes au changement de fichier. Le navigateur est averti des évaluations présentes lors d'une actualisation ou fermeture de l'onglet ; ce mécanisme ne garantit pas leur récupération.

```sh
npm test
npm run check
npm run build
npm start
```

La commande de compilation utilise Webpack.

## Comprendre le code dans l'ordre

1. `src/modules/ideas/idea.ts` : la forme d'une idée et le type d'erreur d'import.
2. `src/modules/ideas/import-csv.ts` : les règles de lecture, dates, budgets et champs obligatoires. Ce module ne dépend pas de Next.js.
3. `src/modules/ideas/preview-import.ts` : vérifie le fichier et construit le résultat de l'analyse.
4. `src/app/actions.ts` : reçoit le formulaire côté serveur et transforme les erreurs attendues en messages lisibles.
5. `src/app/import-form.tsx` : sélection du fichier, état de chargement et tableau d'aperçu.
6. `tests/import-csv.test.ts` : vérifie le vrai fichier et les entrées imparfaites.
7. `src/modules/evaluations/evaluation.ts` : repères de notation, schémas Zod et moyenne à poids égaux.
8. `src/app/evaluation-actions.ts` : validation serveur d'une évaluation, sans écriture en base.
9. `src/components/evaluation-panel.tsx` : proposition, grille, commentaire et validation.
10. `src/components/ideas-preview.tsx` : liste et évaluations conservées dans l'état React de cette page.

Le panneau utilise Radix Dialog pour le comportement modal et Lucide React pour les icônes. Les composants sont personnalisés en CSS ; shadcn/ui et Tailwind ne sont pas encore intégrés.

## Règles et hypothèses

- CSV UTF-8, avec ou sans BOM ; séparateur `;` ; 11 colonnes attendues, leur ordre est libre.
- Taille maximale : 2 Mo ; entre 1 et 1 000 idées ; champ limité à 25 000 caractères.
- ID unique dans le fichier, titre, description, direction et date valides sont obligatoires. Une erreur bloquante refuse l'ensemble du fichier.
- Site, thème, bénéfices et budget manquants sont signalés et ne bloquent pas l'aperçu.
- Dates ISO et françaises acceptées. La valeur déclarée est conservée dans `dateRaw`.
- `budgetRaw` conserve le budget déclaré ; `budget` contient le montant reconnu ou `null`. Les valeurs incertaines ne sont pas devinées.
- Pas d'envoi à une IA, de stockage du fichier ni de journalisation de son contenu.
- Les quatre notes sont des entiers de 1 à 5, sans préremplissage. Leur moyenne est arithmétique, à poids égaux.
- Les repères 1/3/5 sont proposés pour le prototype, pas fournis par Hexavia. La stratégie du client manque : l'alignement doit être justifié par une hypothèse explicite, à confirmer.

## Vérification

Les tests couvrent le fichier fourni, les budgets, dates impossibles, accents, BOM, retours ligne, guillemets, colonnes, identifiants répétés, limites de taille, encodage et action serveur. Les tests d'évaluation vérifient les quatre notes obligatoires, les bornes, les poids égaux, les entrées invalides et la validation serveur. `npm run check` vérifie les types ; `npm run build` compile l'application. La vérification visuelle et des interactions au clavier reste à effectuer dans un navigateur.

## Architecture et suite

Monolithe modulaire Next.js/TypeScript. Voir `docs/architecture.md` pour le parcours d'une requête. L'authentification et la sauvegarde atomique des idées et évaluations dans Supabase/PostgreSQL feront l'objet d'une prochaine étape, avant d'utiliser de vraies données. Les filtres, l'IA simulée, les doublons, la sélection et l'export restent à réaliser.

L'application n'est pas encore déployée ; cette étape se concentre sur l'import et son explication.
