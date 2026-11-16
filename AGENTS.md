# Instructions de travail

- Garder un monolithe modulaire Next.js/TypeScript : `src/app` (page et action serveur), `src/components` (écrans), `src/modules` (règles métier indépendantes de React et de Next.js).
- Avancer une fonctionnalité à la fois avec explication et vérification ; ne pas implémenter la suivante sans demande de l'utilisateur.
- État actuel : import CSV, filtres, proposition de note par une IA simulée, évaluation, doublons, shortlist et export. Le travail est conservé dans le navigateur (localStorage) ; ne jamais afficher une sauvegarde en base inexistante.
- La persistance Supabase/PostgreSQL et l'authentification viendront dans une étape séparée. Les repères de notation sont proposés et doivent être confirmés par le client.
- Aucune donnée métier persistante ni session dans la mémoire du serveur. Valider les entrées HTTP et CSV, et tout ce qui est relu depuis le navigateur.
- Ne jamais valider automatiquement une proposition de l'IA, ni écarter ou supprimer un doublon suggéré : la consultante décide.
- L'IA ne reçoit que le contenu des idées, jamais le nom des auteurs. La clé du modèle reste côté serveur.
- Conserver les champs source et afficher les données manquantes sans inventer une valeur.
- Secrets uniquement côté serveur. Ne pas journaliser les corps, CSV, noms ou jetons.
- Toute règle métier nouvelle arrive avec son test dans `tests/`.
- Exécuter `npm run check`, `npm test` et `npm run build` avant livraison. Ne pas présenter une validation non exécutée comme réussie.
- Documenter les arbitrages et limites dans README.md et docs/architecture.md.
- Ne pas inventer de prompts, de captures, d'heures, de commits ou d'URL de déploiement.
