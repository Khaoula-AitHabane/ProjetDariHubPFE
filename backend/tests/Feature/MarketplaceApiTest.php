<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketplaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_platform_overview_data(): void
    {
        $this->seed();

        $response = $this->getJson('/api/platform/overview');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'platform' => ['name', 'tagline', 'cities'],
                'stats' => ['services', 'providers', 'clients', 'bookings'],
                'serviceTypes',
                'featuredServices',
            ]);
    }

    public function test_it_filters_services_by_type(): void
    {
        $provider = User::query()->create([
            'name' => 'Provider Filter',
            'email' => 'provider.filter@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Casablanca',
        ]);

        foreach (range(1, 4) as $index) {
            Service::query()->create([
                'provider_id' => $provider->id,
                'service_type' => 'home_service',
                'category' => 'Nettoyage',
                'title' => "Service menage {$index}",
                'description' => 'Nettoyage complet a domicile.',
                'location_city' => 'Casablanca',
                'location_address' => 'Maarif, Casablanca',
                'phone' => '0612345678',
                'price' => 250,
                'billing_unit' => 'per_service',
                'status' => 'active',
            ]);
        }

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'furniture_rental',
            'category' => 'salon - Neuf',
            'title' => 'Canape premium',
            'description' => 'Canape moderne en excellent etat.',
            'location_city' => 'Rabat',
            'location_address' => 'Agdal, Rabat',
            'phone' => '0612345678',
            'price' => 600,
            'billing_unit' => 'per_day',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/services?type=home_service');

        $response
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.service_type', 'home_service');
    }

    public function test_it_creates_a_booking_from_api_request(): void
    {
        $provider = User::query()->create([
            'name' => 'Salma Home Services',
            'email' => 'salma.booking@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        $serviceId = Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'home_service',
            'category' => 'Nettoyage',
            'title' => 'Menage premium a domicile',
            'description' => 'Intervention rapide et soignee.',
            'location_city' => 'Rabat',
            'location_address' => 'Hay Riad, Rabat',
            'phone' => '0612345678',
            'price' => 250,
            'billing_unit' => 'per_service',
            'status' => 'active',
        ])->id;

        $response = $this->postJson('/api/bookings', [
            'service_id' => $serviceId,
            'client_name' => 'Nouveau Client',
            'client_email' => 'nouveau.client@example.com',
            'client_phone' => '0612345678',
            'start_date' => '2026-05-12',
            'end_date' => '2026-05-12',
            'quantity' => 2,
            'payment_method' => 'cash',
            'service_address' => 'Hay Riad, Rabat',
            'notes' => 'Merci de confirmer par telephone.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.total_amount', 500)
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_authenticated_provider_can_publish_a_service_and_list_own_services(): void
    {
        $provider = User::query()->create([
            'name' => 'Provider Test',
            'email' => 'provider@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Casablanca',
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => $provider->email,
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/services', [
                'service_type' => 'home_service',
                'category' => 'Climatisation',
                'title' => 'Installation climatiseur premium',
                'description' => 'Pose, mise en service et verification finale.',
                'location_city' => 'Casablanca',
                'location_address' => 'Bourgogne, Casablanca',
                'price' => 600,
                'billing_unit' => 'per_service',
                'duration_label' => 'Intervention sur rendez-vous',
                'features' => ['Diagnostic', 'Pose', 'Garantie 30 jours'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.provider.id', $provider->id)
            ->assertJsonPath('data.status', 'pending');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/my/services')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Installation climatiseur premium');

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonMissing(['title' => 'Installation climatiseur premium']);
    }

    public function test_authenticated_provider_only_sees_its_own_bookings_in_management_view(): void
    {
        $provider = User::query()->create([
            'name' => 'Salma Home Services',
            'email' => 'salma.services@khadamat.ma',
            'password' => 'password',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        $otherProvider = User::query()->create([
            'name' => 'Autre Provider',
            'email' => 'other.provider@example.com',
            'password' => 'password',
            'role' => 'provider',
            'city' => 'Casablanca',
        ]);

        $client = User::query()->create([
            'name' => 'Client Test',
            'email' => 'client.test@example.com',
            'password' => 'password',
            'role' => 'client',
            'city' => 'Rabat',
        ]);

        $salmaService = Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'home_service',
            'category' => 'Nettoyage',
            'title' => 'Menage express Rabat',
            'description' => 'Nettoyage rapide et fiable.',
            'location_city' => 'Rabat',
            'location_address' => 'Hay Riad, Rabat',
            'phone' => '0612345678',
            'price' => 250,
            'billing_unit' => 'per_service',
            'status' => 'active',
        ]);

        $otherService = Service::query()->create([
            'provider_id' => $otherProvider->id,
            'service_type' => 'home_service',
            'category' => 'Climatisation',
            'title' => 'Maintenance climatiseur Casablanca',
            'description' => 'Entretien complet et verification.',
            'location_city' => 'Casablanca',
            'location_address' => 'Bourgogne, Casablanca',
            'phone' => '0612345678',
            'price' => 400,
            'billing_unit' => 'per_service',
            'status' => 'active',
        ]);

        Booking::query()->create([
            'service_id' => $salmaService->id,
            'client_id' => $client->id,
            'provider_id' => $provider->id,
            'booking_reference' => 'PFE-SALMA01',
            'start_date' => '2026-05-12',
            'end_date' => '2026-05-12',
            'quantity' => 1,
            'total_amount' => 250,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cash',
            'service_address' => 'Hay Riad, Rabat',
        ]);

        Booking::query()->create([
            'service_id' => $otherService->id,
            'client_id' => $client->id,
            'provider_id' => $otherProvider->id,
            'booking_reference' => 'PFE-OTHER01',
            'start_date' => '2026-05-13',
            'end_date' => '2026-05-13',
            'quantity' => 1,
            'total_amount' => 400,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cash',
            'service_address' => 'Bourgogne, Casablanca',
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'salma.services@khadamat.ma',
            'password' => 'password',
        ]);

        $token = $loginResponse->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.provider.name', 'Salma Home Services');
    }
}
