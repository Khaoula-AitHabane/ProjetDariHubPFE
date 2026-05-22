<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Support\Services\ServiceDataPresenter;
use App\Domain\Moderation\Services\AiModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $servicesQuery = Service::query()
            ->with('provider:id,name,role,city,phone')
            ->where('status', 'active') // public ne voit que les annonces approuvees
            ->when(
                $request->string('type')->toString(),
                fn ($q, string $type) => $q->where('service_type', $type),
            )
            ->when(
                $request->string('city')->toString(),
                fn ($q, string $city) => $q->where('location_city', $city),
            )
            ->when(
                $request->filled('featured'),
                fn ($q) => $q->where('is_featured', filter_var($request->input('featured'), FILTER_VALIDATE_BOOL)),
            )
            ->when(
                $request->filled('min_price'),
                fn ($q) => $q->where('price', '>=', (float) $request->input('min_price')),
            )
            ->when(
                $request->filled('max_price'),
                fn ($q) => $q->where('price', '<=', (float) $request->input('max_price')),
            )
            ->when(
                $request->filled('min_surface'),
                fn ($q) => $q->where('surface', '>=', (int) $request->input('min_surface')),
            )
            ->when(
                $request->filled('max_surface'),
                fn ($q) => $q->where('surface', '<=', (int) $request->input('max_surface')),
            )
            ->when(
                $request->filled('furnished'),
                fn ($q) => $q->where('furnished', filter_var($request->input('furnished'), FILTER_VALIDATE_BOOL)),
            )
            ->when(
                $request->string('condition')->toString(),
                fn ($q, string $c) => $q->where('condition', $c),
            )
            ->when(
                $request->string('listing_kind')->toString(),
                fn ($q, string $k) => $q->where('listing_kind', $k),
            )
            ->when($request->string('search')->toString(), function ($q, string $search) {
                $q->where(function ($inner) use ($search): void {
                    $inner
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('location_city', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('is_featured')
            ->orderByDesc('rating')
            ->orderBy('price');

        $services = $servicesQuery->get();

        return response()->json([
            'data' => $services->map(fn (Service $s) => ServiceDataPresenter::fromModel($s))->values(),
            'meta' => [
                'availableCities' => Service::query()
                    ->where('status', 'active')
                    ->select('location_city')->distinct()->orderBy('location_city')->pluck('location_city'),
                'availableTypes' => Service::query()
                    ->where('status', 'active')
                    ->select('service_type')->distinct()->orderBy('service_type')->pluck('service_type'),
            ],
        ]);
    }

    public function show(Service $service): JsonResponse
    {
        $service->load('provider:id,name,role,city,phone,bio');

        return response()->json([
            'data' => ServiceDataPresenter::fromModel($service),
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }

        $services = Service::query()
            ->with('provider:id,name,role,city,phone')
            ->where('provider_id', $user->id) // chaque user voit uniquement ses propres annonces
            ->latest()
            ->get();

        return response()->json([
            'data' => $services->map(fn (Service $s) => ServiceDataPresenter::fromModel($s))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }

        $validated = $request->validate([
            'service_type' => ['required', Rule::in(['house_rental', 'furniture_rental', 'home_service'])],
            'category' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:255', 'unique:services,title'],
            'description' => ['required', 'string', 'max:2000'],
            'location_city' => ['required', 'string', 'max:120'],
            'location_address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_unit' => ['required', Rule::in(['per_night', 'per_day', 'per_service'])],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'surface' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'furnished' => ['nullable', 'boolean'],
            'condition' => ['nullable', Rule::in(['new', 'used'])],
            'listing_kind' => ['nullable', Rule::in(['rent', 'sale'])],
            'duration_label' => ['nullable', 'string', 'max:120'],
            'features' => ['nullable', 'array', 'max:10'],
            'features.*' => ['string', 'max:60'],
            'image_url' => ['nullable', 'string', 'max:3000000'],
            'available_from' => ['nullable', 'date'],
            'available_to' => ['nullable', 'date', 'after_or_equal:available_from'],
        ]);

        // Admin publie en 'active' directement, les autres en 'pending' (validation requise).
        $status = $user->role === 'admin' ? 'active' : 'pending';

        // AI Moderation Analysis (if it's not an admin)
        $aiData = [];
        if ($user->role !== 'admin') {
            try {
                /** @var AiModerationService $aiService */
                $aiService = app(AiModerationService::class);
                $aiResult = $aiService->moderate(
                    title:       $validated['title'],
                    description: $validated['description'],
                    phone:       $validated['phone'] ?? '',
                    price:       (float) $validated['price'],
                );

                $aiData = [
                    'ai_risk_score'     => $aiResult->confidence,
                    'ai_risk_level'     => $aiResult->riskLevel,
                    'ai_is_suspicious'  => $aiResult->isSuspicious,
                    'ai_reasons'        => $aiResult->reasons,
                    'ai_recommendation' => $aiResult->recommendation,
                    'ai_checked'        => true,
                ];
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('AI Moderation failed during service creation: ' . $e->getMessage());
            }
        }

        $service = Service::query()->create(array_merge($validated, $aiData, [
            'provider_id' => $user->id,
            'status' => $status,
            'features' => $this->sanitizeFeatures($validated['features'] ?? []),
        ]));

        $service->load('provider:id,name,role,city,phone,bio');

        return response()->json([
            'message' => $status === 'active'
                ? 'Annonce publiee avec succes.'
                : 'Annonce envoyee. En attente de validation par un administrateur.',
            'data' => ServiceDataPresenter::fromModel($service),
        ], 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }
        if ($service->provider_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Action non autorisee.'], 403);
        }

        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'max:120'],
            'title' => ['sometimes', 'string', 'max:255', Rule::unique('services', 'title')->ignore($service->id)],
            'description' => ['sometimes', 'string', 'max:2000'],
            'location_city' => ['sometimes', 'string', 'max:120'],
            'location_address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'surface' => ['nullable', 'integer'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'furnished' => ['nullable', 'boolean'],
            'condition' => ['nullable', Rule::in(['new', 'used'])],
            'listing_kind' => ['nullable', Rule::in(['rent', 'sale'])],
            'image_url' => ['nullable', 'string', 'max:3000000'],
        ]);

        if ($user->role !== 'admin') {
            $validated['status'] = 'pending';
        }

        $service->update($validated);
        $service->load('provider:id,name,role,city,phone,bio');

        return response()->json([
            'message' => ($user->role !== 'admin')
                ? 'Annonce mise a jour et renvoyee en validation.'
                : 'Annonce mise a jour.',
            'data' => ServiceDataPresenter::fromModel($service),
        ]);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }
        if ($service->provider_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Action non autorisee.'], 403);
        }
        $service->delete();
        return response()->json(['message' => 'Annonce supprimee.']);
    }

    /**
     * @param  array<int, string>  $features
     * @return array<int, string>
     */
    private function sanitizeFeatures(array $features): array
    {
        return array_values(array_filter(
            array_map(static fn (string $feature): string => trim($feature), $features),
            static fn (string $feature): bool => $feature !== '',
        ));
    }
}
