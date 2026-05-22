<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\SearchLog;
use Illuminate\Support\Facades\DB;

class SuggestionController extends Controller
{
    public function suggestions(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json(['suggestions' => []]);
        }

        // 1. Fetch popular past successful queries from search_logs
        $popularQueries = SearchLog::select('query', DB::raw('count(*) as count'))
            ->where('query', 'like', '%' . $query . '%')
            ->where('results_count', '>', 0)
            ->groupBy('query')
            ->orderByDesc('count')
            ->limit(3)
            ->pluck('query')
            ->toArray();

        // 2. Fetch popular cities matching query
        $cities = DB::table('services')
            ->select('location_city', DB::raw('count(*) as count'))
            ->where('location_city', 'like', $query . '%')
            ->where('status', 'active')
            ->groupBy('location_city')
            ->orderByDesc('count')
            ->limit(2)
            ->pluck('location_city')
            ->map(fn($city) => "À " . $city)
            ->toArray();

        // 3. predefined categories / property types matching
        $categories = ['maison', 'appartement', 'villa', 'plombier', 'electricien', 'meuble', 'location', 'vente'];
        $matchedCategories = array_filter($categories, fn($cat) => str_contains(strtolower($cat), strtolower($query)));
        
        $suggestions = array_values(array_unique(array_merge($matchedCategories, $popularQueries, $cities)));
        
        // Limit total suggestions
        $suggestions = array_slice($suggestions, 0, 5);

        return response()->json(['suggestions' => $suggestions]);
    }
}
