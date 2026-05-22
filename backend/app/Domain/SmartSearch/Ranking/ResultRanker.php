<?php

namespace App\Domain\SmartSearch\Ranking;

use Illuminate\Support\Collection;
use App\Domain\SmartSearch\DTO\SearchIntentDTO;

class ResultRanker
{
    public function rank(Collection $services, SearchIntentDTO $intent): Collection
    {
        return $services->map(function ($service) use ($intent) {
            $score = $this->calculateScore($service, $intent);
            $service->search_score = $score;
            return $service;
        })->sortByDesc('search_score')->values();
    }

    private function calculateScore($service, SearchIntentDTO $intent): int
    {
        $score = 0;

        // +5 city exact match, +2 partial match
        if ($intent->city) {
            $intentCity = strtolower($intent->city);
            $serviceCity = strtolower($service->location_city ?? '');
            
            if ($intentCity === $serviceCity) {
                $score += 5;
            } elseif (str_contains($serviceCity, $intentCity)) {
                $score += 2;
            }
        }

        // +4 service_type / property_type exact match
        if ($intent->propertyType || $intent->serviceType) {
            $type = strtolower($intent->propertyType ?? $intent->serviceType);
            $category = strtolower($service->category ?? '');
            
            if (str_contains($category, $type)) {
                $score += 4;
            }
        }

        // Keywords in title and description
        if ($intent->keywords) {
            $keywords = explode(' ', strtolower($intent->keywords));
            $title = strtolower($service->title ?? '');
            $description = strtolower($service->description ?? '');
            
            foreach ($keywords as $kw) {
                if (strlen($kw) > 2) {
                    if (str_contains($title, $kw)) {
                        $score += 3;
                    }
                    if (str_contains($description, $kw)) {
                        $score += 2;
                    }
                }
            }
        }

        // +2 featured listing
        if ($service->is_featured) {
            $score += 2;
        }

        // +1 high rating
        if ($service->rating >= 4.0) {
            $score += 1;
        }

        // +1 freshness (created in the last 7 days)
        if ($service->created_at && $service->created_at->diffInDays(now()) <= 7) {
            $score += 1;
        }

        // +2 popularity (click_count) -> wait, we need to add click_count to DB first.
        // Assuming we add it:
        if (isset($service->click_count) && $service->click_count > 10) {
            $score += 2; // Basic popularity boost
        }

        // Semantic Boost
        if ($intent->semanticBoost) {
            $boost = strtolower($intent->semanticBoost);
            if ($boost === 'urgent' && $service->availability === 'today') {
                $score += 5;
            }
        }

        return $score;
    }
}
