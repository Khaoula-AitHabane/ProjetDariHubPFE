<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AiGenerationRateLimit
{
    private const MAX_ATTEMPTS = 10;
    private const DECAY_SECONDS = 60;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Authentification requise.',
            ], 401);
        }

        $key = sprintf('ai-generation:%s', $user->id);

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            return $this->tooManyAttemptsResponse($key);
        }

        RateLimiter::hit($key, self::DECAY_SECONDS);

        $response = $next($request);
        $remaining = max(0, self::MAX_ATTEMPTS - RateLimiter::attempts($key));

        $response->headers->set('X-RateLimit-Limit', (string) self::MAX_ATTEMPTS);
        $response->headers->set('X-RateLimit-Remaining', (string) $remaining);

        return $response;
    }

    private function tooManyAttemptsResponse(string $key): JsonResponse
    {
        $retryAfter = RateLimiter::availableIn($key);

        return response()->json([
            'message' => 'Limite atteinte: vous pouvez utiliser la generation IA au maximum 10 fois par minute. Merci de reessayer dans quelques instants.',
            'meta' => [
                'retry_after_seconds' => $retryAfter,
            ],
        ], 429)->header('Retry-After', (string) $retryAfter);
    }
}
