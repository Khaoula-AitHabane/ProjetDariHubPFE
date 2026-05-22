<?php

namespace App\Services\Ai;

use App\Enums\AiDescriptionStyle;
use App\Models\User;

class AiDescriptionService
{
    public function __construct(
        private readonly PromptInputSanitizer $inputSanitizer,
        private readonly AiPromptFactory $promptFactory,
        private readonly GeminiDescriptionGenerator $generator,
        private readonly AiGenerationLogger $logger,
    ) {
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function generate(User $user, array $input): array
    {
        return $this->process($user, $input, AiDescriptionStyle::Professional, null);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function regenerate(User $user, array $input, AiDescriptionStyle $style): array
    {
        return $this->process($user, $input, $style, $style);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function process(
        User $user,
        array $input,
        AiDescriptionStyle $promptStyle,
        ?AiDescriptionStyle $loggedStyle,
    ): array {
        $sanitizedInput = $this->inputSanitizer->sanitizePayload($input);
        $systemInstruction = $this->promptFactory->buildSystemInstruction($sanitizedInput, $promptStyle);
        $userPrompt = $this->promptFactory->buildUserPrompt($sanitizedInput, $promptStyle);

        $result = $this->generator->generate(
            $systemInstruction,
            $userPrompt,
            [
                'temperature' => $promptStyle->temperature(),
                'max_output_tokens' => $promptStyle->maxOutputTokens(),
            ],
        );

        $this->logger->log(
            $user,
            $sanitizedInput,
            $result->text,
            $loggedStyle?->value,
            $result->tokensUsed,
        );

        return [
            'description' => $result->text,
            'style' => $promptStyle->value,
            'tokens_used' => $result->tokensUsed,
        ];
    }
}
