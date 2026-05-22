<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\Service;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_dashboard_and_statistics(): void
    {
        $token = $this->loginAdmin();
        $provider = $this->createProvider();

        Service::query()->create($this->servicePayload($provider->id, 'pending'));
        Service::query()->create($this->servicePayload($provider->id, 'active', 'Villa premium Marrakech'));
        Service::query()->create($this->servicePayload($provider->id, 'rejected', 'Appartement refuse Rabat'));

        $service = Service::query()->firstOrFail();
        Report::query()->create([
            'service_id' => $service->id,
            'reporter_id' => $provider->id,
            'reason' => 'Contenu trompeur',
            'message' => 'Le prix semble incorrect.',
            'status' => 'open',
        ]);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summary.total_users', 2)
            ->assertJsonPath('data.summary.total_annonces', 3)
            ->assertJsonPath('data.summary.pending_annonces', 1)
            ->assertJsonPath('data.summary.accepted_annonces', 1)
            ->assertJsonPath('data.summary.refused_annonces', 1)
            ->assertJsonPath('data.summary.reports_count', 1);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/statistics')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'annonces_by_city',
                    'annonces_by_category',
                    'users_by_month',
                    'moderation_breakdown',
                ],
            ]);
    }

    public function test_admin_can_moderate_annonces_manage_reports_and_block_users(): void
    {
        $token = $this->loginAdmin();
        $provider = $this->createProvider();

        $service = Service::query()->create($this->servicePayload($provider->id, 'pending'));
        $report = Report::query()->create([
            'service_id' => $service->id,
            'reporter_id' => $provider->id,
            'reason' => 'Doublon',
            'message' => 'Annonce publiee deux fois.',
            'status' => 'open',
        ]);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/annonces/{$service->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.status', 'validee');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/reports/{$report->id}/ignore")
            ->assertOk()
            ->assertJsonPath('data.status', 'ignored');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/users/{$provider->id}/block")
            ->assertOk()
            ->assertJsonPath('data.status', 'bloque');

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'ignored',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $provider->id,
            'status' => 'bloque',
        ]);
    }

    public function test_admin_accept_and_refuse_notifications_are_created_once_per_final_state(): void
    {
        $token = $this->loginAdmin();
        $provider = $this->createProvider();
        $service = Service::query()->create($this->servicePayload($provider->id, 'pending'));

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/annonces/{$service->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.status', 'validee');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/annonces/{$service->id}/accept")
            ->assertOk()
            ->assertJsonPath('message', 'Annonce deja acceptee.');

        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $provider->id)
                ->where('service_id', $service->id)
                ->where('title', 'Annonce acceptee')
                ->count(),
        );

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/annonces/{$service->id}/refuse")
            ->assertOk()
            ->assertJsonPath('data.status', 'refusee');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/annonces/{$service->id}/refuse")
            ->assertOk()
            ->assertJsonPath('message', 'Annonce deja refusee.');

        $this->assertSame(
            1,
            UserNotification::query()
                ->where('user_id', $provider->id)
                ->where('service_id', $service->id)
                ->where('title', 'Annonce refusee')
                ->count(),
        );
    }

    private function loginAdmin(): string
    {
        User::query()->create([
            'name' => 'Admin DariHub',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => 'admin',
            'status' => 'actif',
            'city' => 'Casablanca',
        ]);

        return $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ])->json('token');
    }

    private function createProvider(): User
    {
        return User::query()->create([
            'name' => 'Provider DariHub',
            'email' => 'provider@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'status' => 'actif',
            'city' => 'Rabat',
            'phone' => '0612345678',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function servicePayload(int $providerId, string $status, string $title = 'Appartement test Casablanca'): array
    {
        return [
            'provider_id' => $providerId,
            'service_type' => 'house_rental',
            'category' => 'Appartement',
            'title' => $title,
            'description' => 'Annonce de test pour le dashboard admin.',
            'location_city' => 'Casablanca',
            'location_address' => 'Maarif',
            'price' => 850000,
            'billing_unit' => 'per_night',
            'status' => $status,
            'image_url' => 'https://example.com/photo.jpg',
        ];
    }
}
