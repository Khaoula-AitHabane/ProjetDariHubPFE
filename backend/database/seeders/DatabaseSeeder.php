<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed only a minimal set of real accounts. Aucune annonce fictive n est
     * inseree : le catalogue est rempli soit par les utilisateurs via l API,
     * soit par le scraper Playwright (voir dossier /scraper + commande
     * "php artisan services:import").
     */
    public function run(): void
    {
        // Compte administrateur pour superviser la plateforme.
        User::query()->updateOrCreate(
            ['email' => 'admin@darsouk.ma'],
            [
                'name' => 'Administrateur DarSouk',
                'password' => 'password',
                'role' => 'admin',
                'status' => 'actif',
                'phone' => '0600000000',
                'city' => 'Casablanca',
                'address' => 'Casablanca, Maroc',
                'bio' => 'Supervise les annonces, utilisateurs et imports.',
            ],
        );

        // Compte "scraper" reserve au bot d import (pas de donnees fictives,
        // sert uniquement comme provider_id pour les annonces importees
        // depuis des sites tiers).
        User::query()->updateOrCreate(
            ['email' => 'scraper@darsouk.ma'],
            [
                'name' => 'Bot Import',
                'password' => 'password',
                'role' => 'provider',
                'status' => 'actif',
                'phone' => '0600000001',
                'city' => 'Casablanca',
                'address' => '—',
                'bio' => 'Compte technique : importe des annonces reelles depuis Avito/Mubawab.',
            ],
        );
    }
}
