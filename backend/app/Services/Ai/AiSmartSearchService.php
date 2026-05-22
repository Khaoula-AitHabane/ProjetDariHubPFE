<?php

namespace App\Services\Ai;

use App\Models\Service;
use App\Support\Services\ServiceDataPresenter;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use RuntimeException;

class AiSmartSearchService
{
    public function __construct(
        private readonly PromptInputSanitizer $inputSanitizer,
        private readonly SmartSearchPromptFactory $promptFactory,
        private readonly GeminiDescriptionGenerator $generator,
        private readonly SmartSearchSynonymNormalizer $synonymNormalizer,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function search(string $query, int $page = 1, int $perPage = 9): array
    {
        $sanitizedQuery = $this->inputSanitizer->sanitizeNaturalLanguageQuery($query, 280);

        if ($sanitizedQuery === '') {
            throw new RuntimeException('La recherche naturelle fournie est vide apres nettoyage.', 422);
        }

        $interpretedFilters = $this->interpretFilters($sanitizedQuery);
        $searchResult = $this->executeSearchStages($interpretedFilters, $page, $perPage);
        $paginator = $searchResult['paginator'];

        return [
            'data' => $paginator->getCollection()
                ->map(fn (Service $service): array => ServiceDataPresenter::fromModel($service))
                ->values()
                ->all(),
            'meta' => [
                'query' => $sanitizedQuery,
                'interpreted_filters' => $interpretedFilters,
                'search_strategy' => $searchResult['strategy'],
                'pagination' => $this->paginationMeta($paginator),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function interpretFilters(string $sanitizedQuery): array
    {
        try {
            return $this->normalizeFilters(
                $this->generator->generateStructuredJson(
                    $this->promptFactory->buildSystemInstruction(),
                    $this->promptFactory->buildUserPrompt($sanitizedQuery),
                    $this->promptFactory->responseJsonSchema(),
                    [
                        'temperature' => 0.2,
                        'max_output_tokens' => 260,
                        'timeout' => 8,
                    ],
                ),
                $sanitizedQuery,
            );
        } catch (RuntimeException $exception) {
            $status = (int) $exception->getCode();

            if (in_array($status, [502, 503, 504], true)) {
                return $this->fallbackInterpretFilters($sanitizedQuery);
            }

            throw $exception;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function fallbackInterpretFilters(string $sanitizedQuery): array
    {
        return $this->normalizeFilters([
            'keywords' => $this->synonymNormalizer->tokenize($sanitizedQuery),
        ], $sanitizedQuery);
    }

    /**
     * @param  array<string, mixed>  $rawFilters
     * @return array<string, mixed>
     */
    private function normalizeFilters(array $rawFilters, string $fallbackQuery): array
    {
        $normalizedQuery = $this->synonymNormalizer->canonicalizeQuery($fallbackQuery);
        $rawKeywords = is_array($rawFilters['keywords'] ?? null) ? $rawFilters['keywords'] : [];
        $rawCategory = $this->normalizeText((string) ($rawFilters['category'] ?? ''), 80);
        $rawCity = $this->normalizeText((string) ($rawFilters['city'] ?? ''), 80);
        $serviceType = $this->normalizeEnum((string) ($rawFilters['service_type'] ?? ''), [
            'house_rental',
            'furniture_rental',
            'home_service',
        ]);

        $serviceType = $this->synonymNormalizer->mapServiceType(
            $serviceType,
            $rawCategory,
            $rawKeywords,
            $normalizedQuery,
        );

        $listingKind = $this->synonymNormalizer->normalizeListingKind(
            (string) ($rawFilters['listing_kind'] ?? ''),
            $rawKeywords,
            $normalizedQuery,
        );
        $availability = $this->normalizeEnum((string) ($rawFilters['availability'] ?? ''), [
            'today',
            'this_week',
            'flexible',
        ]);
        $category = $this->synonymNormalizer->normalizeCategory(
            $rawCategory,
            $rawKeywords,
            $normalizedQuery,
        );
        $city = $this->synonymNormalizer->normalizeCity(
            $rawCity,
            $normalizedQuery,
            $rawKeywords,
        );
        $cityTerms = $this->synonymNormalizer->citySearchTerms($city);

        $keywords = $this->synonymNormalizer->buildKeywordSet(
            $rawKeywords,
            $category,
            $normalizedQuery,
            $city,
        );

        if ($listingKind === 'rent' && ! in_array('location', $keywords, true)) {
            $keywords[] = 'location';
        }

        if ($listingKind === 'sale' && ! in_array('vente', $keywords, true)) {
            $keywords[] = 'vente';
        }

        $priceMin = $this->normalizePositiveNumber($rawFilters['price_min'] ?? 0);
        $priceMax = $this->normalizePositiveNumber($rawFilters['price_max'] ?? 0)
            ?? $this->detectFallbackPriceMax($normalizedQuery, $serviceType);
        $availability = $availability ?? $this->detectFallbackAvailability($normalizedQuery, $serviceType);
        $queryTerms = $this->synonymNormalizer->buildKeywordSet([], null, $normalizedQuery, $city);

        $keywords = array_values(array_filter(array_unique($keywords), function (string $keyword) use ($category, $cityTerms, $priceMin, $priceMax): bool {
            return $keyword !== $category
                && ! in_array($keyword, $cityTerms, true)
                && ! (($priceMin !== null || $priceMax !== null) && $this->looksLikePriceIntentKeyword($keyword));
        }));

        $rankingKeywords = array_slice(array_values(array_unique(array_filter([
            $category,
            ...$keywords,
        ]))), 0, 8);
        $categoryTerms = $category !== null
            ? $this->synonymNormalizer->expandKeywords([$category])
            : [];

        return [
            'service_type' => $serviceType,
            'listing_kind' => $listingKind,
            'category' => $category,
            'category_terms' => $categoryTerms,
            'city' => $city,
            'city_terms' => $cityTerms,
            'price_min' => $priceMin,
            'price_max' => $priceMax,
            'surface_min' => $this->normalizePositiveNumber($rawFilters['surface_min'] ?? 0)
                ?? $this->detectFirstNumberPattern($normalizedQuery, '/(\d{2,4})\s*(m2|m|metres?|metre)\b/u'),
            'surface_max' => $this->normalizePositiveNumber($rawFilters['surface_max'] ?? 0),
            'bedrooms_min' => $this->normalizePositiveNumber($rawFilters['bedrooms_min'] ?? 0)
                ?? $this->detectFirstNumberPattern($normalizedQuery, '/(\d{1,2})\s*(chambres?|pieces?|piece)\b/u'),
            'availability' => $availability,
            'keywords' => $keywords,
            'expanded_keywords' => $this->synonymNormalizer->expandKeywords($keywords),
            'ranking_keywords' => $rankingKeywords,
            'query_terms' => $queryTerms,
            'normalized_query' => $normalizedQuery,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, strategy: string}
     */
    private function executeSearchStages(array $filters, int $page, int $perPage): array
    {
        $lastPaginator = null;
        $lastStrategy = 'structured';

        foreach ($this->searchStages($filters) as $stage) {
            $paginator = $this->buildSearchQuery($filters, $stage)
                ->paginate($perPage, ['*'], 'page', $page);

            if ($paginator->total() > 0) {
                return [
                    'paginator' => $paginator,
                    'strategy' => $stage['name'],
                ];
            }

            $lastPaginator = $paginator;
            $lastStrategy = $stage['name'];
        }

        return [
            'paginator' => $lastPaginator ?? $this->buildSearchQuery($filters, [
                'name' => 'structured',
                'use_city_filter' => true,
                'use_listing_kind' => true,
                'use_service_type' => true,
                'terms' => [],
            ])->paginate($perPage, ['*'], 'page', $page),
            'strategy' => $lastStrategy,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function searchStages(array $filters): array
    {
        $primaryTerms = array_values(array_unique(array_filter([
            ...($filters['category_terms'] ?? []),
            ...($filters['expanded_keywords'] ?? []),
        ])));

        $primaryTerms = $primaryTerms !== []
            ? $primaryTerms
            : $filters['query_terms'];

        $broadTerms = $filters['query_terms'] !== []
            ? array_values(array_unique(array_filter([
                ...($filters['category_terms'] ?? []),
                ...$this->synonymNormalizer->expandKeywords($filters['query_terms']),
            ])))
            : $primaryTerms;

        return [
            [
                'name' => 'structured',
                'use_city_filter' => true,
                'use_listing_kind' => true,
                'use_service_type' => true,
                'terms' => $primaryTerms,
            ],
            [
                'name' => 'without_city',
                'use_city_filter' => false,
                'use_listing_kind' => true,
                'use_service_type' => true,
                'terms' => $primaryTerms,
            ],
            [
                'name' => 'keywords_only',
                'use_city_filter' => false,
                'use_listing_kind' => false,
                'use_service_type' => true,
                'terms' => $primaryTerms !== [] ? $primaryTerms : $broadTerms,
            ],
            [
                'name' => 'broad_similarity',
                'use_city_filter' => false,
                'use_listing_kind' => false,
                'use_service_type' => $filters['service_type'] !== null,
                'terms' => $broadTerms,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>  $stage
     */
    private function buildSearchQuery(array $filters, array $stage): Builder
    {
        $query = Service::query()
            ->select('services.*')
            ->with('provider:id,name,role,city,phone,bio')
            ->where('status', 'active');

        if (($stage['use_service_type'] ?? true) && $filters['service_type'] !== null) {
            $query->where('service_type', $filters['service_type']);
        }

        if (($stage['use_city_filter'] ?? true) && $filters['city_terms'] !== []) {
            $query->where(function (Builder $cityQuery) use ($filters): void {
                foreach ($filters['city_terms'] as $index => $cityTerm) {
                    $method = $index === 0 ? 'whereRaw' : 'orWhereRaw';
                    $cityQuery->{$method}('LOWER(location_city) LIKE ?', ['%'.$cityTerm.'%']);
                }
            });
        }

        if (($stage['use_listing_kind'] ?? true) && $filters['listing_kind'] !== null) {
            $this->applyListingKindFilter($query, $filters['listing_kind']);
        }

        $this->applyNumericFilters($query, $filters);
        $this->applyAvailabilityFilter($query, $filters['availability']);
        $this->applyTextSearch($query, $stage['terms'] ?? []);
        $this->applyRanking($query, $filters);

        return $query;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyNumericFilters(Builder $query, array $filters): void
    {
        if ($filters['price_min'] !== null) {
            $query->where('price', '>=', $filters['price_min']);
        }

        if ($filters['price_max'] !== null) {
            $query->where('price', '<=', $filters['price_max']);
        }

        if ($filters['surface_min'] !== null) {
            $query->where('surface', '>=', $filters['surface_min']);
        }

        if ($filters['surface_max'] !== null) {
            $query->where('surface', '<=', $filters['surface_max']);
        }

        if ($filters['bedrooms_min'] !== null) {
            $query->where('bedrooms', '>=', $filters['bedrooms_min']);
        }
    }

    private function applyAvailabilityFilter(Builder $query, ?string $availability): void
    {
        if ($availability === 'today') {
            $today = Carbon::today()->toDateString();

            $query
                ->where(function (Builder $availabilityQuery) use ($today): void {
                    $availabilityQuery
                        ->whereNull('available_from')
                        ->orWhereDate('available_from', '<=', $today);
                })
                ->where(function (Builder $availabilityQuery) use ($today): void {
                    $availabilityQuery
                        ->whereNull('available_to')
                        ->orWhereDate('available_to', '>=', $today);
                });
        }

        if ($availability === 'this_week') {
            $today = Carbon::today()->toDateString();
            $endOfWeek = Carbon::today()->endOfWeek()->toDateString();

            $query->where(function (Builder $availabilityQuery) use ($today, $endOfWeek): void {
                $availabilityQuery
                    ->whereNull('available_from')
                    ->orWhereBetween('available_from', [$today, $endOfWeek])
                    ->orWhereDate('available_from', '<=', $today);
            });
        }
    }

    private function applyListingKindFilter(Builder $query, string $listingKind): void
    {
        $needles = $listingKind === 'rent'
            ? ['location', 'louer', 'a louer', 'lakra', 'lkra', 'kera', 'kra']
            : ['vente', 'vendre', 'a vendre', 'achat'];

        $query->where(function (Builder $listingKindQuery) use ($listingKind, $needles): void {
            $listingKindQuery->where('listing_kind', $listingKind)
                ->orWhere(function (Builder $textQuery) use ($needles): void {
                    foreach ($needles as $index => $needle) {
                        $method = $index === 0 ? 'where' : 'orWhere';
                        $like = '%'.$needle.'%';

                        $textQuery->{$method}(function (Builder $innerQuery) use ($like): void {
                            $innerQuery
                                ->whereRaw('LOWER(title) LIKE ?', [$like])
                                ->orWhereRaw('LOWER(category) LIKE ?', [$like])
                                ->orWhereRaw('LOWER(description) LIKE ?', [$like]);
                        });
                    }
                });
        });
    }

    /**
     * @param  array<int, string>  $terms
     */
    private function applyTextSearch(Builder $query, array $terms): void
    {
        $terms = array_values(array_unique(array_filter(array_map(
            fn (string $term): string => $this->synonymNormalizer->normalizeText($term),
            $terms,
        ))));

        if ($terms === []) {
            return;
        }

        $query->where(function (Builder $textQuery) use ($terms): void {
            foreach ($terms as $index => $term) {
                $like = '%'.$term.'%';
                $method = $index === 0 ? 'where' : 'orWhere';

                $textQuery->{$method}(function (Builder $innerQuery) use ($like): void {
                    $innerQuery
                        ->whereRaw('LOWER(title) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(category) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(description) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(location_city) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(location_address, "")) LIKE ?', [$like]);
                });
            }
        });
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyRanking(Builder $query, array $filters): void
    {
        $scoreSql = '0';
        $bindings = [];

        if ($filters['city'] !== null) {
            $normalizedCity = $this->synonymNormalizer->normalizeText($filters['city']);
            $scoreSql .= ' + CASE WHEN LOWER(location_city) = ? THEN 3 WHEN LOWER(location_city) LIKE ? THEN 1 ELSE 0 END';
            $bindings[] = $normalizedCity;
            $bindings[] = '%'.$normalizedCity.'%';
        }

        foreach ($filters['ranking_keywords'] as $keyword) {
            $normalizedKeyword = $this->synonymNormalizer->normalizeText($keyword);

            if ($normalizedKeyword === '') {
                continue;
            }

            $like = '%'.$normalizedKeyword.'%';

            $scoreSql .= ' + CASE WHEN LOWER(title) LIKE ? THEN 2 ELSE 0 END';
            $bindings[] = $like;

            $scoreSql .= ' + CASE WHEN LOWER(category) LIKE ? THEN 2 ELSE 0 END';
            $bindings[] = $like;

            $scoreSql .= ' + CASE WHEN LOWER(description) LIKE ? THEN 1 ELSE 0 END';
            $bindings[] = $like;
        }

        $query->selectRaw($scoreSql.' as search_score', $bindings)
            ->orderByDesc('search_score')
            ->orderByDesc('is_featured')
            ->orderByDesc('rating')
            ->orderBy('price');
    }

    private function normalizeEnum(string $value, array $allowed): ?string
    {
        $value = trim(mb_strtolower($value));

        return in_array($value, $allowed, true) ? $value : null;
    }

    private function normalizeText(string $value, int $maxLength): ?string
    {
        $value = $this->inputSanitizer->sanitizeNaturalLanguageQuery($value, $maxLength);

        return $value !== '' ? $value : null;
    }

    private function normalizePositiveNumber(mixed $value): ?int
    {
        $number = (int) $value;

        return $number > 0 ? $number : null;
    }

    private function looksLikePriceIntentKeyword(string $keyword): bool
    {
        $normalized = mb_strtolower(trim($keyword));

        foreach ([
            'pas cher',
            'pas chere',
            'cheap',
            'abordable',
            'economique',
            'rkhis',
            'rkhissa',
            'thaman',
            'b thman',
            'prix',
            'budget',
        ] as $needle) {
            if (str_contains($normalized, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function detectFallbackAvailability(string $query, ?string $serviceType): ?string
    {
        if (
            str_contains($query, 'aujourd hui')
            || str_contains($query, "aujourd'hui")
            || ($serviceType === 'home_service' && str_contains($query, 'urgent'))
        ) {
            return 'today';
        }

        if (str_contains($query, 'cette semaine')) {
            return 'this_week';
        }

        return null;
    }

    private function detectFallbackPriceMax(string $query, ?string $serviceType): ?int
    {
        if (
            preg_match('/(?:max|moins de|budget|jusqu a|jusqua)?\s*(\d[\d\s]{2,})\s*(dh|mad)\b/u', $query, $matches) === 1
        ) {
            return (int) preg_replace('/\D+/', '', $matches[1]);
        }

        if ($serviceType === 'house_rental' && $this->looksLikePriceIntentKeyword($query)) {
            return 4000;
        }

        return null;
    }

    private function detectFirstNumberPattern(string $query, string $pattern): ?int
    {
        if (preg_match($pattern, $query, $matches) !== 1) {
            return null;
        }

        return (int) preg_replace('/\D+/', '', $matches[1]);
    }

    /**
     * @return array<string, int|null>
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
