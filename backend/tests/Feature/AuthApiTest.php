<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Sanae Test',
            'email' => 'sanae@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'client',
            'phone' => '0612345678',
            'city' => 'Casablanca',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.email', 'sanae@example.com')
            ->assertJsonPath('data.role', 'client');

        $this->assertDatabaseHas('users', [
            'email' => 'sanae@example.com',
            'role' => 'client',
        ]);
    }

    public function test_user_can_login_read_profile_and_logout(): void
    {
        $user = User::query()->create([
            'name' => 'Karim Login',
            'email' => 'karim@example.com',
            'password' => 'password123',
            'role' => 'provider',
            'city' => 'Rabat',
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        $loginResponse
            ->assertOk()
            ->assertJsonPath('data.role', 'provider');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Deconnexion effectuee.');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertUnauthorized();
    }
}
