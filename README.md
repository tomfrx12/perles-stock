# Perles Stock

Application de gestion de stock de perles à repasser (Hama, Artkal, Autres) avec suivi de projets pixel art.

## Fonctionnalités

- **Stock** : visualisation par marque et groupe, édition inline avec calculette (`390-55`, `+20`…), recherche par code/nom/hex
- **Projets** : saisie manuelle des perles par projet, pipette couleur (EyeDropper API), vérification du stock disponible, validation avec déduction automatique
- **Persistance** : tout en localStorage, aucun serveur requis

## Stack

- React 19 + Vite + Tailwind CSS v4
- 385 couleurs (92 Hama, 197 Artkal, 96 Autres)

## Développement

```bash
npm install
npm run dev
```

## Déploiement (Docker + Traefik)

1. Générer le hash du mot de passe (mot de passe long, demandé de façon interactive) :
   ```bash
   htpasswd -nB tonnom   # paquet apache2-utils
   ```

2. Ajouter la ligne obtenue dans `.env` (non versionné), entre apostrophes simples et sans doubler les `$` :
   ```
   BASIC_AUTH_USERS='tonnom:$2y$05$...'
   ```
   Plusieurs utilisateurs : séparer par une virgule. Sans cette variable, `docker compose` refuse de démarrer.

3. Adapter le domaine dans `docker-compose.yml` si besoin

4. Déployer :
   ```bash
   docker compose up -d --build
   ```
