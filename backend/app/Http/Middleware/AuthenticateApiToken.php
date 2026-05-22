<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();

        if (! $plainTextToken) {
            return $this->unauthorizedResponse();
        }

        $apiToken = ApiToken::query()
            ->with('user')
            ->where('token', hash('sha256', $plainTextToken))
            ->first();

        if (! $apiToken || ! $apiToken->user) {
            return $this->unauthorizedResponse();
        }

        if ($apiToken->expires_at && $apiToken->expires_at->isPast()) {
            $apiToken->delete();

            return $this->unauthorizedResponse('Session expiree. Merci de vous reconnecter.');
        }

        if ($apiToken->user->status === 'bloque') {
            $apiToken->delete();

            return response()->json([
                'message' => 'Votre compte a ete bloque par un administrateur.',
            ], 403);
        }

        $apiToken->forceFill([
            'last_used_at' => now(),
        ])->save();

        $request->attributes->set('current_api_token', $apiToken);
        $request->setUserResolver(fn () => $apiToken->user);

        return $next($request);
    }

    private function unauthorizedResponse(string $message = 'Authentification requise.'): JsonResponse
    {
        return response()->json([
            'message' => $message,
        ], 401);
    }
}
