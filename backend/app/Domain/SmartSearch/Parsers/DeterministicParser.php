<?php

namespace App\Domain\SmartSearch\Parsers;

use App\Domain\SmartSearch\DTO\SearchIntentDTO;

class DeterministicParser
{
    public function parse(string $query, SearchIntentDTO $dto): string
    {
        // Extract Price (e.g., 3000 dh, 3000dh, a 3000, max 3000)
        // Also handling ranges like 2000 a 3000
        $priceRegex = '/(\d{3,})\s*(?:dh|mad|dirham)?/i';
        if (preg_match_all($priceRegex, $query, $matches)) {
            $prices = array_map('intval', $matches[1]);
            if (count($prices) >= 2) {
                sort($prices);
                $dto->minPrice = $prices[0];
                $dto->maxPrice = $prices[1];
            } elseif (count($prices) == 1) {
                // If it says "min" or "plus de"
                if (preg_match('/(?:min|plus de|ktar men|ktar mn)\s*' . $prices[0] . '/i', $query)) {
                    $dto->minPrice = $prices[0];
                } else {
                    $dto->maxPrice = $prices[0]; // Usually people mean max price when typing a single number
                }
            }
            // Remove the price from query so Gemini doesn't get confused
            $query = preg_replace($priceRegex, '', $query);
        }

        // Extract Rooms/Bedrooms (e.g., 3 chambres, 3 bit, 2 pieces)
        $roomsRegex = '/(\d+)\s*(?:chambre|chambres|bit|byout|piece|pieces)/i';
        if (preg_match($roomsRegex, $query, $matches)) {
            $dto->bedrooms = (int) $matches[1];
            $query = preg_replace($roomsRegex, '', $query);
        }

        // Extract Surface (e.g., 100 m2, 100m, 100 metre)
        $surfaceRegex = '/(\d+)\s*(?:m2|m²|m\s*2|metre|metres)/i';
        if (preg_match($surfaceRegex, $query, $matches)) {
            $dto->surface = (int) $matches[1];
            $query = preg_replace($surfaceRegex, '', $query);
        }

        // Clean up double spaces
        $query = trim(preg_replace('/\s+/', ' ', $query));

        return $query;
    }
}
