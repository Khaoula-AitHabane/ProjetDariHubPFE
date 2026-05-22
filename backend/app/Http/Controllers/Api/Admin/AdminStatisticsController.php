<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class AdminStatisticsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'annonces_by_city' => Service::query()
                    ->selectRaw('location_city as name, COUNT(*) as value')
                    ->groupBy('location_city')
                    ->orderByDesc('value')
                    ->limit(8)
                    ->get(),
                'annonces_by_category' => Service::query()
                    ->selectRaw('category as name, COUNT(*) as value')
                    ->groupBy('category')
                    ->orderByDesc('value')
                    ->limit(8)
                    ->get(),
                'users_by_month' => $this->usersByMonth(),
                'moderation_breakdown' => [
                    [
                        'name' => 'Acceptees',
                        'value' => Service::query()->where('status', 'active')->count(),
                    ],
                    [
                        'name' => 'Refusees',
                        'value' => Service::query()->where('status', 'rejected')->count(),
                    ],
                    [
                        'name' => 'En attente',
                        'value' => Service::query()->where('status', 'pending')->count(),
                    ],
                ],
            ],
        ]);
    }

    /**
     * @return array<int, array{name: string, value: int}>
     */
    private function usersByMonth(): array
    {
        $start = now()->startOfMonth()->subMonths(5);
        $counts = User::query()
            ->where('created_at', '>=', $start)
            ->get()
            ->groupBy(fn (User $user): string => $user->created_at?->format('Y-m') ?? '');

        return collect(range(0, 5))
            ->map(function (int $offset) use ($start, $counts): array {
                $month = Carbon::parse($start)->addMonths($offset);
                $key = $month->format('Y-m');

                return [
                    'name' => $month->format('M Y'),
                    'value' => $counts->get($key)?->count() ?? 0,
                ];
            })
            ->all();
    }
}
