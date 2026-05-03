<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PlatformOverviewController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $services = Service::query()
            ->with('provider:id,name,city')
            ->where('status', 'active')
            ->orderByDesc('is_featured')
            ->orderByDesc('rating')
            ->get();

        $stats = [
            'services' => $services->count(),
            'providers' => User::query()->where('role', 'provider')->count(),
            'clients' => User::query()->where('role', 'client')->count(),
            'bookings' => Booking::query()->count(),
        ];

        $serviceTypes = [
            [
                'key' => 'house_rental',
                'label' => 'Location de maisons',
                'description' => 'Appartements, villas et logements equipes.',
                'count' => $services->where('service_type', 'house_rental')->count(),
            ],
            [
                'key' => 'furniture_rental',
                'label' => 'Location de mafrouchat',
                'description' => 'Salons, tables, chaises et equipements pour evenements.',
                'count' => $services->where('service_type', 'furniture_rental')->count(),
            ],
            [
                'key' => 'home_service',
                'label' => 'Services a domicile',
                'description' => 'Menage, plomberie, electricite et jardinage.',
                'count' => $services->where('service_type', 'home_service')->count(),
            ],
        ];

        return response()->json([
            'platform' => [
                'name' => 'Khadamat Dar',
                'tagline' => 'La plateforme PFE qui relie clients et prestataires de services a domicile.',
                'cities' => $services->pluck('location_city')->unique()->values(),
            ],
            'stats' => $stats,
            'serviceTypes' => $serviceTypes,
            'featuredServices' => $services->take(3)->map(fn (Service $service) => [
                'id' => $service->id,
                'title' => $service->title,
                'service_type' => $service->service_type,
                'category' => $service->category,
                'location_city' => $service->location_city,
                'price' => (float) $service->price,
                'billing_unit' => $service->billing_unit,
                'rating' => (float) $service->rating,
                'provider' => $service->provider?->only(['name', 'city']),
            ])->values(),
        ]);
    }
}
