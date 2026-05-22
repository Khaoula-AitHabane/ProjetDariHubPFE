<?php

namespace App\Services\Ai;

use Illuminate\Support\Str;

class SmartSearchSynonymNormalizer
{
    /**
     * @var array<string, string>
     */
    private const PHRASE_SYNONYMS = [
        'chi dar' => 'maison',
        'dar lakra' => 'maison location',
        'dar lkra' => 'maison location',
        'dar lkra' => 'maison location',
        'dar kera' => 'maison location',
        'a louer' => 'location',
        'a vendre' => 'vente',
        'pas cher' => 'pas cher',
    ];

    /**
     * @var array<string, string>
     */
    private const TOKEN_SYNONYMS = [
        'dar' => 'maison',
        'dart' => 'maison',
        'lakra' => 'location',
        'lkra' => 'location',
        'lkera' => 'location',
        'lkiraa' => 'location',
        'kera' => 'location',
        'kra' => 'location',
        'kraya' => 'location',
        'kiraya' => 'location',
        'casa' => 'casablanca',
        'casablanka' => 'casablanca',
        'rbat' => 'rabat',
        'tanja' => 'tanger',
        'appart' => 'appartement',
        'immo' => 'immobilier',
        'plombier' => 'plomberie',
        'electricien' => 'electricite',
    ];

    /**
     * @var array<string, array<int, string>>
     */
    private const CITY_ALIASES = [
        'Casablanca' => ['casablanca', 'casa', 'casablanka'],
        'Rabat' => ['rabat', 'rbat'],
        'Marrakech' => ['marrakech', 'marrakch', 'marrakesh'],
        'Tanger' => ['tanger', 'tanja'],
        'Tetouan' => ['tetouan', 'tetouane'],
        'Agadir' => ['agadir'],
        'Fes' => ['fes'],
        'Meknes' => ['meknes'],
        'Kenitra' => ['kenitra', 'kenitra'],
        'Temara' => ['temara'],
        'Sale' => ['sale'],
        'Mohammedia' => ['mohammedia'],
        'El Jadida' => ['el jadida', 'jadida'],
        'Oujda' => ['oujda'],
    ];

    /**
     * @var array<string, string>
     */
    private const HIGH_LEVEL_CATEGORY_MAP = [
        'immobilier' => 'house_rental',
        'immo' => 'house_rental',
        'meuble' => 'furniture_rental',
        'meubles' => 'furniture_rental',
        'service' => 'home_service',
        'services' => 'home_service',
    ];

    /**
     * @var array<string, array<int, string>>
     */
    private const SERVICE_TYPE_HINTS = [
        'house_rental' => [
            'immobilier', 'maison', 'appartement', 'villa', 'studio', 'terrain', 'bureau', 'magasin', 'location', 'vente',
        ],
        'furniture_rental' => [
            'meuble', 'meubles', 'salon', 'canape', 'table', 'chaise', 'lit', 'armoire', 'decoration', 'cuisine',
        ],
        'home_service' => [
            'service', 'services', 'plomberie', 'electricite', 'nettoyage', 'jardinage', 'peinture', 'reparation', 'depannage', 'climatisation', 'demenagement',
        ],
    ];

    /**
     * @var array<string, array<int, string>>
     */
    private const LISTING_KIND_HINTS = [
        'rent' => ['location', 'louer', 'lakra', 'lkra', 'kera', 'kra', 'kiraya'],
        'sale' => ['vente', 'vendre', 'achat'],
    ];

    /**
     * @var array<string, array<int, string>>
     */
    private const SPECIFIC_CATEGORY_ALIASES = [
        'maison' => ['maison', 'dar'],
        'appartement' => ['appartement', 'appart', 'studio'],
        'villa' => ['villa'],
        'terrain' => ['terrain'],
        'bureau' => ['bureau', 'office'],
        'magasin' => ['magasin', 'local'],
        'salon' => ['salon', 'canape'],
        'table' => ['table', 'chaise'],
        'lit' => ['lit', 'chambre'],
        'plomberie' => ['plomberie', 'plombier'],
        'electricite' => ['electricite', 'electricien'],
        'nettoyage' => ['nettoyage', 'menage'],
        'jardinage' => ['jardinage', 'jardinier'],
        'peinture' => ['peinture', 'peintre'],
        'climatisation' => ['climatisation', 'climatiseur'],
        'reparation' => ['reparation', 'depannage', 'bricolage'],
        'demenagement' => ['demenagement', 'transport'],
    ];

