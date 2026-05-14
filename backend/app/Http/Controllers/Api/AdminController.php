<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Liste des annonces filtrees par status (pending/active/rejected ou all).
     */
    public function listings(Request $request): JsonResponse
    {
        $status = $request->string('status', 'pending')->toString();

        $query = Service::query()->with('provider:id,name,email,role,city,phone');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $services = $query->latest()->limit(500)->get();

        return response()->json([
            'data' => $services->map(function (Service $s): array {
                return [
                    'id' => $s->id,
                    'title' => $s->title,
                    'service_type' => $s->service_type,
                    'category' => $s->category,
                    'description' => $s->description,
                    'location_city' => $s->location_city,
                    'price' => (float) $s->price,
                    'status' => $s->status,
                    'image_url' => $s->image_url,
                    'source_url' => $s->source_url,
                    'features' => $s->features ?? [],
                    'created_at' => $s->created_at?->toIso8601String(),
                    'provider' => $s->provider?->only(['id', 'name', 'email', 'role', 'city', 'phone']),
                ];
            })->values(),
            'meta' => [
                'counts' => [
                    'pending' => Service::where('status', 'pending')->count(),
                    'active' => Service::where('status', 'active')->count(),
                    'rejected' => Service::where('status', 'rejected')->count(),
                    'total' => Service::count(),
                ],
            ],
        ]);
    }

    public function approve(Service $service): JsonResponse
    {
        $service->update(['status' => 'active']);
        return response()->json([
            'message' => 'Annonce approuvee.',
            'data' => ['id' => $service->id, 'status' => $service->status],
        ]);
    }

    public function reject(Service $service): JsonResponse
    {
        $service->update(['status' => 'rejected']);
        return response()->json([
            'message' => 'Annonce refusee.',
            'data' => ['id' => $service->id, 'status' => $service->status],
        ]);
    }

    public function deleteListing(Service $service): JsonResponse
    {
        $service->delete();
        return response()->json(['message' => 'Annonce supprimee.']);
    }

    /**
     * Liste de tous les utilisateurs.
     */
    public function users(): JsonResponse
    {
        $users = User::query()
            ->withCount(['providedServices'])
            ->latest()
            ->limit(500)
            ->get();

        return response()->json([
            'data' => $users->map(function (User $u): array {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'role' => $u->role,
                    'city' => $u->city,
                    'services_count' => $u->provided_services_count ?? 0,
                    'created_at' => $u->created_at?->toIso8601String(),
                ];
            })->values(),
            'meta' => [
                'totals' => [
                    'users' => User::count(),
                    'clients' => User::where('role', 'client')->count(),
                    'admins' => User::where('role', 'admin')->count(),
                    'bookings' => Booking::count(),
                ],
            ],
        ]);
    }
}
