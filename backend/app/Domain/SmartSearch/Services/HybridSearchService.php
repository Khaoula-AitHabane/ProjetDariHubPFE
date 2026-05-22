<?php

namespace App\Domain\SmartSearch\Services;

use App\Domain\SmartSearch\DTO\SearchIntentDTO;
use App\Domain\SmartSearch\Parsers\DeterministicParser;
use App\Domain\SmartSearch\Ranking\ResultRanker;
use App\Domain\SmartSearch\Synonyms\SynonymDictionary;
use App\Models\Service;
use App\Models\SearchLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class HybridSearchService
{
    public function __construct(
        private readonly SynonymDictionary $synonyms,
        private readonly DeterministicParser $parser,
        private readonly GeminiIntentService $gemini,
        private readonly ResultRanker $ranker
    ) {
    }

    public function search(string $query, int $perPage = 10, ?int $userId = null): array
    {
        // 1. Synonym Normalization & Typo correction
        $normalizedQuery = $this->synonyms->normalize($query);

        // 2. Initialize Intent
        $intent = new SearchIntentDTO();

        // 3. Step 1: Deterministic extraction (Price, Surface, Bedrooms)
        $reducedQuery = $this->parser->parse($normalizedQuery, $intent);

        // 4. Step 2: Gemini Intent Extraction
        $this->gemini->extractIntent($reducedQuery, $intent);

        // 5. Step 3: SQL Search & Fallback logic
        $result = $this->executeWithFallback($intent, $perPage);

        // 6. Log search
        SearchLog::create([
            'query' => $query,
            'parsed_intent' => $intent->toArray(),
            'results_count' => $result['paginator']->total(),
            'user_id' => $userId,
        ]);

        return $result;
    }

    private function executeWithFallback(SearchIntentDTO $intent, int $perPage): array
    {
        // Try strict search
        $query = $this->buildQuery($intent, true, true);
        $paginator = $query->paginate($perPage);

        if ($paginator->total() > 0) {
            return [
                'paginator' => $paginator,
                'intent' => $intent->toArray(),
                'fallback_used' => false
            ];
        }

        // Fallback 1: Drop bedrooms & surface
        $intent->bedrooms = null;
        $intent->surface = null;
        $query = $this->buildQuery($intent, true, true);
        $paginator = $query->paginate($perPage);

        if ($paginator->total() > 0) {
            return [
                'paginator' => $paginator,
                'intent' => $intent->toArray(),
                'fallback_used' => 'dropped_rooms_surface'
            ];
        }

        // Fallback 2: Drop city and prices
        $intent->city = null;
        $intent->minPrice = null;
        $intent->maxPrice = null;
        $query = $this->buildQuery($intent, false, false);
        $paginator = $query->paginate($perPage);

        return [
            'paginator' => $paginator,
            'intent' => $intent->toArray(),
            'fallback_used' => 'broad_search'
        ];
    }

    private function buildQuery(SearchIntentDTO $intent, bool $strictCity, bool $strictPrice): Builder
    {
        $query = Service::query()->where('status', 'active');

        if ($intent->category) {
            $query->where('service_type', 'like', '%' . $intent->category . '%');
        }
        if ($intent->listingKind) {
            $query->where('listing_kind', $intent->listingKind);
        }

        if ($strictCity && $intent->city) {
            $query->where('location_city', 'like', '%' . $intent->city . '%');
        }

        if ($strictPrice) {
            if ($intent->minPrice !== null) {
                $query->where('price', '>=', $intent->minPrice);
            }
            if ($intent->maxPrice !== null) {
                $query->where('price', '<=', $intent->maxPrice);
            }
        }

        if ($intent->bedrooms !== null) {
            $query->where('bedrooms', '>=', $intent->bedrooms);
        }
        if ($intent->surface !== null) {
            $query->where('surface', '>=', $intent->surface);
        }

        // Apply Ranking Score
        return $this->ranker->applyRanking($query, $intent);
    }
}
