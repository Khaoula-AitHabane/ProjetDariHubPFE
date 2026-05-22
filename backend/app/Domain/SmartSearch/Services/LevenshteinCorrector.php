<?php

namespace App\Domain\SmartSearch\Services;

class LevenshteinCorrector
{
    // Local dictionary to keep the system simple and fast
    private array $cities = [
        'casablanca', 'rabat', 'marrakech', 'agadir', 'tanger',
        'fes', 'meknes', 'oujda', 'kenitra', 'tetouan', 'safi', 'mohammedia', 'eljadida'
    ];

    private array $categories = [
        'immobilier', 'meuble', 'service', 'location', 'vente',
        'appartement', 'maison', 'villa', 'bureau', 'magasin', 'terrain',
        'salon', 'chambre', 'cuisine', 'table', 'chaise', 'canapé', 'lit',
        'plombier', 'electricien', 'menuisier', 'peintre', 'nettoyage', 'déménagement'
    ];

    /**
     * Corrects a query using Levenshtein distance for cities and categories.
     * Max distance allowed is 2.
     */
    public function correct(string $query): array
    {
        $words = array_filter(explode(' ', strtolower($query)));
        $correctedWords = [];
        $isCorrected = false;

        $dictionary = array_merge($this->cities, $this->categories);

        foreach ($words as $word) {
            // Ignore small words
            if (strlen($word) < 4) {
                $correctedWords[] = $word;
                continue;
            }

            // Exact match
            if (in_array($word, $dictionary, true)) {
                $correctedWords[] = $word;
                continue;
            }

            // Find closest word
            $closestWord = $word;
            $shortestDistance = -1;

            foreach ($dictionary as $dictWord) {
                $distance = levenshtein($word, $dictWord);

                if ($distance === 0) {
                    $closestWord = $dictWord;
                    $shortestDistance = 0;
                    break;
                }

                if ($distance <= 2 && ($shortestDistance < 0 || $distance < $shortestDistance)) {
                    $closestWord = $dictWord;
                    $shortestDistance = $distance;
                }
            }

            if ($shortestDistance > 0 && $shortestDistance <= 2) {
                $correctedWords[] = $closestWord;
                $isCorrected = true;
            } else {
                $correctedWords[] = $word;
            }
        }

        $correctedQuery = implode(' ', $correctedWords);

        return [
            'original' => $query,
            'corrected' => $correctedQuery,
            'is_corrected' => $isCorrected,
        ];
    }
}
