<?php

namespace Tests\Feature;

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
}