    /**
     * @var array<string, array<int, string>>
     */
    private const KEYWORD_EXPANSIONS = [
        'maison' => ['maison', 'dar'],
        'appartement' => ['appartement', 'appart'],
        'location' => ['location', 'louer', 'lakra', 'lkra', 'kera', 'kra', 'kiraya'],
        'vente' => ['vente', 'vendre', 'achat'],
        'casablanca' => ['casablanca', 'casa', 'casablanka'],
        'rabat' => ['rabat', 'rbat'],
        'tanger' => ['tanger', 'tanja'],
        'marrakech' => ['marrakech', 'marrakch', 'marrakesh'],
        'plomberie' => ['plomberie', 'plombier'],
        'electricite' => ['electricite', 'electricien'],
        'nettoyage' => ['nettoyage', 'menage'],
        'salon' => ['salon', 'canape'],
        'table' => ['table', 'chaise'],
        'lit' => ['lit', 'chambre'],
    ];

    /**
     * @var array<int, string>
     */
    private const STOPWORDS = [
        'a', 'au', 'aux', 'avec', 'ana', 'chi', 'daba', 'dart', 'de', 'des', 'du', 'dans', 'f', 'fi', 'hadi', 'hadik',
        'je', 'la', 'le', 'les', 'li', 'lil', 'm3a', 'mn', 'pour', 'sur', 'une', 'un', 'veut', 'veux', 'brit', 'bghit',
        'bgheet', 'baghi', 'abghi', 'abghit', 'cherche', 'recherche', 'svp', 's il', 'soussi', 'hada', 'hadiya',
    ];

