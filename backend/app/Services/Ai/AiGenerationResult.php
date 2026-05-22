<?php

namespace App\Services\Ai;

class AiGenerationResult
{
    public function __construct(
        public readonly string $text,
        public readonly ?int $tokensUsed = null,
    ) {
    }
}
