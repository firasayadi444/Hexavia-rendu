# Instructions de travail

- Garder un monolithe modulaire Next.js/TypeScript : app (pages et actions serveur), modules/ideas (règles métier indépendantes de React).
- Avancer une fonctionnalité à la fois avec explication et vérification ; ne pas implémenter la suivante sans demande de l'utilisateur.
- Étape actuelle : import CSV et évaluation manuelle dans un panneau latéral. Les évaluations sont conservées uniquement dans la page ouverte ; ne jamais afficher une sauvegarde en base inexistante.
- La persistance Supabase/PostgreSQL viendra dans une étape séparée. Les repères de notation sont proposés et doivent être confirmés par le client.
- Aucune donnée métier persistante ni session dans la mémoire d'une instance API.
- Toutes les requêtes SQL utilisent des paramètres. Valider les entrées HTTP et CSV.
- Ne jamais valider automatiquement une proposition IA ou supprimer un doublon suggéré.
- Conserver les champs source et afficher les données manquantes sans inventer une valeur.
- Protéger les mutations concurrentes par transaction/verrou ou version optimiste ; tester ces règles.
- Secrets uniquement côté serveur. Ne pas journaliser les corps, CSV, noms ou jetons.
- Exécuter npm test et npm run build avant livraison. Ne pas présenter une validation non exécutée comme réussie.
- Documenter les arbitrages et limites dans README.md et docs/architecture.md.
- Ne pas inventer de prompts, de captures, d'heures, de commits ou d'URL de déploiement.
