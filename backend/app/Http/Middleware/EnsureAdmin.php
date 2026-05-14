<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Connecte-toi d abord.'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Reserve aux administrateurs.'], 403);
        }
        return $next($request);
    }
}
