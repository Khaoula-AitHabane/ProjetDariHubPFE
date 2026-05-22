<?php

namespace App\Domain\SmartSearch\DTO;

class SearchIntentDTO
{
    public ?string $category = null; // immobilier, meuble, service
    public ?string $listingKind = null; // rent, sale
    public ?string $city = null;
    public ?string $propertyType = null; // maison, appartement, villa, etc.
    public ?string $serviceType = null; // plombier, electricien, etc.
    public ?float $maxPrice = null;
    public ?float $minPrice = null;
    public ?int $bedrooms = null;
    public ?int $surface = null;
    public ?string $keywords = null; // Any remaining unstructured keywords
    
    // V2 Features
    public ?string $originalQuery = null;
    public ?string $correctedQuery = null;
    public bool $isCorrected = false;
    public ?string $semanticBoost = null; // 'urgent', 'cheap', 'premium' etc.

    public function toArray(): array
    {
        return array_filter([
            'category' => $this->category,
            'listingKind' => $this->listingKind,
            'city' => $this->city,
            'propertyType' => $this->propertyType,
            'serviceType' => $this->serviceType,
            'maxPrice' => $this->maxPrice,
            'minPrice' => $this->minPrice,
            'bedrooms' => $this->bedrooms,
            'surface' => $this->surface,
            'keywords' => $this->keywords,
            'originalQuery' => $this->originalQuery,
            'correctedQuery' => $this->correctedQuery,
            'isCorrected' => $this->isCorrected,
            'semanticBoost' => $this->semanticBoost,
        ], fn($value) => !is_null($value));
    }
}
