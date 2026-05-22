<?php

namespace App\Http\Requests;

use App\Enums\AiDescriptionStyle;
use Illuminate\Validation\Rule;

class RegenerateAiDescriptionRequest extends GenerateAiDescriptionRequest
{
    /**
     * @return array<string, array<int, string|\Illuminate\Contracts\Validation\ValidationRule>>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'style' => ['required', Rule::enum(AiDescriptionStyle::class)],
        ];
    }
}
