<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }

        $notifications = UserNotification::query()
            ->where('user_id', $user->id)
            ->with('service:id,title,status')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $notifications->map(fn (UserNotification $notification): array => $this->transformNotification($notification))->values(),
            'meta' => [
                'unread_count' => UserNotification::query()
                    ->where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count(),
            ],
        ]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }

        UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marquees comme lues.',
        ]);
    }

    private function transformNotification(UserNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
            'service' => $notification->service?->only(['id', 'title', 'status']),
        ];
    }
}
