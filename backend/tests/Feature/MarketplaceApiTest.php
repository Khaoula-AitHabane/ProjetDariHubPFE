<?php

namespace Tests\Feature;

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
        $this->seed();

        $response = $this->getJson('/api/services?type=home_service');

        $response
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.service_type', 'home_service');
    }

    public function test_it_creates_a_booking_from_api_request(): void
    {
        $this->seed();

        $serviceId = \App\Models\Service::query()->where('title', 'Menage premium a domicile')->value('id');

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
            ->assertJsonPath('data.provider.id', $provider->id);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/my/services')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Installation climatiseur premium');
    }

    public function test_authenticated_provider_only_sees_its_own_bookings_in_management_view(): void
    {
        $this->seed();

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
