<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateExternalHelpdeskApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('helpdesk.external_api_key');

        if (! filled($expected)) {
            return response()->json([
                'message' => 'Integração externa não configurada.',
            ], 503);
        }

        $provided = $request->header('X-API-KEY');

        if (! is_string($provided) || ! hash_equals($expected, $provided)) {
            return response()->json([
                'message' => 'API key inválida.',
            ], 401);
        }

        return $next($request);
    }
}
