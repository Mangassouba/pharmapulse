# PharmaPulse — Front

Interface web de **PharmaPulse**, plateforme SaaS de gestion de pharmacies. Elle regroupe trois espaces :

| Espace | Adresse | Pour qui |
|---|---|---|
| **Vitrine publique** | `/` | Les clients : recherche de médicaments, pharmacies de garde, commande en ligne |
| **Espace pharmacie** | `/app` | Le personnel : stock, ventes, réceptions, inventaires, utilisateurs |
| **Panel Super Admin** | `/super` | L'exploitant de la plateforme : pharmacies, abonnements, journaux, logo et nom du site |

> L'API (Express + PostgreSQL) est dans un dépôt séparé : [`pharmapulse-api`](https://github.com/Mangassouba/pharmapulse-api). Son README détaille l'installation complète et le déploiement.

**Stack :** Vue 3 · Vite 5 · Pinia · Vue Router · Tailwind CSS · Chart.js · Lucide

---

## Démarrage rapide (en local)

**Prérequis :** Node.js 24 et l'API lancée en local (voir son README).

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env
echo "VITE_API_URL=http://localhost:3001/api" > .env

# 3. Lancer le front
npm run dev
```

Ouvrez `http://localhost:5173`. Les comptes de démo sont listés dans le README de l'API.

## Variables d'environnement

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | Adresse de l'API |

> Cette valeur est **intégrée au moment de la construction**. Après l'avoir modifiée sur Vercel, il faut **redéployer**.

## Scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement automatique |
| `npm run build` | Construit la version de production dans `dist/` |
| `npm run preview` | Affiche localement la version construite |

## Structure

```
src/
├── views/            Pages : auth/, public/, superadmin/ et l'espace pharmacie
├── components/       Menus (layout/), reçu de vente, logo et nom du site…
├── stores/           État partagé (Pinia) : session, panier, réglages du site…
├── services/api.js   Toutes les requêtes vers l'API
├── router/           Routes et protection des pages
└── utils/            Logos, jours de garde…
```

## Déploiement sur Vercel

1. Importez ce dépôt sur Vercel. Le framework **Vite** est détecté automatiquement.
2. Ajoutez la variable `VITE_API_URL=https://<votre-api>.onrender.com/api`.
3. Déployez.

Le fichier [`vercel.json`](vercel.json) renvoie toutes les adresses vers l'application. Sans lui, ouvrir directement un lien comme `/reset-password?token=…` (reçu par email) ou actualiser une page donnerait une **erreur 404**.

Côté API, ajoutez l'adresse Vercel dans `FRONTEND_URL` et `CORS_ORIGINS`.

> Le plan **Hobby** (gratuit) de Vercel est réservé à un usage non commercial. Pour vendre des abonnements, il faut le plan **Pro**, ou un hébergeur qui autorise l'usage commercial gratuitement, comme Cloudflare Pages.
