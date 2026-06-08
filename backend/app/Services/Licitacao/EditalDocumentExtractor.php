<?php

namespace App\Services\Licitacao;

use App\Exceptions\PdfSecuredException;
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

    public function isPdf(Edital $edital): bool
    {
        if (! $edital->arquivo_path) {
            return false;
        }

        $mime = strtolower((string) $edital->arquivo_mime);
        $extension = strtolower(pathinfo((string) $edital->arquivo_nome_original, PATHINFO_EXTENSION));

        return $extension === 'pdf' || $mime === 'application/pdf';
    }

    public function absolutePath(Edital $edital): string
    {
        if (! $edital->arquivo_path || ! Storage::disk('local')->exists($edital->arquivo_path)) {
            throw new RuntimeException('Arquivo do edital não encontrado.');
        }

        return Storage::disk('local')->path($edital->arquivo_path);
    }

    private function extractPdf(string $path): string
    {
        try {
            $parser = new PdfParser;
            $pdf = $parser->parseFile($path);
            $text = trim($pdf->getText());

            if ($text !== '') {
                return $text;
            }
        } catch (\Throwable $e) {
            if ($this->isSecuredPdfError($e)) {
                return $this->handleSecuredPdf($path);
            }

            throw new RuntimeException('Não foi possível extrair texto do PDF: '.$e->getMessage(), 0, $e);
        }

        $popplerText = $this->extractPdfWithPoppler($path);
        if ($popplerText !== '') {
            return $popplerText;
        }

        throw new RuntimeException('Não foi possível extrair texto do PDF. O arquivo pode ser digitalizado como imagem.');
    }

    private function handleSecuredPdf(string $path): string
    {
        $popplerText = $this->extractPdfWithPoppler($path);
        if ($popplerText !== '') {
            return $popplerText;
        }

        throw new PdfSecuredException;
    }

    private function extractPdfWithPoppler(string $path): string
    {
        if (! $this->commandExists('pdftotext')) {
            return '';
        }

        $tmp = tempnam(sys_get_temp_dir(), 'edital_');
        if ($tmp === false) {
            return '';
        }

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

        return $text;
    }

    private function isSecuredPdfError(\Throwable $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'secured pdf')
            || str_contains($message, 'encrypted')
            || str_contains($message, 'password');
    }

    private function commandExists(string $command): bool
    {
        $path = trim((string) shell_exec(sprintf('command -v %s 2>/dev/null', escapeshellarg($command))));

        return $path !== '';
    }
}
