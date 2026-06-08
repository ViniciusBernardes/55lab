<?php

namespace App\Services\Licitacao\EditalAi;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiPdfAnalyzer
{
    /**
     * @return array<string, mixed>
     */
    public function analyze(
        string $apiKey,
        string $baseUrl,
        string $model,
        string $systemPrompt,
        string $pdfPath,
        string $filename,
    ): array {
        $fileId = $this->uploadPdf($apiKey, $baseUrl, $pdfPath, $filename);

        $response = Http::withToken($apiKey)
            ->baseUrl(rtrim($baseUrl, '/'))
            ->timeout(360)
            ->post('/responses', [
                'model' => $model,
                'input' => [
                    [
                        'role' => 'system',
                        'content' => [
                            ['type' => 'input_text', 'text' => $systemPrompt],
                        ],
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            ['type' => 'input_file', 'file_id' => $fileId],
                            [
                                'type' => 'input_text',
                                'text' => 'Analise o edital em PDF anexado e retorne o JSON completo conforme as instruções do sistema.',
                            ],
                        ],
                    ],
                ],
                'text' => [
                    'format' => ['type' => 'json_object'],
                ],
            ]);

        $this->deleteFile($apiKey, $baseUrl, $fileId);

        if (! $response->successful()) {
            throw new RuntimeException('Falha na API OpenAI (PDF): '.$response->body());
        }

        $content = $this->extractResponseText($response->json());

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('Resposta vazia da IA ao analisar o PDF.');
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Resposta inválida da IA ao analisar o PDF.');
        }

        return $decoded;
    }

    private function uploadPdf(string $apiKey, string $baseUrl, string $pdfPath, string $filename): string
    {
        $response = Http::withToken($apiKey)
            ->baseUrl(rtrim($baseUrl, '/'))
            ->timeout(120)
            ->attach('file', file_get_contents($pdfPath), $filename)
            ->post('/files', ['purpose' => 'user_data']);

        if (! $response->successful()) {
            throw new RuntimeException('Falha ao enviar PDF para OpenAI: '.$response->body());
        }

        $fileId = $response->json('id');

        if (! is_string($fileId) || $fileId === '') {
            throw new RuntimeException('OpenAI não retornou ID do arquivo enviado.');
        }

        return $fileId;
    }

    private function deleteFile(string $apiKey, string $baseUrl, string $fileId): void
    {
        Http::withToken($apiKey)
            ->baseUrl(rtrim($baseUrl, '/'))
            ->delete('/files/'.$fileId);
    }

    /** @param  array<string, mixed>|null  $payload */
    private function extractResponseText(?array $payload): ?string
    {
        if (! is_array($payload)) {
            return null;
        }

        foreach ($payload['output'] ?? [] as $item) {
            if (! is_array($item)) {
                continue;
            }

            foreach ($item['content'] ?? [] as $content) {
                if (! is_array($content)) {
                    continue;
                }

                if (($content['type'] ?? null) === 'output_text' && isset($content['text'])) {
                    return (string) $content['text'];
                }
            }
        }

        return data_get($payload, 'output.0.content.0.text')
            ?? data_get($payload, 'choices.0.message.content');
    }
}
