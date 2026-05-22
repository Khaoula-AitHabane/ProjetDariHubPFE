<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Admin\AdminPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim($request->string('search')->toString());
        $status = trim($request->string('status')->toString());

        $users = User::query()
            ->withCount('providedServices')
            ->when($status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->limit(500)
            ->get();

        return response()->json([
            'data' => $users->map(fn (User $user): array => AdminPresenter::user($user))->values(),
            'meta' => [
                'totals' => [
                    'all' => User::query()->count(),
                    'active' => User::query()->where('status', 'actif')->count(),
                    'blocked' => User::query()->where('status', 'bloque')->count(),
                    'admins' => User::query()->where('role', 'admin')->count(),
                ],
            ],
        ]);
    }

    public function block(Request $request, User $user): JsonResponse
    {
        $this->guardManagedUser($request, $user);

        $user->update(['status' => 'bloque']);
        $user->apiTokens()->delete();
        $user->loadCount('providedServices');

        return response()->json([
            'message' => 'Utilisateur bloque avec succes.',
            'data' => AdminPresenter::user($user),
        ]);
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        $this->guardManagedUser($request, $user);

        $user->update(['status' => 'actif']);
        $user->loadCount('providedServices');

        return response()->json([
            'message' => 'Utilisateur debloque avec succes.',
            'data' => AdminPresenter::user($user),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->guardManagedUser($request, $user);
        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprime avec succes.',
        ]);
    }

    private function guardManagedUser(Request $request, User $user): void
    {
        if ($request->user()?->is($user)) {
            throw new HttpResponseException(response()->json([
                'message' => 'Vous ne pouvez pas modifier votre propre compte administrateur.',
            ], 422));
        }

        if ($user->role === 'admin') {
            throw new HttpResponseException(response()->json([
                'message' => 'Les autres comptes administrateurs ne peuvent pas etre bloques ou supprimes depuis ce tableau.',
            ], 422));
        }
    }
}
