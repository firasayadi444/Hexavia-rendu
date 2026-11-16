# Rapport d’évaluation du rendu Hexavia

**Date :** 16 novembre 2026

**Périmètre :** dépôt local fourni, fichier `idees_hexavia.csv`, consignes du cas pratique et état du projet au moment de l’évaluation.

**Déploiement :** non réalisé, conformément à la décision de le faire ultérieurement.

## Synthèse

Le projet fournit déjà un parcours fonctionnel de dépouillement : import CSV, consultation et filtrage des idées, proposition de notes simulée, évaluation humaine, revue des doublons, shortlist et exports. Le travail est conservé dans `localStorage` sur le navigateur. Les règles métier sont séparées des composants, et des tests couvrent les principaux modules.

Le rendu est avancé pour une démonstration locale. Il n’est pas encore prêt à être présenté comme une application en ligne : il n’y a pas d’URL publique, de compte utilisateur ni de base partagée. Ces éléments restent hors du périmètre immédiat selon la consigne de les traiter plus tard. Le README comporte encore des informations personnelles de réalisation à compléter (prompts réellement utilisés et heures) et doit être relu pour ne garder que les vérifications que l’auteur peut confirmer.

## Évaluation par étape

| Étape du cas pratique | État | Évaluation |
| --- | --- | --- |
| Cadrer | Réalisé | Le README expose le besoin, l’utilisatrice visée, les hypothèses et le périmètre V1. Les hypothèses de notation et l’absence de priorités client sont annoncées. |
| Concevoir | Réalisé | L’architecture Next.js/TypeScript sépare interface, actions serveur et règles métier. Le travail local est validé avant relecture depuis le navigateur. Une base et une authentification ne sont pas incluses. |
| Construire avec l’IA | Réalisé avec simulation | Les propositions sont simulées et justifiées ; elles ne sont pas validées automatiquement. Le contenu des idées est transmis sans le nom des auteurs. Aucun fournisseur de modèle réel n’est branché. |
| Fiabiliser | Vérifié | `npm run check`, `npm test` (61 tests) et `npm run build` passent dans l’environnement courant. |
| Soigner l’interface | Implémenté, revue manuelle à confirmer | Les écrans couvrent les étapes métier et les captures locales sont présentes dans `docs/captures/`. Une nouvelle vérification clavier, mobile et lecteur d’écran reste à documenter si elle a été réalisée. |
| Livrer | Version locale disponible | L’application peut être lancée localement. Les données restent dans le navigateur ; aucun déploiement public n’a été effectué. La mise en ligne est reportée. |
| Restituer | À finaliser | README et documentation d’architecture existent. Les prompts réels et les horaires ne doivent être renseignés que par l’auteur ; la rubrique de vérification du parcours doit également refléter des essais réellement effectués. |

## Fonctionnalités constatées dans le dépôt

- Import et validation du CSV, avec conservation des données source et des budgets inconnus.
- Recherche, filtres et tris sur les idées.
- Proposition de notes par règles simulées, avec justifications et réserves.
- Saisie et validation des notes par la consultante.
- Suggestions de doublons avec décision laissée à la consultante.
- Classement, constitution de shortlist et export CSV/PDF.
- Sauvegarde locale du travail avec validation du contenu relu depuis `localStorage`.

## Vérifications effectuées pour ce rapport

- `npm run check` : réussi.
- `npm run build` : réussi après déplacement de l’icône vers `public/icon.svg`, pour éviter une erreur du chargeur Next.js dans le chemin Windows contenant une apostrophe.
- `npm test` : 61 tests réussis, aucun échec, sous Node 24 après relance hors de l’environnement isolé.
- Le serveur de développement a démarré à `http://127.0.0.1:3000`.

## Écart avec le rapport d’évaluation fourni

Le fichier `Rapport_evaluation_Hexavia_INSKIP.pdf` décrit un état antérieur du projet : il signale notamment l’absence des filtres, de la simulation IA, de la revue des doublons, de la shortlist et de la persistance, alors que ces modules sont présents dans le dépôt actuel. Ses constats ne doivent donc pas être repris comme une évaluation de cette version sans nouvelle comparaison complète. En revanche, ses remarques sur la mise en ligne différée et les informations de restitution à compléter restent pertinentes.

## Suite proposée

1. Compléter le README avec les seuls prompts et horaires que l’auteur peut confirmer.
2. Refaire une revue manuelle du parcours et des captures avant la présentation.
3. Traiter le déploiement, l’authentification et une éventuelle persistance serveur dans l’étape ultérieure prévue.

## Conclusion

Le socle fonctionnel local est substantiel et le typage, les 61 tests et la compilation de production sont validés. Le rendu doit être présenté comme une V1 locale avec IA simulée et sauvegarde navigateur. La publication en ligne reste à réaliser avant de revendiquer une livraison publique complète.
