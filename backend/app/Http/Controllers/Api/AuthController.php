<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', 'in:client,provider'],
            'phone' => ['nullable', 'string', 'max:30'],
            'city' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => Str::lower($validated['email']),
            'password' => $validated['password'],
            'role' => $validated['role'] ?? 'client',
            'status' => 'actif',
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
        ]);

        return response()->json([
            'message' => 'Compte cree avec succes.',
            ...$this->issueTokenPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', Str::lower($validated['email']))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect.',
            ], 422);
        }

        if ($user->status === 'bloque') {
            return response()->json([
                'message' => 'Votre compte a ete bloque par un administrateur.',
            ], 403);
        }

        return response()->json([
            'message' => 'Connexion reussie.',
            ...$this->issueTokenPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->transformUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var ApiToken|null $apiToken */
        $apiToken = $request->attributes->get('current_api_token');

        if ($apiToken) {
            $apiToken->delete();
        }

        return response()->json([
            'message' => 'Deconnexion effectuee.',
        ]);
    }

    private function issueTokenPayload(User $user): array
    {
        $plainTextToken = Str::random(64);

        $user->apiTokens()->create([
            'name' => 'web',
            'token' => hash('sha256', $plainTextToken),
            'last_used_at' => now(),
        ]);

        return [
            'token' => $plainTextToken,
            'data' => $this->transformUser($user),
        ];
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone' => $user->phone,
            'city' => $user->city,
            'address' => $user->address,
            'bio' => $user->bio,
        ];
    }
}
