<?php

namespace App\Services\Ai;

use App\Models\AiGenerationLog;
use App\Models\User;

class AiGenerationLogger
{
    /**
     * @param  array<string, mixed>  $inputData
     */
    public function log(User $user, array $inputData, string $outputText, ?string $style, ?int $tokensUsed): void
    {
        AiGenerationLog::query()->create([
            'user_id' => $user->id,
            'input_data' => $inputData,
            'output_text' => $outputText,
            'style' => $style,
            'tokens_used' => $tokensUsed,
            'created_at' => now(),
        ]);
    }
}
