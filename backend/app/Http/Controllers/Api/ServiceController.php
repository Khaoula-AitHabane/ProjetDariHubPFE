<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $servicesQuery = Service::query()
            ->with('provider:id,name,role,city,phone')
            ->where('status', 'active')
            ->when(
                $request->string('type')->toString(),
                fn ($query, string $type) => $query->where('service_type', $type),
            )
            ->when(
                $request->string('city')->toString(),
                fn ($query, string $city) => $query->where('location_city', $city),
            )
            ->when(
                $request->filled('featured'),
                fn ($query) => $query->where('is_featured', filter_var($request->input('featured'), FILTER_VALIDATE_BOOL)),
            )
            ->when(
                $request->filled('max_price'),
                fn ($query) => $query->where('price', '<=', (float) $request->input('max_price')),
            )
            ->when($request->string('search')->toString(), function ($query, string $search) {
                $query->where(function ($innerQuery) use ($search): void {
                    $innerQuery
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
            'data' => $services->map(fn (Service $service) => $this->transformService($service))->values(),
            'meta' => [
                'availableCities' => Service::query()->select('location_city')->distinct()->orderBy('location_city')->pluck('location_city'),
                'availableTypes' => Service::query()->select('service_type')->distinct()->orderBy('service_type')->pluck('service_type'),
            ],
        ]);
    }

    public function show(Service $service): JsonResponse
    {
        $service->load('provider:id,name,role,city,phone,bio');

        return response()->json([
            'data' => $this->transformService($service),
        ]);
    }

    private function transformService(Service $service): array
    {
        return [
            'id' => $service->id,
            'title' => $service->title,
            'service_type' => $service->service_type,
            'category' => $service->category,
            'description' => $service->description,
            'location_city' => $service->location_city,
            'location_address' => $service->location_address,
            'price' => (float) $service->price,
            'billing_unit' => $service->billing_unit,
            'capacity' => $service->capacity,
            'duration_label' => $service->duration_label,
            'rating' => (float) $service->rating,
            'reviews_count' => $service->reviews_count,
            'status' => $service->status,
            'is_featured' => $service->is_featured,
            'features' => $service->features ?? [],
            'image_url' => $service->image_url,
            'available_from' => optional($service->available_from)->toDateString(),
            'available_to' => optional($service->available_to)->toDateString(),
            'provider' => $service->provider?->only(['id', 'name', 'role', 'city', 'phone', 'bio']),
        ];
    }
}
