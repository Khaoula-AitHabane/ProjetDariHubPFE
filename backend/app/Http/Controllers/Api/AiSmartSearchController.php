<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AiSmartSearchRequest;
use App\Services\Ai\AiSmartSearchService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AiSmartSearchController extends Controller
{
    public function __invoke(
        AiSmartSearchRequest $request,
        AiSmartSearchService $smartSearchService,
    ): JsonResponse {
        $validated = $request->validated();

        try {
            $result = $smartSearchService->search(
                (string) $validated['query'],
                (int) ($validated['page'] ?? 1),
                (int) ($validated['per_page'] ?? 9),
            );
        } catch (RuntimeException $exception) {
            $status = $exception->getCode();

            return response()->json([
                'message' => $exception->getMessage(),
            ], is_int($status) && $status >= 400 && $status <= 599 ? $status : 502);
        }

        return response()->json([
            'message' => 'Recherche intelligente executee avec succes.',
            'data' => $result['data'],
            'meta' => $result['meta'],
        ]);
    }
}
