<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiSmartSearchApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_smart_search_interprets_the_query_and_returns_paginated_results(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');
        config()->set('services.gemini.model', 'gemini-2.5-flash');
        config()->set('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '{"service_type":"house_rental","listing_kind":"rent","category":"maison","city":"Casablanca","price_min":0,"price_max":4000,"surface_min":0,"surface_max":0,"bedrooms_min":2,"availability":"","keywords":["pas chere"]}',
                                ],
                            ],
                        ],
                    ],
                ],
                'usageMetadata' => [
                    'totalTokenCount' => 112,
                ],
            ]),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Search',
            'email' => 'provider-search@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Casablanca',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Maison - A louer',
            'title' => 'Maison familiale economique',
            'description' => 'Belle maison familiale a Casablanca avec bon rapport qualite-prix.',
            'location_city' => 'Casablanca',
            'price' => 3500,
            'billing_unit' => 'per_night',
            'surface' => 120,
            'bedrooms' => 3,
            'status' => 'active',
            'rating' => 4.7,
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Appartement - A louer',
            'title' => 'Appartement centre ville',
            'description' => 'Appartement moderne en centre ville.',
            'location_city' => 'Casablanca',
            'price' => 5200,
            'billing_unit' => 'per_night',
            'surface' => 90,
            'bedrooms' => 2,
            'status' => 'active',
            'rating' => 4.2,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'je veux une maison pas chere a Casablanca',
            'per_page' => 9,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Recherche intelligente executee avec succes.')
            ->assertJsonPath('meta.query', 'je veux une maison pas chere a Casablanca')
            ->assertJsonPath('meta.interpreted_filters.service_type', 'house_rental')
            ->assertJsonPath('meta.interpreted_filters.city', 'Casablanca')
            ->assertJsonPath('meta.interpreted_filters.price_max', 4000)
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Maison familiale economique');
    }

    public function test_smart_search_supports_home_services_and_today_availability(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '{"service_type":"home_service","listing_kind":"","category":"plomberie","city":"","price_min":0,"price_max":0,"surface_min":0,"surface_max":0,"bedrooms_min":0,"availability":"today","keywords":["plomberie"]}',
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Plomberie',
            'email' => 'plomberie@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'home_service',
            'category' => 'Plomberie',
            'title' => 'Plombier disponible aujourd hui',
            'description' => 'Intervention rapide pour depannage et installation.',
            'location_city' => 'Rabat',
            'price' => 250,
            'billing_unit' => 'per_service',
            'status' => 'active',
            'available_from' => now()->toDateString(),
            'rating' => 4.8,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'service de plomberie disponible aujourd hui',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.interpreted_filters.service_type', 'home_service')
            ->assertJsonPath('meta.interpreted_filters.availability', 'today')
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.category', 'Plomberie');
    }

    public function test_smart_search_falls_back_to_local_interpretation_when_gemini_times_out(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::failedConnection(),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Fallback',
            'email' => 'fallback@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'home_service',
            'category' => 'Plomberie',
            'title' => 'Plombier disponible aujourd hui',
            'description' => 'Intervention rapide a Rabat.',
            'location_city' => 'Rabat',
            'price' => 250,
            'billing_unit' => 'per_service',
            'status' => 'active',
            'available_from' => now()->toDateString(),
            'rating' => 4.6,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'plombier urgent rabat',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.interpreted_filters.service_type', 'home_service')
            ->assertJsonPath('meta.interpreted_filters.category', 'plomberie')
            ->assertJsonPath('meta.interpreted_filters.city', 'Rabat')
            ->assertJsonPath('meta.interpreted_filters.availability', 'today')
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.title', 'Plombier disponible aujourd hui');
    }

    public function test_smart_search_normalizes_darija_terms_and_finds_house_rentals_in_rabat(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::failedConnection(),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Darija',
            'email' => 'darija@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Maison - A louer',
            'title' => 'Maison familiale a Agdal',
            'description' => 'Belle maison disponible a Rabat pour location longue duree.',
            'location_city' => 'Rabat',
            'price' => 4200,
            'billing_unit' => 'per_night',
            'surface' => 130,
            'bedrooms' => 3,
            'status' => 'active',
            'rating' => 4.9,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'dart hadi brit chi dar lakra f rabat',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.interpreted_filters.service_type', 'house_rental')
            ->assertJsonPath('meta.interpreted_filters.listing_kind', 'rent')
            ->assertJsonPath('meta.interpreted_filters.category', 'maison')
            ->assertJsonPath('meta.interpreted_filters.city', 'Rabat')
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.title', 'Maison familiale a Agdal');

        $this->assertContains('location', $response->json('meta.interpreted_filters.keywords', []));
    }

    public function test_smart_search_maps_generic_ai_category_to_service_type(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '{"category":"immobilier","city":"Rabat","keywords":["maison","location"]}',
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Mapping',
            'email' => 'mapping@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Maison - A louer',
            'title' => 'Maison moderne a Rabat',
            'description' => 'Maison avec terrasse proche du centre.',
            'location_city' => 'Rabat',
            'price' => 4600,
            'billing_unit' => 'per_night',
            'status' => 'active',
            'rating' => 4.5,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'je cherche une maison a rabat',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.interpreted_filters.service_type', 'house_rental')
            ->assertJsonPath('meta.interpreted_filters.city', 'Rabat')
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.title', 'Maison moderne a Rabat');
    }

    public function test_smart_search_ignores_city_temporarily_when_the_strict_search_is_empty(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '{"category":"immobilier","city":"Rabat","keywords":["maison","location"]}',
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Temara',
            'email' => 'temara@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Temara',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Maison - A louer',
            'title' => 'Maison calme a Temara',
            'description' => 'Maison disponible immediatement pour location.',
            'location_city' => 'Temara',
            'price' => 3900,
            'billing_unit' => 'per_night',
            'status' => 'active',
            'rating' => 4.3,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'je cherche une maison a rabat',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.search_strategy', 'without_city')
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.location_city', 'Temara');
    }

    public function test_smart_search_ranks_exact_city_and_title_matches_first(): void
    {
        config()->set('services.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::failedConnection(),
        ]);

        $provider = User::query()->create([
            'name' => 'Provider Ranking',
            'email' => 'ranking@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Maison - A louer',
            'title' => 'Maison a louer Agdal',
            'description' => 'Maison familiale proche du centre de Rabat.',
            'location_city' => 'Rabat',
            'price' => 4800,
            'billing_unit' => 'per_night',
            'status' => 'active',
            'rating' => 4.1,
        ]);

        Service::query()->create([
            'provider_id' => $provider->id,
            'service_type' => 'house_rental',
            'category' => 'Villa',
            'title' => 'Villa familiale',
            'description' => 'Maison disponible pour location a Rabat avec jardin.',
            'location_city' => 'Rabat',
            'price' => 4700,
            'billing_unit' => 'per_night',
            'status' => 'active',
            'rating' => 5.0,
        ]);

        $response = $this->postJson('/api/ai/smart-search', [
            'query' => 'chi dar lakra f rabat',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 2)
            ->assertJsonPath('data.0.title', 'Maison a louer Agdal')
            ->assertJsonPath('data.1.title', 'Villa familiale');
    }
}
