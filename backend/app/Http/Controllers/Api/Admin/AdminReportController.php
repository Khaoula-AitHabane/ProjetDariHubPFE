<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Support\Admin\AdminPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim($request->string('search')->toString());
        $status = trim($request->string('status')->toString());

        $reports = Report::query()
            ->with([
                'reporter:id,name,email',
                'service.provider:id,name,email,phone,role,city,status',
            ])
            ->when($status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner
                        ->where('reason', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%")
                        ->orWhereHas('service', function ($serviceQuery) use ($search): void {
                            $serviceQuery
                                ->where('title', 'like', "%{$search}%")
                                ->orWhere('location_city', 'like', "%{$search}%");
                        })
                        ->orWhereHas('service.provider', function ($providerQuery) use ($search): void {
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
            'data' => $reports->map(fn (Report $report): array => AdminPresenter::report($report))->values(),
            'meta' => [
                'totals' => [
                    'all' => Report::query()->count(),
                    'open' => Report::query()->where('status', 'open')->count(),
                    'ignored' => Report::query()->where('status', 'ignored')->count(),
                    'resolved' => Report::query()->where('status', 'resolved')->count(),
                ],
            ],
        ]);
    }

    public function ignore(Report $report): JsonResponse
    {
        $report->update(['status' => 'ignored']);
        $report->load([
            'reporter:id,name,email',
            'service.provider:id,name,email,phone,role,city,status',
        ]);

        return response()->json([
            'message' => 'Signalement ignore avec succes.',
            'data' => AdminPresenter::report($report),
        ]);
    }

    public function destroy(Report $report): JsonResponse
    {
        $report->delete();

        return response()->json([
            'message' => 'Signalement supprime avec succes.',
        ]);
    }
}
