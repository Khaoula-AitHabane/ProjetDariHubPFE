<?php

namespace App\Http\Controllers\Api;

use App\Domain\Moderation\Services\AiModerationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiModerationController extends Controller
{
    public function __construct(
        private readonly AiModerationService $moderationService,
    ) {}

    /**
     * POST /api/ai/moderate-ad
     * Analyzes listing content and returns AI moderation result.
     * The admin always makes the final decision.
     */
    public function moderate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'phone'       => ['nullable', 'string', 'max:30'],
            'price'       => ['required', 'numeric', 'min:0'],
        ]);

        $result = $this->moderationService->moderate(
            title:       $validated['title'],
            description: $validated['description'],
            phone:       $validated['phone'] ?? '',
            price:       (float) $validated['price'],
        );

        return response()->json([
            'message' => 'Analyse IA complétée.',
            'data'    => $result->toArray(),
        ]);
    }
}
