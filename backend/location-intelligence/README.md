# Morocco Location Intelligence API

Service Node.js / Express pour DariHub.

Ce microservice centralise la recherche intelligente de localisation pour le
Maroc: normalisation Darija/Francais, classement local, cache memoire et
fallback vers des geocodeurs externes.

## Endpoints

- `GET /api/location/search?q=...`
- `GET /health`

## Lancer le service

```bash
cd backend/location-intelligence
npm install
copy .env.example .env
npm run dev
```

## Variables d'environnement

```env
LOCATION_API_PORT=8787
GEOAPIFY_API_KEY=your_geoapify_api_key_here
```

## Architecture

- Normalisation de la requete: lowercasing, nettoyage, synonymes marocains.
- Dataset local marocain: plus de 100 villes, quartiers, gares, universites,
  marches et monuments.
- Ranking intelligent: exact match, partial match, mots-cles, fuzzy match et
  score de popularite.
- Cache memoire: les requetes frequentes reviennent instantanement.
- Fallback externe: Geoapify en premier, puis Nominatim si besoin.

## Exemple de reponse

```json
{
  "query": "agdal rabat",
  "results": [
    {
      "name": "Agdal",
      "city": "Rabat",
      "lat": 33.9965,
      "lng": -6.851,
      "type": "neighborhood",
      "score": 24,
      "source": "local"
    }
  ]
}
```

## Exemple de requete

```bash
curl "http://127.0.0.1:8787/api/location/search?q=pres%20de%20gare%20casa"
```
