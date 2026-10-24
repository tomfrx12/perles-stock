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

1. Générer le hash du mot de passe :
   ```bash
   htpasswd -nb tonnom tonmotdepasse | sed 's/\$/\$\$/g'
   ```

2. Mettre à jour `docker-compose.yml` : domaine et hash BasicAuth

3. Déployer :
   ```bash
   docker compose up -d --build
   ```
