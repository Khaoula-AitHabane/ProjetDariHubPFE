<?php

namespace App\Domain\Moderation\Services;

use App\Domain\Moderation\DTO\ModerationResultDTO;

/**
 * Main orchestrator for AI moderation.
 * 1. Runs fast local pre-checks (no API call)
 * 2. Calls Gemini for deep semantic analysis
 * 3. Merges results into a final ModerationResultDTO
 */
class AiModerationService
{
    public function __construct(
        private readonly ModerationScoringEngine  $scoringEngine,
        private readonly PhoneValidationService   $phoneValidator,
        private readonly GeminiModerationService  $geminiService,
    ) {}

    public function moderate(
        string $title,
        string $description,
        string $phone,
        float  $price,
    ): ModerationResultDTO {
        // Step 1: Fast local pre-checks
        $preCheck    = $this->scoringEngine->analyze($title, $description, $price);
        $phoneCheck  = $this->phoneValidator->analyze($phone);

        $preIssues   = $preCheck['pre_issues'];
        $preScore    = $preCheck['pre_score'];

        if ($phoneCheck['suspicious']) {
            $preIssues[] = $phoneCheck['reason'];
            $preScore   += 25;
        }

        // Step 2: Deep Gemini analysis
        $geminiResult = $this->geminiService->analyze($title, $description, $phone, $price);

        // Step 3: Merge — combine pre-check issues with Gemini reasons
        $allReasons = array_unique(array_merge($preIssues, $geminiResult->reasons));

        // Weighted final confidence: pre-check boosts the Gemini score
        $finalConfidence = (int) min(100, $geminiResult->confidence + ($preScore * 0.3));

        // Escalate risk level if local pre-checks found serious issues
        $finalRiskLevel = $geminiResult->riskLevel;
        if ($preScore >= 50 && $finalRiskLevel === 'low') {
            $finalRiskLevel = 'medium';
        }
        if ($preScore >= 70) {
            $finalRiskLevel = 'high';
        }

        // Escalate recommendation accordingly
        $finalRecommendation = $geminiResult->recommendation;
        if ($finalRiskLevel === 'high' && $finalRecommendation === 'approve') {
            $finalRecommendation = 'review';
        }

        return new ModerationResultDTO(
            riskLevel:      $finalRiskLevel,
            confidence:     $finalConfidence,
            isSuspicious:   $geminiResult->isSuspicious || $phoneCheck['suspicious'] || $preScore >= 40,
            reasons:        array_values($allReasons),
            recommendation: $finalRecommendation,
        );
    }
}
