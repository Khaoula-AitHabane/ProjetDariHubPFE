<?php

namespace App\Console\Commands;

use App\Models\Service;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportServices extends Command
{
    /**
     * Signature de la commande.
     *
     * Usage :
     *   php artisan services:import                 (utilise ../scraper/data/services.json)
     *   php artisan services:import --file=xxx.json
     *   php artisan services:import --fresh         (vide la table services avant import)
     */
    protected $signature = 'services:import
        {--file= : Chemin vers le fichier JSON produit par le scraper}
        {--fresh : Supprimer les annonces existantes avant d importer}';

    protected $description = 'Importe des annonces reelles (JSON) scrapees depuis des sites marocains';

    public function handle(): int
    {
        $path = $this->option('file')
            ?: base_path('../scraper/data/services.json');

        if (! file_exists($path)) {
            $this->error("Fichier introuvable: {$path}");
            $this->line('Lance d abord le scraper : cd scraper && npm run scrape');

            return self::FAILURE;
        }

        $raw = file_get_contents($path);
        $items = json_decode($raw, true);

        if (! is_array($items)) {
            $this->error('JSON invalide.');

            return self::FAILURE;
        }

        $bot = User::query()->firstOrCreate(
            ['email' => 'scraper@darsouk.ma'],
            [
                'name' => 'Bot Import',
                'password' => 'password',
                'role' => 'provider',
                'phone' => '0600000001',
                'city' => 'Casablanca',
                'bio' => 'Annonces importees automatiquement depuis des sites marocains.',
            ],
        );

        if ($this->option('fresh')) {
            $this->warn('Suppression des annonces existantes...');
            Service::query()->delete();
        }

        $inserted = 0;
        $skipped = 0;
        $allowedTypes = ['house_rental', 'furniture_rental', 'home_service'];
        $allowedUnits = ['per_night', 'per_day', 'per_service'];

        $defaultUnitByType = [
            'house_rental' => 'per_night',
            'furniture_rental' => 'per_day',
            'home_service' => 'per_service',
        ];

        foreach ($items as $item) {
            $serviceType = $item['service_type'] ?? null;

            if (! in_array($serviceType, $allowedTypes, true)) {
                $skipped++;
                continue;
            }

            $title = trim((string) ($item['title'] ?? ''));

            if ($title === '') {
                $skipped++;
                continue;
            }

            // Titre unique : si doublon, on ajoute un suffixe court.
            if (Service::query()->where('title', $title)->exists()) {
                $title .= ' · ' . Str::upper(Str::random(4));
            }

            $billingUnit = $item['billing_unit'] ?? $defaultUnitByType[$serviceType];

            if (! in_array($billingUnit, $allowedUnits, true)) {
                $billingUnit = $defaultUnitByType[$serviceType];
            }

            // Heuristiques sur titre + description pour deriver les filtres
            $haystack = mb_strtolower($title . ' ' . ($item['description'] ?? '') . ' ' . ($item['category'] ?? ''));

            $surface = null;
            if (preg_match('/(\d{2,5})\s*(?:m\s*2|m²|m\^2|mq)/u', $haystack, $m)) {
                $surface = min(100000, (int) $m[1]);
            }

            $furnished = null;
            if ($serviceType === 'house_rental') {
                if (str_contains($haystack, 'non meubl') || str_contains($haystack, 'vide')) {
                    $furnished = false;
                } elseif (str_contains($haystack, 'meubl')) {
                    $furnished = true;
                }
            }

            $listingKind = null;
            if ($serviceType === 'house_rental') {
                if (str_contains($haystack, 'vendre') || str_contains($haystack, 'vente') || str_contains($haystack, 'achat')) {
                    $listingKind = 'sale';
                } else {
                    $listingKind = 'rent';
                }
            }

            $condition = null;
            if ($serviceType === 'furniture_rental') {
                // Tous les meubles scrapes viennent de marchands neufs
                $condition = str_contains($haystack, 'occasion') || str_contains($haystack, 'd occasion') ? 'used' : 'new';
            }

            Service::query()->create([
                'provider_id' => $bot->id,
                'service_type' => $serviceType,
                'category' => Str::limit((string) ($item['category'] ?? 'Annonce'), 120, ''),
                'title' => Str::limit($title, 255, ''),
                'description' => (string) ($item['description'] ?? $title),
                'location_city' => Str::limit((string) ($item['location_city'] ?? 'Maroc'), 120, ''),
                'location_address' => $item['location_address'] ?? null,
                'latitude' => $item['latitude'] ?? null,
                'longitude' => $item['longitude'] ?? null,
                'price' => (float) ($item['price'] ?? 0),
                'billing_unit' => $billingUnit,
                'capacity' => isset($item['capacity']) ? (int) $item['capacity'] : null,
                'surface' => $item['surface'] ?? $surface,
                'furnished' => $item['furnished'] ?? $furnished,
                'condition' => $item['condition'] ?? $condition,
                'listing_kind' => $item['listing_kind'] ?? $listingKind,
                'duration_label' => $item['duration_label'] ?? null,
                'rating' => (float) ($item['rating'] ?? 0),
                'reviews_count' => (int) ($item['reviews_count'] ?? 0),
                'status' => 'active',
                'is_featured' => (bool) ($item['is_featured'] ?? false),
                'features' => is_array($item['features'] ?? null) ? $item['features'] : [],
                'image_url' => $item['image_url'] ?? null,
                'source_url' => $item['source_url'] ?? null,
                'available_from' => $item['available_from'] ?? null,
                'available_to' => $item['available_to'] ?? null,
            ]);

            $inserted++;
        }

        $this->info("Import termine : {$inserted} annonces ajoutees, {$skipped} ignorees.");

        return self::SUCCESS;
    }
}
