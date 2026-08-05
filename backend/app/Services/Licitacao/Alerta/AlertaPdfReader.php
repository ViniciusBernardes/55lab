<?php

namespace App\Services\Licitacao\Alerta;

use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;

class AlertaPdfReader
{
    /**
     * @return array{text: string, links: list<string>}
     */
    public function read(string $absolutePath): array
    {
        if (! is_file($absolutePath)) {
            throw new RuntimeException('Arquivo de alerta não encontrado.');
        }

        return [
            'text' => $this->extractText($absolutePath),
            'links' => $this->extractLinks($absolutePath),
        ];
    }

    private function extractText(string $path): string
    {
        try {
            $parser = new PdfParser;
            $text = trim($parser->parseFile($path)->getText());
            if ($text !== '') {
                return $text;
            }
        } catch (\Throwable) {
            // fallback abaixo
        }

        if ($this->commandExists('pdftotext')) {
            $tmp = tempnam(sys_get_temp_dir(), 'alerta_');
            if ($tmp !== false) {
                $out = $tmp.'.txt';
                $command = sprintf(
                    'pdftotext -layout %s %s 2>/dev/null',
                    escapeshellarg($path),
                    escapeshellarg($out),
                );
                exec($command, $output, $code);
                $text = ($code === 0 && is_file($out)) ? trim((string) file_get_contents($out)) : '';
                @unlink($out);
                @unlink($tmp);
                if ($text !== '') {
                    return $text;
                }
            }
        }

        throw new RuntimeException('Não foi possível extrair texto do PDF de alerta.');
    }

    /** @return list<string> */
    private function extractLinks(string $path): array
    {
        $raw = (string) file_get_contents($path);
        $links = [];

        if (preg_match_all('/\/URI\s*\((.*?)\)/s', $raw, $matches)) {
            foreach ($matches[1] as $uri) {
                $decoded = $this->decodePdfString($uri);
                if ($this->isHttpUrl($decoded)) {
                    $links[] = $decoded;
                }
            }
        }

        if (preg_match_all('/\/URI\s*<([0-9A-Fa-f\s]+)>/s', $raw, $hexMatches)) {
            foreach ($hexMatches[1] as $hex) {
                $decoded = $this->decodeHexPdfString($hex);
                if ($this->isHttpUrl($decoded)) {
                    $links[] = $decoded;
                }
            }
        }

        return array_values(array_unique($links));
    }

    private function decodePdfString(string $value): string
    {
        $value = str_replace(["\\\n", "\\\r\n", "\\\r"], '', $value);
        $value = preg_replace_callback('/\\\\([nrtbf()\\\\]|[0-7]{1,3})/', function (array $m) {
            return match ($m[1]) {
                'n' => "\n",
                'r' => "\r",
                't' => "\t",
                'b' => "\x08",
                'f' => "\x0C",
                '(', ')', '\\' => $m[1],
                default => chr(octdec($m[1])),
            };
        }, $value) ?? $value;

        return trim($value);
    }

    private function decodeHexPdfString(string $hex): string
    {
        $hex = preg_replace('/\s+/', '', $hex) ?? '';
        if (strlen($hex) % 2 === 1) {
            $hex .= '0';
        }

        $bin = @hex2bin($hex);

        return is_string($bin) ? trim($bin) : '';
    }

    private function isHttpUrl(string $value): bool
    {
        return (bool) preg_match('#^https?://#i', $value);
    }

    private function commandExists(string $command): bool
    {
        $path = trim((string) shell_exec(sprintf('command -v %s 2>/dev/null', escapeshellarg($command))));

        return $path !== '';
    }
}
