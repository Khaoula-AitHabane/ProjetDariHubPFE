<?php

namespace App\Domain\Moderation\Services;

use App\Domain\Moderation\DTO\ModerationResultDTO;
use App\Services\Ai\GeminiDescriptionGenerator;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GeminiModerationService
{
    public function __construct(
        private readonly GeminiDescriptionGenerator $gemini,
    ) {}

    public function analyze(string $title, string $description, string $phone, float $price): ModerationResultDTO
    {
        $systemInstruction = <<<'SYSTEM'
Tu es un système expert de modération de contenu pour une plateforme marocaine d'annonces immobilières, meubles et services nommée DariHub.

TON RÔLE : Analyser les annonces et retourner une évaluation JSON stricte. Tu es un ASSISTANT, pas un décideur final. L'administrateur prend toujours la décision finale.

RÈGLES ABSOLUES :
1. Retourner UNIQUEMENT du JSON valide, aucun texte en dehors
2. Ne jamais bloquer automatiquement une annonce
3. Être objectif et transparent dans les raisons
4. Analyser le contenu en français, arabe ET darija marocaine

CHAMPS DE SORTIE (obligatoires) :
- risk_level : "low" | "medium" | "high"
- confidence : entier entre 0 et 100
- is_suspicious : boolean
- reasons : tableau de chaînes expliquant l'analyse (en français)
- recommendation : "approve" | "review" | "reject"

CRITÈRES D'ÉVALUATION :
- SPAM : mots promotionnels excessifs, répétitions, texte incohérent
- FRAUDE : prix impossibles, promesses irréalistes, liens externes
- CONTENU COURT : titre < 10 chars ou description < 50 chars = suspect
- INSULTES : mots offensants en fr/ar/darija
- TÉLÉPHONE SUSPECT : formats invalides, numéros fictifs (000000, 111111...)
- PRIX ANORMAL : 0 DH, > 1 000 000 DH sans justification
SYSTEM;

        $userPrompt = <<<PROMPT
Analyse cette annonce et retourne uniquement le JSON de modération :

TITRE : {$title}

DESCRIPTION : {$description}

TÉLÉPHONE : {$phone}

PRIX : {$price} DH

Retourne uniquement ce JSON (sans markdown, sans texte autour) :
{
  "risk_level": "low|medium|high",
  "confidence": <0-100>,
  "is_suspicious": <true|false>,
  "reasons": ["raison 1", "raison 2"],
  "recommendation": "approve|review|reject"
}
PROMPT;

        $schema = [
            'type' => 'object',
            'properties' => [
                'risk_level'     => ['type' => 'string', 'enum' => ['low', 'medium', 'high']],
                'confidence'     => ['type' => 'integer'],
                'is_suspicious'  => ['type' => 'boolean'],
                'reasons'        => ['type' => 'array', 'items' => ['type' => 'string']],
                'recommendation' => ['type' => 'string', 'enum' => ['approve', 'review', 'reject']],
            ],
            'required' => ['risk_level', 'confidence', 'is_suspicious', 'reasons', 'recommendation'],
        ];

        try {
            $result = $this->gemini->generateStructuredJson(
                $systemInstruction,
                $userPrompt,
                $schema,
                ['temperature' => 0.1, 'max_output_tokens' => 500, 'timeout' => 25],
            );

            return ModerationResultDTO::fromArray($result);
        } catch (RuntimeException $e) {
            Log::warning('GeminiModerationService: Gemini call failed, using safe fallback.', [
                'error' => $e->getMessage(),
            ]);

            return ModerationResultDTO::safe();
        }
    }
}
