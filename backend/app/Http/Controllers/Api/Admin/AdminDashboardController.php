<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Service;
use App\Models\User;
use App\Support\Admin\AdminPresenter;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $recentPending = Service::query()
            ->with('provider:id,name,email,phone,role,city,status')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get();

        $recentReports = Report::query()
            ->with([
                'reporter:id,name,email',
                'service.provider:id,name,email,phone,role,city,status',
            ])
            ->where('status', 'open')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'total_users' => User::query()->count(),
                    'total_annonces' => Service::query()->count(),
                    'pending_annonces' => Service::query()->where('status', 'pending')->count(),
                    'accepted_annonces' => Service::query()->where('status', 'active')->count(),
                    'refused_annonces' => Service::query()->where('status', 'rejected')->count(),
                    'reports_count' => Report::query()->where('status', 'open')->count(),
                ],
                'recent_pending' => $recentPending
                    ->map(fn (Service $service): array => AdminPresenter::service($service))
                    ->values(),
                'recent_reports' => $recentReports
                    ->map(fn (Report $report): array => AdminPresenter::report($report))
                    ->values(),
            ],
        ]);
    }
}
