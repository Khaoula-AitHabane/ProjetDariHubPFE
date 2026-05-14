# DarSouk — Marketplace marocaine (PFE)

Plateforme inspirée d'**Avito.ma** dédiée à 3 catégories :

- 🏠 **Immobilier** (`house_rental`) — appartements, villas, terrains
- 🛋️ **Meubles** (`furniture_rental`) — salons, chambres, déco
- 🧰 **Services maison** (`home_service`) — ménage, plomberie, électricité, jardinage

## Stack

| Couche | Tech |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Laravel 11 + SQLite |
| Scraping | Playwright (Chromium) |

## Architecture

```
ProjetPFE/
├── backend/      # API Laravel (auth, services, bookings)
├── frontend/     # SPA React style Avito
└── scraper/      # Scraper Playwright -> JSON -> import Laravel
```

## ⚠️ Aucune donnée fictive

Le projet ne contient **aucune fake data** :
- les seeders ne créent que 2 comptes système (admin + bot d'import)
- les annonces proviennent soit des utilisateurs (formulaire "Publier"), soit
  du scraper qui récupère **de vraies annonces marocaines** depuis Avito.ma /
  Mubawab.ma.

## Démarrage rapide

### 1. Backend (Laravel)

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

API disponible sur `http://127.0.0.1:8000`.

### 2. Frontend (React)

```powershell
cd frontend
npm install
# créer .env avec : VITE_API_URL=http://127.0.0.1:8000
npm run dev
```

UI sur `http://127.0.0.1:5173`.

### 3. Importer de vraies annonces (scraper)

```powershell
cd scraper
npm install
npx playwright install chromium
npm run scrape                  # produit data/services.json

cd ../backend
php artisan services:import --fresh
```

Voir `scraper/README.md` pour les options détaillées.

## Comptes par défaut (créés par le seeder)

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@darsouk.ma` | `password` | admin |
| `scraper@darsouk.ma` | `password` | provider (bot d'import) |

Les autres comptes (clients, prestataires) sont créés via `/register`.

## Routes principales

### Frontend
- `/` — Accueil avec recherche + 3 catégories + listings
- `/categories/house_rental` — Immobilier
- `/categories/furniture_rental` — Meubles
- `/categories/home_service` — Services maison
- `/login`, `/register`

### API Laravel
- `GET  /api/services` — liste publique (filtres `type`, `city`, `search`)
- `POST /api/services` — publier (auth provider/admin)
- `GET  /api/platform/overview` — stats plateforme
- `POST /api/login`, `POST /api/register`, `POST /api/logout`
- `GET  /api/me`
- `POST /api/bookings`, `GET /api/my/bookings`

## Commande artisan ajoutée

```bash
php artisan services:import [--file=...] [--fresh]
```

Importe `scraper/data/services.json` dans la table `services`. Avec `--fresh`,
vide la table avant l'import.
