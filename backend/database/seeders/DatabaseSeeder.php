<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@khadamat.ma'],
            [
                'name' => 'Administrateur PFE',
                'password' => 'password',
                'role' => 'admin',
                'phone' => '0600000001',
                'city' => 'Casablanca',
                'address' => 'Quartier des affaires, Casablanca',
                'bio' => 'Supervise les prestataires, les reservations et les paiements.',
            ],
        );

        $houseProvider = User::query()->updateOrCreate(
            ['email' => 'asmae.houses@khadamat.ma'],
            [
                'name' => 'Asmae Immobilier',
                'password' => 'password',
                'role' => 'provider',
                'phone' => '0600000002',
                'city' => 'Casablanca',
                'address' => 'Ain Diab, Casablanca',
                'bio' => 'Publication et gestion de logements familiaux et saisonniers.',
            ],
        );

        $furnitureProvider = User::query()->updateOrCreate(
            ['email' => 'youssef.mafrouchat@khadamat.ma'],
            [
                'name' => 'Youssef Mafrouchat',
                'password' => 'password',
                'role' => 'provider',
                'phone' => '0600000003',
                'city' => 'Marrakech',
                'address' => 'Gueliz, Marrakech',
                'bio' => 'Location de salons, tables et chaises pour evenements et sejours.',
            ],
        );

        $homeServiceProvider = User::query()->updateOrCreate(
            ['email' => 'salma.services@khadamat.ma'],
            [
                'name' => 'Salma Home Services',
                'password' => 'password',
                'role' => 'provider',
                'phone' => '0600000004',
                'city' => 'Rabat',
                'address' => 'Hassan, Rabat',
                'bio' => 'Services a domicile: menage, plomberie, electricite et jardinage.',
            ],
        );

        $clientOne = User::query()->updateOrCreate(
            ['email' => 'client.one@khadamat.ma'],
            [
                'name' => 'Imane Client',
                'password' => 'password',
                'role' => 'client',
                'phone' => '0600000005',
                'city' => 'Casablanca',
                'address' => 'Maarif, Casablanca',
                'bio' => 'Reserve regulierement des logements et des services menagers.',
            ],
        );

        $clientTwo = User::query()->updateOrCreate(
            ['email' => 'client.two@khadamat.ma'],
            [
                'name' => 'Karim Client',
                'password' => 'password',
                'role' => 'client',
                'phone' => '0600000006',
                'city' => 'Rabat',
                'address' => 'Agdal, Rabat',
                'bio' => 'Utilise la plateforme pour les depannages rapides et les equipements.',
            ],
        );

        $services = [
            [
                'provider_id' => $houseProvider->id,
                'service_type' => 'house_rental',
                'category' => 'Maison',
                'title' => 'Appartement familial avec terrasse',
                'description' => 'Appartement meuble avec cuisine equipee, Wi-Fi et parking prive a quelques minutes de la corniche.',
                'location_city' => 'Casablanca',
                'location_address' => 'Ain Diab, Casablanca',
                'price' => 850,
                'billing_unit' => 'per_night',
                'capacity' => 5,
                'duration_label' => 'Disponible a la nuit ou a la semaine',
                'rating' => 4.8,
                'reviews_count' => 37,
                'status' => 'active',
                'is_featured' => true,
                'features' => ['Wi-Fi', 'Parking', 'Cuisine equipee', 'Vue terrasse'],
                'image_url' => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-05',
                'available_to' => '2026-12-31',
            ],
            [
                'provider_id' => $houseProvider->id,
                'service_type' => 'house_rental',
                'category' => 'Villa',
                'title' => 'Villa piscine pour weekend',
                'description' => 'Villa spacieuse pour familles et petits groupes avec jardin, piscine et service de gardiennage.',
                'location_city' => 'Marrakech',
                'location_address' => 'Route de l Ourika, Marrakech',
                'price' => 1800,
                'billing_unit' => 'per_night',
                'capacity' => 8,
                'duration_label' => 'Reservation minimum de 2 nuits',
                'rating' => 4.9,
                'reviews_count' => 19,
                'status' => 'active',
                'is_featured' => true,
                'features' => ['Piscine', 'Jardin', 'Climatisation', 'Cuisine ouverte'],
                'image_url' => 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-10',
                'available_to' => '2026-11-30',
            ],
            [
                'provider_id' => $furnitureProvider->id,
                'service_type' => 'furniture_rental',
                'category' => 'Mafrouchat',
                'title' => 'Pack salon marocain evenement',
                'description' => 'Salon complet avec banquettes, tables basses et tapis pour receptions familiales et fetes.',
                'location_city' => 'Marrakech',
                'location_address' => 'Gueliz, Marrakech',
                'price' => 1200,
                'billing_unit' => 'per_day',
                'capacity' => 12,
                'duration_label' => 'Livraison et recuperation incluses',
                'rating' => 4.7,
                'reviews_count' => 24,
                'status' => 'active',
                'is_featured' => true,
                'features' => ['Livraison', 'Installation', 'Tapis inclus', 'Style traditionnel'],
                'image_url' => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-04',
                'available_to' => '2026-12-31',
            ],
            [
                'provider_id' => $furnitureProvider->id,
                'service_type' => 'furniture_rental',
                'category' => 'Reception',
                'title' => 'Tables et chaises pour receptions',
                'description' => 'Lot flexible de tables rondes, chaises rembourrees et nappes pour ceremonies et reunions.',
                'location_city' => 'Rabat',
                'location_address' => 'Souissi, Rabat',
                'price' => 450,
                'billing_unit' => 'per_day',
                'capacity' => 20,
                'duration_label' => 'Tarif journalier selon quantite',
                'rating' => 4.5,
                'reviews_count' => 15,
                'status' => 'active',
                'is_featured' => false,
                'features' => ['Montage rapide', 'Transport inclus', 'Choix de nappes'],
                'image_url' => 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-04',
                'available_to' => '2026-10-31',
            ],
            [
                'provider_id' => $homeServiceProvider->id,
                'service_type' => 'home_service',
                'category' => 'Menage',
                'title' => 'Menage premium a domicile',
                'description' => 'Equipe experimentee pour nettoyage complet, vitres, sols et cuisine avec produits inclus.',
                'location_city' => 'Casablanca',
                'location_address' => 'Maarif, Casablanca',
                'price' => 250,
                'billing_unit' => 'per_service',
                'capacity' => null,
                'duration_label' => 'Intervention de 3 a 4 heures',
                'rating' => 4.8,
                'reviews_count' => 41,
                'status' => 'active',
                'is_featured' => true,
                'features' => ['Produits inclus', 'Equipe verifiee', 'Ponctualite'],
                'image_url' => 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-03',
                'available_to' => '2026-12-31',
            ],
            [
                'provider_id' => $homeServiceProvider->id,
                'service_type' => 'home_service',
                'category' => 'Plomberie',
                'title' => 'Plomberie express 7j/7',
                'description' => 'Depannage de fuites, chauffe-eau, robinetterie et entretien sanitaire dans la journee.',
                'location_city' => 'Rabat',
                'location_address' => 'Agdal, Rabat',
                'price' => 320,
                'billing_unit' => 'per_service',
                'capacity' => null,
                'duration_label' => 'Diagnostic et intervention rapide',
                'rating' => 4.6,
                'reviews_count' => 18,
                'status' => 'active',
                'is_featured' => false,
                'features' => ['Urgence', 'Pieces standard', 'Technicien certifie'],
                'image_url' => 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-03',
                'available_to' => '2026-12-31',
            ],
            [
                'provider_id' => $homeServiceProvider->id,
                'service_type' => 'home_service',
                'category' => 'Electricite',
                'title' => 'Electricien de confiance',
                'description' => 'Installation luminaires, prises, disjoncteurs et verification securite pour appartements et villas.',
                'location_city' => 'Casablanca',
                'location_address' => 'Sidi Maarouf, Casablanca',
                'price' => 280,
                'billing_unit' => 'per_service',
                'capacity' => null,
                'duration_label' => 'Intervention sur rendez-vous',
                'rating' => 4.7,
                'reviews_count' => 22,
                'status' => 'active',
                'is_featured' => false,
                'features' => ['Diagnostic securise', 'Materiel standard', 'Support apres visite'],
                'image_url' => 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-03',
                'available_to' => '2026-12-31',
            ],
            [
                'provider_id' => $homeServiceProvider->id,
                'service_type' => 'home_service',
                'category' => 'Jardinage',
                'title' => 'Entretien jardin et arrosage',
                'description' => 'Tonte, taille, plantation et planification d arrosage pour petits et grands espaces verts.',
                'location_city' => 'Marrakech',
                'location_address' => 'Palmeraie, Marrakech',
                'price' => 390,
                'billing_unit' => 'per_service',
                'capacity' => null,
                'duration_label' => 'Forfait demi-journee',
                'rating' => 4.4,
                'reviews_count' => 11,
                'status' => 'active',
                'is_featured' => false,
                'features' => ['Taille', 'Nettoyage', 'Conseils entretien'],
                'image_url' => 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80',
                'available_from' => '2026-05-04',
                'available_to' => '2026-12-31',
            ],
        ];

        foreach ($services as $serviceData) {
            Service::query()->updateOrCreate(
                ['title' => $serviceData['title']],
                $serviceData,
            );
        }

        $apartment = Service::query()->where('title', 'Appartement familial avec terrasse')->firstOrFail();
        $eventPack = Service::query()->where('title', 'Pack salon marocain evenement')->firstOrFail();
        $cleaning = Service::query()->where('title', 'Menage premium a domicile')->firstOrFail();

        Booking::query()->updateOrCreate(
            ['booking_reference' => 'PFE-0001'],
            [
                'service_id' => $apartment->id,
                'client_id' => $clientOne->id,
                'provider_id' => $apartment->provider_id,
                'start_date' => '2026-05-20',
                'end_date' => '2026-05-23',
                'quantity' => 1,
                'total_amount' => 3400,
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_method' => 'card',
                'service_address' => 'Ain Diab, Casablanca',
                'notes' => 'Arrivee prevue en fin d apres-midi.',
            ],
        );

        Booking::query()->updateOrCreate(
            ['booking_reference' => 'PFE-0002'],
            [
                'service_id' => $eventPack->id,
                'client_id' => $clientTwo->id,
                'provider_id' => $eventPack->provider_id,
                'start_date' => '2026-06-01',
                'end_date' => '2026-06-02',
                'quantity' => 1,
                'total_amount' => 2400,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => 'cash',
                'service_address' => 'Souissi, Rabat',
                'notes' => 'Installation la veille au soir si possible.',
            ],
        );

        Booking::query()->updateOrCreate(
            ['booking_reference' => 'PFE-0003'],
            [
                'service_id' => $cleaning->id,
                'client_id' => $clientOne->id,
                'provider_id' => $cleaning->provider_id,
                'start_date' => '2026-05-08',
                'end_date' => '2026-05-08',
                'quantity' => 1,
                'total_amount' => 250,
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'cash',
                'service_address' => 'Maarif, Casablanca',
                'notes' => 'Nettoyage avant emmagement.',
            ],
        );
    }
}
