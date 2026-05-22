<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use JsonException;

class GeminiDescriptionGenerator
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {
    }

    /**
     * @param  array<string, mixed>  $options
     */
    public function generate(string $systemInstruction, string $userPrompt, array $options = []): AiGenerationResult
    {
        $payload = $this->requestPayload($systemInstruction, $userPrompt, $options);
        $text = $this->extractPlainText($payload);
        $tokensUsed = data_get($payload, 'usageMetadata.totalTokenCount');

        return new AiGenerationResult(
            $text,
            is_numeric($tokensUsed) ? (int) $tokensUsed : null,
        );
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function generateStructuredJson(
        string $systemInstruction,
        string $userPrompt,
        array $schema,
        array $options = [],
    ): array {
        $payload = $this->requestPayload($systemInstruction, $userPrompt, array_merge($options, [
            'response_mime_type' => 'application/json',
            'response_json_schema' => $schema,
        ]));

        return $this->extractJsonObject($payload);
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function requestPayload(string $systemInstruction, string $userPrompt, array $options): array
    {
        $apiKey = trim((string) config('services.gemini.api_key'));
        $model = trim((string) config('services.gemini.model', 'gemini-2.5-flash'));
        $baseUrl = rtrim((string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $timeout = max(5, (int) ($options['timeout'] ?? config('services.gemini.timeout', 20)));

        if ($apiKey === '') {
            throw new RuntimeException('La cle Gemini est absente. Ajoute GEMINI_API_KEY dans le fichier .env.', 503);
        }

        try {
            $response = $this->http
                ->baseUrl($baseUrl)
                ->acceptJson()
                ->timeout($timeout)
                ->withHeaders([
                    'x-goog-api-key' => $apiKey,
                ])
                ->post("/models/{$model}:generateContent", $this->buildPayload($systemInstruction, $userPrompt, $options))
                ->throw();
        } catch (ConnectionException $exception) {
            Log::warning('Gemini content generation connection failed.', [
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException(
                'Impossible de joindre Gemini pour le moment. Verifie la connexion reseau ou reessaie dans quelques instants.',
                504,
            );
        } catch (RequestException $exception) {
            $status = $exception->response?->status() ?? 502;
            $apiMessage = data_get($exception->response?->json(), 'error.message', '');

            Log::warning('Gemini content generation failed.', [
                'status' => $status,
                'response' => $exception->response?->json(),
            ]);

            throw new RuntimeException($this->resolveFailureMessage($status, $apiMessage), $status);
        }

        return $response->json();
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function buildPayload(string $systemInstruction, string $userPrompt, array $options): array
    {
        $generationConfig = [
            'temperature' => (float) ($options['temperature'] ?? 0.7),
            'topP' => 0.9,
            'maxOutputTokens' => (int) ($options['max_output_tokens'] ?? 220),
            'responseMimeType' => (string) ($options['response_mime_type'] ?? 'text/plain'),
        ];

        if (isset($options['response_json_schema']) && is_array($options['response_json_schema'])) {
            $generationConfig['responseJsonSchema'] = $options['response_json_schema'];
        }

        return [
            'system_instruction' => [
                'parts' => [
                    [
                        'text' => $systemInstruction,
                    ],
                ],
            ],
            'contents' => [
                [
                    'parts' => [
                        [
                            'text' => $userPrompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => $generationConfig,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function extractPlainText(array $payload): string
    {
        $text = $this->extractResponseText($payload);

        if (str_contains($text, '```') || preg_match('/^\s*[\{\[]/u', $text) === 1) {
            throw new RuntimeException('Le modele IA a retourne un format non conforme. Merci de reessayer.', 502);
        }

        return $text;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function extractJsonObject(array $payload): array
    {
        $text = $this->extractResponseText($payload);

        if (str_contains($text, '```')) {
            throw new RuntimeException('Gemini n a pas retourne un JSON exploitable pour la recherche intelligente.', 502);
        }

        try {
            $decoded = json_decode($text, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new RuntimeException('Gemini n a pas retourne un JSON exploitable pour la recherche intelligente.', 502);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('Le JSON retourne par Gemini pour la recherche intelligente est invalide.', 502);
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function extractResponseText(array $payload): string
    {
        $text = collect(data_get($payload, 'candidates.0.content.parts', []))
            ->pluck('text')
            ->filter(fn ($value) => is_string($value) && trim($value) !== '')
            ->implode(' ');

        $text = trim((string) preg_replace('/\s+/u', ' ', str_replace(["\r\n", "\r", "\n"], ' ', $text)));
        $text = trim($text, " \t\n\r\0\x0B\"'");

        if ($text === '') {
            $blockReason = data_get($payload, 'promptFeedback.blockReason');

            throw new RuntimeException(
                $blockReason
                    ? 'La generation IA a ete bloquee par les filtres de securite de Gemini.'
                    : 'Gemini n a pas retourne de description exploitable.',
                502,
            );
        }

        return $text;
    }

    private function resolveFailureMessage(int $status, string $apiMessage): string
    {
        return match ($status) {
            401, 403 => 'La configuration Gemini est invalide ou non autorisee. Verifie GEMINI_API_KEY et GEMINI_MODEL.',
            429 => 'Le quota Gemini gratuit est temporairement atteint. Reessaie dans quelques instants.',
            default => $apiMessage !== ''
                ? 'Gemini est momentanement indisponible: '.$apiMessage
                : 'Impossible de generer la description pour le moment.',
        };
    }
}
