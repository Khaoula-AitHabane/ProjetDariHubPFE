<?php

namespace App\Enums;

enum AiDescriptionStyle: string
{
    case Professional = 'professional';
    case Premium = 'premium';
    case Short = 'short';

    public function label(): string
    {
        return match ($this) {
            self::Professional => 'professionnel',
            self::Premium => 'premium',
            self::Short => 'court',
        };
    }

    public function maxWords(): int
    {
        return match ($this) {
            self::Short => 70,
            default => 220,
        };
    }

    public function minWords(): int
    {
        return match ($this) {
            self::Short => 50,
            default => 120,
        };
    }

    public function temperature(): float
    {
        return match ($this) {
            self::Premium => 0.85,
            self::Short => 0.55,
            default => 0.7,
        };
    }

    public function maxOutputTokens(): int
    {
        return match ($this) {
            self::Short => 140,
            default => 420,
        };
    }

    public function toneInstruction(): string
    {
        return match ($this) {
            self::Professional => 'Adopte un ton professionnel, chaleureux, rassurant et fluide, comme un vrai conseiller immobilier ou commercial experimenté.',
            self::Premium => 'Adopte un ton premium, elegant et marketing, proche d un agent immobilier haut de gamme, en valorisant le confort, la luminosite, l emplacement, la qualite et l ambiance sans exageration mensongere.',
            self::Short => 'Adopte un ton direct, fluide et impactant, avec une description tres concise de 50 a 70 mots maximum.',
        };
    }
}
