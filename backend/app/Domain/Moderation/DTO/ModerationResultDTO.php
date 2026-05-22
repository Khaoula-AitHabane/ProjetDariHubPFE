<?php

namespace App\Domain\Moderation\DTO;

class ModerationResultDTO
{
    public function __construct(
        public readonly string $riskLevel,       // low | medium | high
        public readonly int    $confidence,       // 0-100
        public readonly bool   $isSuspicious,
        public readonly array  $reasons,
        public readonly string $recommendation,   // approve | review | reject
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            riskLevel:      in_array($data['risk_level'] ?? '', ['low', 'medium', 'high'])
                                ? $data['risk_level']
                                : 'medium',
            confidence:     (int) min(100, max(0, $data['confidence'] ?? 50)),
            isSuspicious:   (bool) ($data['is_suspicious'] ?? false),
            reasons:        array_values(array_filter(array_map('strval', $data['reasons'] ?? []))),
            recommendation: in_array($data['recommendation'] ?? '', ['approve', 'review', 'reject'])
                                ? $data['recommendation']
                                : 'review',
        );
    }

    /** Safe fallback when Gemini is unavailable */
    public static function safe(): self
    {
        return new self(
            riskLevel:      'low',
            confidence:     0,
            isSuspicious:   false,
            reasons:        ['Analyse IA indisponible - vérification manuelle recommandée'],
            recommendation: 'review',
        );
    }

    public function toArray(): array
    {
        return [
            'risk_level'     => $this->riskLevel,
            'confidence'     => $this->confidence,
            'is_suspicious'  => $this->isSuspicious,
            'reasons'        => $this->reasons,
            'recommendation' => $this->recommendation,
        ];
    }
}
