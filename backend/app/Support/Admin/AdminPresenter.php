<?php

namespace App\Support\Admin;

use App\Models\Report;
use App\Models\Service;
use App\Models\User;

class AdminPresenter
{
    public static function service(Service $service): array
    {
        $provider = $service->provider;

        return [
            'id' => $service->id,
            'title' => $service->title,
            'service_type' => $service->service_type,
            'category' => $service->category,
            'description' => $service->description,
            'city' => $service->location_city,
            'address' => $service->location_address,
            'price' => (float) $service->price,
            'billing_unit' => $service->billing_unit,
            'surface' => $service->surface,
            'bedrooms' => $service->bedrooms,
            'capacity' => $service->capacity,
            'condition' => $service->condition,
            'listing_kind' => $service->listing_kind,
            'features' => $service->features ?? [],
            'image_url' => $service->image_url,
            'source_url' => $service->source_url,
            'status' => self::serviceStatus($service->status),
            'raw_status' => $service->status,
            'created_at' => $service->created_at?->toIso8601String(),
            'provider' => $provider ? [
                'id' => $provider->id,
                'name' => $provider->name,
                'email' => $provider->email,
                'phone' => $provider->phone,
                'role' => $provider->role,
                'city' => $provider->city,
                'status' => self::userStatus($provider->status),
            ] : null,
            'ai_risk_score' => $service->ai_risk_score,
            'ai_risk_level' => $service->ai_risk_level,
            'ai_is_suspicious' => (bool) $service->ai_is_suspicious,
            'ai_reasons' => $service->ai_reasons ?? [],
            'ai_recommendation' => $service->ai_recommendation,
            'ai_checked' => (bool) $service->ai_checked,
        ];
    }

    public static function user(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'city' => $user->city,
            'status' => self::userStatus($user->status),
            'annonces_count' => $user->provided_services_count ?? 0,
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }

    public static function report(Report $report): array
    {
        $service = $report->service;
        $provider = $service?->provider;
        $reporter = $report->reporter;

        return [
            'id' => $report->id,
            'reason' => $report->reason,
            'message' => $report->message,
            'status' => $report->status,
            'created_at' => $report->created_at?->toIso8601String(),
            'reporter' => $reporter ? [
                'id' => $reporter->id,
                'name' => $reporter->name,
                'email' => $reporter->email,
            ] : null,
            'annonce' => $service ? self::service($service) : null,
            'reported_user' => $provider ? [
                'id' => $provider->id,
                'name' => $provider->name,
                'email' => $provider->email,
                'phone' => $provider->phone,
                'status' => self::userStatus($provider->status),
            ] : null,
        ];
    }

    public static function serviceStatus(?string $status): string
    {
        return match ($status) {
            'pending', 'en_attente' => 'en_attente',
            'active', 'validee' => 'validee',
            'rejected', 'refusee' => 'refusee',
            default => (string) $status,
        };
    }

    public static function databaseServiceStatus(?string $status): ?string
    {
        return match ($status) {
            null, '', 'all' => null,
            'pending', 'en_attente' => 'pending',
            'active', 'validee' => 'active',
            'rejected', 'refusee' => 'rejected',
            default => null,
        };
    }

    public static function userStatus(?string $status): string
    {
        return $status === 'bloque' ? 'bloque' : 'actif';
    }
}
