<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateAiDescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];

        foreach (['title', 'city', 'category', 'description', 'additional_info'] as $field) {
            if (! $this->exists($field)) {
                continue;
            }

            $normalized[$field] = $this->normalizeString($this->input($field));
        }

        $this->merge($normalized);
    }

    /**
     * @return array<string, array<int, string|\Illuminate\Contracts\Validation\ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'city' => ['required', 'string', 'max:120'],
            'price' => ['required', 'numeric', 'min:0'],
            'service_type' => ['required', Rule::in(['house_rental', 'furniture_rental', 'home_service'])],
            'category' => ['required', 'string', 'max:160'],
            'listing_kind' => ['nullable', Rule::in(['rent', 'sale'])],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'surface' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'description' => ['nullable', 'string', 'max:1500'],
            'additional_info' => ['nullable', 'string', 'max:1200'],
        ];
    }

    private function normalizeString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) preg_replace('/\s+/u', ' ', (string) $value));

        return $normalized === '' ? null : $normalized;
    }
}
