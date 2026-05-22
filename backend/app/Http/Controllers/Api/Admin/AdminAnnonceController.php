<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Service;
use App\Models\UserNotification;
use App\Support\Admin\AdminPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnnonceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim($request->string('search')->toString());
        $status = AdminPresenter::databaseServiceStatus($request->string('status')->toString());
        $city = trim($request->string('city')->toString());
        $category = trim($request->string('category')->toString());

        $services = Service::query()
            ->with('provider:id,name,email,phone,role,city,status')
            ->when($status, fn ($query, string $value) => $query->where('status', $value))
            ->when($city !== '', fn ($query) => $query->where('location_city', $city))
            ->when($category !== '', fn ($query) => $query->where('category', $category))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('location_city', 'like', "%{$search}%")
                        ->orWhereHas('provider', function ($providerQuery) use ($search): void {
                            $providerQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->limit(500)
            ->get();

        return response()->json([
            'data' => $services
                ->map(fn (Service $service): array => AdminPresenter::service($service))
                ->values(),
            'meta' => [
                'counts' => $this->counts(),
                'filters' => [
                    'cities' => Service::query()
                        ->select('location_city')
                        ->distinct()
                        ->orderBy('location_city')
                        ->pluck('location_city'),
                    'categories' => Service::query()
                        ->select('category')
                        ->distinct()
                        ->orderBy('category')
                        ->pluck('category'),
                ],
            ],
        ]);
    }

    public function pending(Request $request): JsonResponse
    {
        $request->merge(['status' => 'pending']);

        return $this->index($request);
    }

    public function accept(Service $service): JsonResponse
    {
        $updated = Service::query()
            ->whereKey($service->id)
            ->where('status', '!=', 'active')
            ->update(['status' => 'active']);

        $service->refresh();
        $service->load('provider:id,name,email,phone,role,city,status');

        if ($updated > 0) {
            $this->notifyProvider(
                $service,
                'Annonce acceptee',
                "Votre annonce \"{$service->title}\" a ete acceptee par l'administrateur et elle est maintenant visible sur la plateforme.",
            );
        }

        return response()->json([
            'message' => $updated > 0 ? 'Annonce acceptee avec succes.' : 'Annonce deja acceptee.',
            'data' => AdminPresenter::service($service),
        ]);
    }

    public function refuse(Service $service): JsonResponse
    {
        $updated = Service::query()
            ->whereKey($service->id)
            ->where('status', '!=', 'rejected')
            ->update(['status' => 'rejected']);

        $service->refresh();
        $service->load('provider:id,name,email,phone,role,city,status');

        if ($updated > 0) {
            $this->notifyProvider(
                $service,
                'Annonce refusee',
                "Votre annonce \"{$service->title}\" a ete refusee par l'administrateur. Vous pouvez la modifier puis la renvoyer en validation.",
            );
        }

        return response()->json([
            'message' => $updated > 0 ? 'Annonce refusee avec succes.' : 'Annonce deja refusee.',
            'data' => AdminPresenter::service($service),
        ]);
    }

    public function destroy(Service $service): JsonResponse
    {
        Report::query()->where('service_id', $service->id)->delete();
        $service->delete();

        return response()->json([
            'message' => 'Annonce supprimee avec succes.',
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function counts(): array
    {
        return [
            'total' => Service::query()->count(),
            'pending' => Service::query()->where('status', 'pending')->count(),
            'accepted' => Service::query()->where('status', 'active')->count(),
            'refused' => Service::query()->where('status', 'rejected')->count(),
        ];
    }

    private function notifyProvider(Service $service, string $title, string $message): void
    {
        if (! $service->provider_id) {
            return;
        }

        UserNotification::query()->create([
            'user_id' => $service->provider_id,
            'service_id' => $service->id,
            'type' => 'annonce_moderation',
            'title' => $title,
            'message' => $message,
        ]);
    }
}
