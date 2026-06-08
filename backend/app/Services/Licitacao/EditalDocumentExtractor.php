<?php

namespace App\Services\Licitacao;

use App\Models\Licitacao\Edital;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;

class EditalDocumentExtractor
{
    public function extract(Edital $edital): string
    {
        if (! $edital->arquivo_path || ! Storage::disk('local')->exists($edital->arquivo_path)) {
            throw new RuntimeException('Arquivo do edital não encontrado.');
        }

        $path = Storage::disk('local')->path($edital->arquivo_path);
        $mime = strtolower((string) $edital->arquivo_mime);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        if ($extension === 'txt' || str_starts_with($mime, 'text/')) {
            $text = trim((string) file_get_contents($path));

            return $text !== '' ? $text : 'Arquivo de texto vazio.';
        }

        if ($extension === 'pdf' || $mime === 'application/pdf') {
            return $this->extractPdf($path);
        }

        if (in_array($extension, ['doc', 'docx'], true)) {
            return 'Documento Word anexado ('.$edital->arquivo_nome_original.'). Extração automática de DOC/DOCX ainda não disponível — envie PDF ou TXT para análise completa.';
        }

        throw new RuntimeException('Formato de arquivo não suportado para extração de texto.');
    }

    private function extractPdf(string $path): string
    {
        $parser = new PdfParser;
        $pdf = $parser->parseFile($path);
        $text = trim($pdf->getText());

        if ($text === '') {
            throw new RuntimeException('Não foi possível extrair texto do PDF. O arquivo pode ser digitalizado como imagem.');
        }

        return $text;
    }
}
