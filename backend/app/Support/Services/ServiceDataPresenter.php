<?php

namespace App\Support\Services;

use App\Models\Service;

class ServiceDataPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function fromModel(Service $service): array
    {
        return [
            'id' => $service->id,
            'title' => $service->title,
            'service_type' => $service->service_type,
            'category' => $service->category,
            'description' => $service->description,
            'location_city' => $service->location_city,
            'location_address' => $service->location_address,
            'phone' => $service->phone,
            'latitude' => $service->latitude !== null ? (float) $service->latitude : null,
            'longitude' => $service->longitude !== null ? (float) $service->longitude : null,
            'price' => (float) $service->price,
            'billing_unit' => $service->billing_unit,
            'capacity' => $service->capacity,
            'surface' => $service->surface,
            'bedrooms' => $service->bedrooms,
            'furnished' => $service->furnished,
            'condition' => $service->condition,
            'listing_kind' => $service->listing_kind,
            'duration_label' => $service->duration_label,
            'rating' => (float) $service->rating,
            'reviews_count' => $service->reviews_count,
            'status' => $service->status,
            'is_featured' => $service->is_featured,
            'features' => $service->features ?? [],
            'image_url' => $service->image_url,
            'source_url' => $service->source_url,
            'available_from' => optional($service->available_from)->toDateString(),
            'available_to' => optional($service->available_to)->toDateString(),
            'provider' => $service->provider?->only(['id', 'name', 'role', 'city', 'phone', 'bio']),
            'created_at' => $service->created_at?->toIso8601String(),
        ];
    }
}
