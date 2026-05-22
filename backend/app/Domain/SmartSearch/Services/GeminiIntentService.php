<?php

namespace App\Domain\SmartSearch\Services;

use App\Domain\SmartSearch\DTO\SearchIntentDTO;
use App\Services\Ai\GeminiDescriptionGenerator;

class GeminiIntentService
{
    public function __construct(
        private readonly GeminiDescriptionGenerator $generator
    ) {
    }

    public function extractIntent(string $query, SearchIntentDTO $dto): void
    {
        if (trim($query) === '') {
            return;
        }

        $systemInstruction = "Tu es un assistant d'analyse d'intention pour un moteur de recherche immobilier et services (DariHub). 
Ton but est d'extraire les informations d'une requête utilisateur (souvent en darija, français, ou arabe avec des fautes) et de retourner STRICTEMENT du JSON. 
Si une information n'est pas trouvée, mets null.
Les types de propriétés possibles (propertyType) : maison, appartement, villa, terrain, bureau.
Les types de services possibles (serviceType) : plombier, electricien, menuisier, peintre, nettoyage, etc.
La catégorie (category) : immobilier, meuble, service.
Le type de transaction (listingKind) : rent, sale.";

        $schema = [
            'type' => 'object',
            'properties' => [
                'category' => ['type' => 'string', 'nullable' => true],
                'listingKind' => ['type' => 'string', 'nullable' => true],
                'city' => ['type' => 'string', 'nullable' => true],
                'propertyType' => ['type' => 'string', 'nullable' => true],
                'serviceType' => ['type' => 'string', 'nullable' => true],
                'keywords' => ['type' => 'string', 'nullable' => true, 'description' => 'Mots clés restants non catégorisés'],
            ]
        ];

        try {
            $result = $this->generator->generateStructuredJson(
                $systemInstruction,
                $query,
                $schema,
                ['temperature' => 0.1, 'max_output_tokens' => 150]
            );

            if (!empty($result['category']) && !$dto->category) $dto->category = $result['category'];
            if (!empty($result['listingKind']) && !$dto->listingKind) $dto->listingKind = $result['listingKind'];
            if (!empty($result['city']) && !$dto->city) $dto->city = $result['city'];
            if (!empty($result['propertyType']) && !$dto->propertyType) $dto->propertyType = $result['propertyType'];
            if (!empty($result['serviceType']) && !$dto->serviceType) $dto->serviceType = $result['serviceType'];
            if (!empty($result['keywords']) && !$dto->keywords) $dto->keywords = $result['keywords'];

        } catch (\Exception $e) {
            // Fallback: Just put the query in keywords if Gemini fails
            if (!$dto->keywords) {
                $dto->keywords = $query;
            }
        }
    }
}
