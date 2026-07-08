# Oasis Pomme Cassis — site prêt à déployer

Ce dossier contient un projet complet (Vite + React) autour du fichier
`src/Storefront.jsx` (ta boutique). Voici comment le mettre en ligne
gratuitement avec GitHub.

## 1. Créer le dépôt GitHub

1. Va sur https://github.com/new
2. Donne un nom à ton dépôt, par exemple `oasis-pomme-cassis`
3. Laisse-le en **Public**, ne coche aucune case (pas de README/licence), clique "Create repository"

## 2. Envoyer ce projet sur GitHub

Sur ton ordinateur, dans un terminal, place-toi dans ce dossier puis :

```bash
git init
git add .
git commit -m "Premier envoi du site"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/oasis-pomme-cassis.git
git push -u origin main
```

(Remplace `TON-PSEUDO` et le nom du dépôt par les tiens.)

## 3. Adapter le chemin de base

Ouvre `vite.config.js` et remplace `NOM-DE-TON-DEPOT` par le nom exact
de ton dépôt GitHub (ex. `oasis-pomme-cassis`).

## 4. Installer et déployer

Toujours dans le dossier du projet :

```bash
npm install
npm run build
npm run deploy
```

`npm run deploy` publie automatiquement le contenu buildé sur une
branche `gh-pages` de ton dépôt (grâce au paquet `gh-pages` déjà inclus).

## 5. Activer GitHub Pages

1. Sur GitHub, va dans ton dépôt → **Settings** → **Pages**
2. Dans "Source", choisis la branche `gh-pages` et le dossier `/ (root)`
3. Sauvegarde — ton site sera visible après 1-2 minutes à l'adresse :
   `https://TON-PSEUDO.github.io/oasis-pomme-cassis/`

## Pour mettre à jour le site plus tard

Après avoir modifié `src/Storefront.jsx` :

```bash
npm run build
npm run deploy
```

## Utiliser l'autre version (menu/accordéon) à la place

Remplace le contenu de `src/Storefront.jsx` par celui de
`AmbreEtBraiseMenu.jsx`, ou renomme le fichier et adapte l'import dans
`src/App.jsx`.

## Avant de publier pour de vrai

- Vérifie le numéro WhatsApp en haut de `Storefront.jsx`
- Remplace le RIB d'exemple par tes vraies coordonnées bancaires
- Remplace `MONDIAL_RELAY_BRAND` ("BDTEST") par ton vrai code enseigne
  Mondial Relay une fois ton compte pro activé
- Si `npm install` ou le site affiche une erreur liée à Node.js,
  installe la dernière version LTS depuis https://nodejs.org
