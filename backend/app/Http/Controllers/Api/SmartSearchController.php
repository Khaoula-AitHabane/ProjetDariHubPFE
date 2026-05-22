<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Domain\SmartSearch\Services\HybridSearchService;

class SmartSearchController extends Controller
{
    public function __construct(
        private readonly HybridSearchService $searchService
    ) {
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = $request->input('q');
        $perPage = (int) $request->input('per_page', 10);
        
        try {
            $userId = $request->user() ? $request->user()->id : null;
        } catch (\Exception $e) {
            $userId = null; // Guard not found or not authenticated
        }

        $result = $this->searchService->search($query, $perPage, $userId);
        
        $paginator = $result['paginator'];

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'intent' => $result['intent'],
                'fallback_used' => $result['fallback_used']
            ]
        ]);
    }
}
