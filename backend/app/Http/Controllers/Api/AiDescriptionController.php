<?php

namespace App\Http\Controllers\Api;

use App\Enums\AiDescriptionStyle;
use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateAiDescriptionRequest;
use App\Http\Requests\RegenerateAiDescriptionRequest;
use App\Services\Ai\AiDescriptionService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AiDescriptionController extends Controller
{
    public function generate(
        GenerateAiDescriptionRequest $request,
        AiDescriptionService $descriptionService,
    ): JsonResponse {
        $payload = $request->validated();

        return $this->handle(
            $request,
            fn () => $descriptionService->generate($request->user(), $payload),
            'Description generee avec succes.',
        );
    }

    public function regenerate(
        RegenerateAiDescriptionRequest $request,
        AiDescriptionService $descriptionService,
    ): JsonResponse {
        $validated = $request->validated();
        $style = AiDescriptionStyle::from((string) $validated['style']);

        return $this->handle(
            $request,
            fn () => $descriptionService->regenerate($request->user(), $validated, $style),
            'Description regeneree avec succes.',
        );
    }

    private function handle(Request $request, Closure $callback, string $successMessage): JsonResponse
    {
        if (! $request->user()) {
            return response()->json([
                'message' => 'Connecte-toi d abord.',
            ], 401);
        }

        try {
            $result = $callback();
        } catch (RuntimeException $exception) {
            $status = $exception->getCode();

            return response()->json([
                'message' => $exception->getMessage(),
            ], is_int($status) && $status >= 400 && $status <= 599 ? $status : 502);
        }

        return response()->json([
            'message' => $successMessage,
            'data' => $result,
        ]);
    }
}
