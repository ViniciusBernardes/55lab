<?php

namespace App\Services\Licitacao\Alerta;

class EditalSegmentoMatcher
{
    /**
     * @param  list<string>|null  $allowedSegmentos
     * @return list<string>
     */
    public function match(string $texto, ?array $allowedSegmentos = null): array
    {
        if ($this->shouldExclude($texto)) {
            return [];
        }

        $normalized = $this->normalize($texto);
        $segmentosConfig = config('edital_alerta.segmentos', []);
        $allowed = $allowedSegmentos ?: array_keys($segmentosConfig);
        $matched = [];

        $compact = str_replace(' ', '', $normalized);

        foreach ($allowed as $segmento) {
            $keywords = $segmentosConfig[$segmento]['keywords'] ?? [];
            foreach ($keywords as $keyword) {
                $needle = $this->normalize((string) $keyword);
                if ($needle === '') {
                    continue;
                }

                // PDF às vezes quebra palavras ("PROT OCOLOS", "SOFTW ARE")
                if (str_contains($normalized, $needle) || str_contains($compact, str_replace(' ', '', $needle))) {
                    $matched[] = $segmento;
                    break;
                }
            }
        }

        return $matched;
    }

    public function shouldExclude(string $texto): bool
    {
        return $this->containsAnyKeyword($texto, config('edital_alerta.excluir_keywords', []));
    }

    public function shouldHighlight(string $texto): bool
    {
        if ($this->shouldExclude($texto)) {
            return false;
        }

        return $this->containsAnyKeyword($texto, config('edital_alerta.destacar_keywords', []));
    }

    public function primary(string $texto, ?array $allowedSegmentos = null): ?string
    {
        $matched = $this->match($texto, $allowedSegmentos);

        return $matched[0] ?? null;
    }

    public function label(string $segmento): string
    {
        return (string) (config("edital_alerta.segmentos.{$segmento}.label") ?: $segmento);
    }

    /** @param  list<string>  $keywords */
    private function containsAnyKeyword(string $texto, array $keywords): bool
    {
        $normalized = $this->normalize($texto);
        if ($normalized === '') {
            return false;
        }

        $compact = str_replace(' ', '', $normalized);

        foreach ($keywords as $keyword) {
            $needle = $this->normalize((string) $keyword);
            if ($needle === '') {
                continue;
            }

            if (str_contains($normalized, $needle) || str_contains($compact, str_replace(' ', '', $needle))) {
                return true;
            }
        }

        return false;
    }

    private function normalize(string $value): string
    {
        $value = mb_strtolower($value);
        $transliterated = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if (is_string($transliterated) && $transliterated !== '') {
            $value = $transliterated;
        } else {
            $map = [
                'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a',
                'é' => 'e', 'ê' => 'e',
                'í' => 'i',
                'ó' => 'o', 'ô' => 'o', 'õ' => 'o',
                'ú' => 'u',
                'ç' => 'c',
            ];
            $value = strtr($value, $map);
        }

        return trim((string) preg_replace('/\s+/', ' ', $value));
    }
}