    public function normalizeText(string $value): string
    {
        $normalized = Str::ascii($value);
        $normalized = mb_strtolower($normalized, 'UTF-8');
        $normalized = str_replace(['3', '7', '9', '5', '2'], ['a', 'h', 'q', 'kh', 'a'], $normalized);
        $normalized = preg_replace('/[^a-z0-9\s\']+/u', ' ', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;

        return trim($normalized);
    }

    public function canonicalizeQuery(string $query): string
    {
        return implode(' ', $this->tokenize($query));
    }

    /**
     * @return array<int, string>
     */
    public function tokenize(string $query): array
    {
        $normalized = ' '.$this->normalizeText($query).' ';

        foreach (self::PHRASE_SYNONYMS as $needle => $replacement) {
            $normalized = str_replace(' '.$needle.' ', ' '.$replacement.' ', $normalized);
        }

        $tokens = preg_split('/\s+/u', trim($normalized)) ?: [];

        return array_values(array_filter(array_map(function (string $token): string {
            $canonical = self::TOKEN_SYNONYMS[$token] ?? $token;

            return trim($canonical);
        }, $tokens)));
    }

    public function normalizeCity(?string $city, string $query = '', array $keywords = []): ?string
    {
        $candidates = array_filter([
            $this->normalizeText((string) $city),
            $this->canonicalizeQuery($query),
            ...array_map(fn (mixed $keyword): string => $this->normalizeText((string) $keyword), $keywords),
        ]);

        foreach (self::CITY_ALIASES as $canonical => $aliases) {
            foreach ($aliases as $alias) {
                $normalizedAlias = $this->normalizeText($alias);

                foreach ($candidates as $candidate) {
                    if ($candidate === $normalizedAlias || str_contains($candidate, $normalizedAlias)) {
                        return $canonical;
                    }
                }
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    public function citySearchTerms(?string $city): array
    {
        if ($city === null) {
            return [];
        }

        $aliases = self::CITY_ALIASES[$city] ?? [$city];

        return array_values(array_unique(array_map(
            fn (string $value): string => $this->normalizeText($value),
            array_merge([$city], $aliases),
        )));
    }

    public function mapServiceType(?string $serviceType, ?string $category, array $keywords, string $query): ?string
    {
        $normalizedType = $this->normalizeText((string) $serviceType);

        if (in_array($normalizedType, ['house_rental', 'furniture_rental', 'home_service'], true)) {
            return $normalizedType;
        }

        $normalizedCategory = $this->normalizeText((string) $category);

        if (isset(self::HIGH_LEVEL_CATEGORY_MAP[$normalizedCategory])) {
            return self::HIGH_LEVEL_CATEGORY_MAP[$normalizedCategory];
        }

        $haystack = array_unique(array_filter([
            $normalizedCategory,
            ...$this->tokenize($query),
            ...$this->normalizeKeywords($keywords),
        ]));

        foreach (self::SERVICE_TYPE_HINTS as $mappedType => $hints) {
            foreach ($hints as $hint) {
                if (in_array($this->normalizeText($hint), $haystack, true)) {
                    return $mappedType;
                }
            }
        }

        return null;
    }

    public function normalizeListingKind(?string $listingKind, array $keywords, string $query): ?string
    {
        $normalized = $this->normalizeText((string) $listingKind);

        if (in_array($normalized, ['rent', 'sale'], true)) {
            return $normalized;
        }

        $haystack = array_unique(array_filter([
            ...$this->tokenize($query),
            ...$this->normalizeKeywords($keywords),
        ]));

        foreach (self::LISTING_KIND_HINTS as $mappedKind => $hints) {
            foreach ($hints as $hint) {
                if (in_array($this->normalizeText($hint), $haystack, true)) {
                    return $mappedKind;
                }
            }
        }

        return null;
    }

    public function normalizeCategory(?string $category, array $keywords, string $query): ?string
    {
        $normalized = $this->normalizeText((string) $category);

        if ($normalized !== '' && ! isset(self::HIGH_LEVEL_CATEGORY_MAP[$normalized])) {
            foreach (self::SPECIFIC_CATEGORY_ALIASES as $canonical => $aliases) {
                if ($normalized === $canonical || in_array($normalized, array_map([$this, 'normalizeText'], $aliases), true)) {
                    return $canonical;
                }
            }

            return $normalized;
        }

        $haystack = array_unique(array_filter([
            ...$this->tokenize($query),
            ...$this->normalizeKeywords($keywords),
        ]));

        foreach (self::SPECIFIC_CATEGORY_ALIASES as $canonical => $aliases) {
            foreach ($aliases as $alias) {
                if (in_array($this->normalizeText($alias), $haystack, true)) {
                    return $canonical;
                }
            }
        }

        return null;
    }

    /**
     * @param  array<int, mixed>  $keywords
     * @return array<int, string>
     */
    public function normalizeKeywords(array $keywords): array
    {
        $normalized = [];

        foreach ($keywords as $keyword) {
            foreach ($this->tokenize((string) $keyword) as $token) {
                if (! in_array($token, self::STOPWORDS, true)) {
                    $normalized[] = $token;
                }
            }
        }

        return array_values(array_unique(array_filter($normalized)));
    }

    /**
     * @param  array<int, mixed>  $keywords
     * @return array<int, string>
     */
    public function buildKeywordSet(array $keywords, ?string $category, string $query, ?string $city): array
    {
        $cityTerms = $this->citySearchTerms($city);
        $tokens = [
            ...$this->normalizeKeywords($keywords),
            ...$this->tokenize($query),
        ];

        if ($category !== null && $category !== '') {
            $tokens[] = $category;
        }

        $filtered = array_values(array_filter($tokens, function (string $token) use ($cityTerms): bool {
            return $token !== ''
                && ! in_array($token, self::STOPWORDS, true)
                && ! in_array($token, array_map([$this, 'normalizeText'], array_keys(self::HIGH_LEVEL_CATEGORY_MAP)), true)
                && ! in_array($token, $cityTerms, true);
        }));

        return array_slice(array_values(array_unique($filtered)), 0, 8);
    }

    /**
     * @param  array<int, string>  $keywords
     * @return array<int, string>
     */
    public function expandKeywords(array $keywords): array
    {
        $expanded = [];

        foreach ($keywords as $keyword) {
            $normalized = $this->normalizeText($keyword);

            if ($normalized === '') {
                continue;
            }

            $expanded[] = $normalized;

            foreach (self::KEYWORD_EXPANSIONS[$normalized] ?? [] as $variant) {
                $expanded[] = $this->normalizeText($variant);
            }
        }

        return array_slice(array_values(array_unique(array_filter($expanded))), 0, 14);
    }
}
