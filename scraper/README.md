# DarSouk Scraper

Scraper **Playwright** qui récupère de vraies annonces marocaines
(Avito.ma, Mubawab.ma) pour les 3 catégories du projet :

- 🏠 **Immobilier** (`house_rental`)
- 🛋️ **Meubles** (`furniture_rental`)
- 🧰 **Services maison** (`home_service`)

## Installation

```powershell
cd scraper
npm install
npx playwright install chromium
```

## Utilisation

### Scraper par défaut (Avito, 1 page par catégorie)

```powershell
npm run scrape
```

### Options

```powershell
node scrape.js --source=avito --pages=3   # 3 pages par catégorie
node scrape.js --source=mubawab --pages=2 # Mubawab (immobilier uniquement)
node scrape.js --source=all --pages=2     # les deux
node scrape.js --headful                  # affiche le navigateur (utile si captcha)
```

### Sortie

Les annonces sont écrites dans `scraper/data/services.json`.

## Import dans Laravel

Une fois le JSON généré :

```powershell
cd ../backend
php artisan services:import          # import normal (ajoute)
php artisan services:import --fresh  # vide la table services avant import
```

Les annonces sont rattachées au compte provider `scraper@darsouk.ma`
(créé automatiquement par le seeder ou par la commande d'import).

## Workflow complet (premier lancement)

```powershell
# 1) Backend
cd backend
php artisan migrate:fresh --seed       # crée le schema + admin + bot

# 2) Scraper
cd ../scraper
npm install
npx playwright install chromium
npm run scrape                         # produit data/services.json

# 3) Import
cd ../backend
php artisan services:import --fresh    # insère les annonces réelles

# 4) Frontend
cd ../frontend
npm install
npm run dev
```

## ⚠️ Avertissements

- Ce scraper est destiné à un **usage académique (PFE) en local**.
- Les sites scrapés (Avito, Mubawab) peuvent interdire le scraping dans
  leurs CGU. **Ne pas** déployer ce scraper en production publique.
- Avito est protégé par Cloudflare : en cas de blocage, relance en mode
  `--headful` pour résoudre manuellement un éventuel captcha, ou attends
  quelques minutes avant de réessayer.
- Les sélecteurs HTML peuvent changer si les sites mettent à jour leur
  structure. Dans ce cas, ajuste les `querySelector` dans `scrape.js`.

## Structure du JSON généré

Chaque annonce suit ce format (aligné avec la table `services` de Laravel) :

```json
{
  "source": "avito.ma",
  "source_url": "https://www.avito.ma/fr/...",
  "service_type": "house_rental",
  "category": "Immobilier",
  "title": "Appartement à louer à Casablanca",
  "description": "...",
  "location_city": "Casablanca",
  "location_address": "Maarif, Casablanca",
  "price": 5000,
  "billing_unit": "per_night",
  "features": [],
  "image_url": "https://...",
  "is_featured": false,
  "rating": 0,
  "reviews_count": 0
}
```
