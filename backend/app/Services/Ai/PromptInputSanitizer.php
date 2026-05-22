<?php

namespace App\Services\Ai;

use Illuminate\Support\Str;

class PromptInputSanitizer
{
    /**
     * @var array<int, string>
     */
    private const INJECTION_PATTERNS = [
        '/```.*?```/isu',
        '/<script\b[^>]*>.*?<\/script>/isu',
        '/\b(ignore|disregard|override|bypass)\b.{0,80}\b(previous|prior|system|developer|assistant|above)?\s*\b(instruction|instructions|prompt|rules?|message)\b/iu',
        '/\b(return|output|respond\s+with|answer\s+with)\b.{0,60}\b(json|markdown|xml|yaml|html|code|bullet(?:s)?|list)\b/iu',
        '/\b(do\s*not|don\'t)\b.{0,40}\b(json|markdown|paragraph|format)\b/iu',
        '/\b(act\s+as|roleplay\s+as|pretend\s+to\s+be)\b.{0,80}/iu',
        '/\b(system|assistant|developer)\s*:/iu',
    ];

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function sanitizePayload(array $input): array
    {
        return [
            'title' => $this->sanitizeRequiredText((string) ($input['title'] ?? ''), 180, 'Titre non precise'),
            'city' => $this->sanitizeRequiredText((string) ($input['city'] ?? ''), 120, 'Ville non precisee'),
            'price' => max(0, (float) ($input['price'] ?? 0)),
            'service_type' => (string) ($input['service_type'] ?? 'home_service'),
            'category' => $this->sanitizeRequiredText((string) ($input['category'] ?? ''), 160, 'Categorie non precisee'),
            'listing_kind' => isset($input['listing_kind']) ? (string) $input['listing_kind'] : null,
            'bedrooms' => isset($input['bedrooms']) && $input['bedrooms'] !== null ? max(0, (int) $input['bedrooms']) : null,
            'surface' => isset($input['surface']) && $input['surface'] !== null ? max(1, (int) $input['surface']) : null,
            'description' => $this->sanitizeOptionalText($input['description'] ?? null, 1500),
            'additional_info' => $this->sanitizeOptionalText($input['additional_info'] ?? null, 1200),
        ];
    }

    public function sanitizeNaturalLanguageQuery(string $query, int $maxLength = 280): string
    {
        return $this->sanitizeText($query, $maxLength);
    }

    private function sanitizeRequiredText(string $value, int $maxLength, string $fallback): string
    {
        $sanitized = $this->sanitizeText($value, $maxLength);

        return $sanitized !== '' ? $sanitized : $fallback;
    }

    private function sanitizeOptionalText(mixed $value, int $maxLength): ?string
    {
        if ($value === null) {
            return null;
        }

        $sanitized = $this->sanitizeText((string) $value, $maxLength);

        return $sanitized !== '' ? $sanitized : null;
    }

    private function sanitizeText(string $value, int $maxLength): string
    {
        $sanitized = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $sanitized = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $sanitized) ?? $sanitized;

        foreach (self::INJECTION_PATTERNS as $pattern) {
            $sanitized = preg_replace($pattern, ' ', $sanitized) ?? $sanitized;
        }

        $sanitized = str_replace(['{', '}', '[', ']', '<', '>', '`'], ' ', $sanitized);
        $sanitized = preg_replace('/\s+/u', ' ', $sanitized) ?? $sanitized;
        $sanitized = trim(Str::limit(trim($sanitized), $maxLength, ''));

        return $sanitized;
    }
}
