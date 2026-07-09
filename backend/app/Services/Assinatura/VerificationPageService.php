<?php

namespace App\Services\Assinatura;

use setasign\Fpdi\Tcpdf\Fpdi;

class VerificationPageService
{
    public function __construct(
        private readonly IcpBrasilCertificateService $certificateService,
    ) {}

    /**
     * @param  array<int, array{
     *     nome: string,
     *     cpf_mascarado: string,
     *     papel: string,
     *     assinado_em: string,
     *     cadeia: string,
     *     icp_brasil: bool
     * }>  $signatarios
     */
    public function appendToPdf(
        string $sourcePdfPath,
        string $outputPdfPath,
        string $codigoVerificacao,
        string $urlVerificacao,
        array $signatarios,
    ): void {
        $verificationPagePath = $this->generateVerificationPagePdf(
            $codigoVerificacao,
            $urlVerificacao,
            $signatarios,
        );

        try {
            $this->mergePdfs(
                $sourcePdfPath,
                $verificationPagePath,
                $outputPdfPath,
                $codigoVerificacao,
                $urlVerificacao,
                $signatarios,
            );
        } finally {
            @unlink($verificationPagePath);
        }
    }

    /**
     * @param  array<int, array{
     *     nome: string,
     *     cpf_mascarado: string,
     *     papel: string,
     *     assinado_em: string,
     *     cadeia: string,
     *     icp_brasil: bool
     * }>  $signatarios
     */
    public function generateVerificationPagePdf(
        string $codigoVerificacao,
        string $urlVerificacao,
        array $signatarios,
    ): string {
        $pdf = new Fpdi('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('55LAB');
        $pdf->SetAuthor('55LAB Assinatura Digital');
        $pdf->SetTitle('Verificação das Assinaturas');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(20, 20, 20);
        $pdf->SetAutoPageBreak(true, 20);
        $pdf->AddPage();

        $this->renderHeader($pdf, $codigoVerificacao, $urlVerificacao);
        $this->renderSignatarios($pdf, $signatarios);
        $this->renderFooter($pdf, $urlVerificacao);

        $outputPath = sys_get_temp_dir().'/verif_'.bin2hex(random_bytes(8)).'.pdf';
        $pdf->Output($outputPath, 'F');

        return $outputPath;
    }

    private function renderHeader(Fpdi $pdf, string $codigo, string $urlVerificacao): void
    {
        $logoPath = $this->getIcpLogoPath();
        if ($logoPath && file_exists($logoPath)) {
            $logoHeight = 28;
            $logoWidth = 22;
            $pdf->Image($logoPath, 20, 15, $logoWidth, $logoHeight);
        } else {
            $pdf->SetFillColor(0, 128, 64);
            $pdf->Rect(20, 18, 22, 22, 'F');
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 7);
            $pdf->SetXY(20, 24);
            $pdf->Cell(22, 4, 'ICP', 0, 2, 'C');
            $pdf->Cell(22, 4, 'Brasil', 0, 0, 'C');
            $pdf->SetTextColor(0, 0, 0);
        }

        $pdf->write2DBarcode($urlVerificacao, 'QRCODE,H', 168, 15, 22, 22, [
            'border' => false,
            'padding' => 0,
            'fgcolor' => [0, 0, 0],
            'bgcolor' => false,
        ], 'N');

        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetXY(50, 22);
        $pdf->Cell(110, 8, 'VERIFICAÇÃO DAS ASSINATURAS', 0, 1, 'C');

        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetXY(20, 48);
        $pdf->Cell(170, 6, "Código para verificação: {$codigo}", 0, 1, 'C');

        $pdf->Ln(8);
    }

    /**
     * @param  array<int, array{
     *     nome: string,
     *     cpf_mascarado: string,
     *     papel: string,
     *     assinado_em: string,
     *     cadeia: string,
     *     icp_brasil: bool
     * }>  $signatarios
     */
    private function renderSignatarios(Fpdi $pdf, array $signatarios): void
    {
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(
            170,
            5,
            'Este documento foi assinado digitalmente pelos seguintes signatários nas datas indicadas:',
            0,
            'L',
        );
        $pdf->Ln(6);

        foreach ($signatarios as $signatario) {
            $this->renderSignatario($pdf, $signatario);
            $pdf->Ln(4);
        }
    }

    /**
     * @param  array{
     *     nome: string,
     *     cpf_mascarado: string,
     *     papel: string,
     *     assinado_em: string,
     *     cadeia: string,
     *     icp_brasil: bool
     * }  $signatario
     */
    private function renderSignatario(Fpdi $pdf, array $signatario): void
    {
        $pdf->SetFillColor(0, 128, 64);
        $pdf->Circle(24, $pdf->GetY() + 3, 1.5, 0, 360, 'F');

        $pdf->SetFont('helvetica', 'B', 10);
        $nomeLine = "{$signatario['nome']} (CPF {$signatario['cpf_mascarado']}) em {$signatario['assinado_em']}";
        $pdf->SetXY(28, $pdf->GetY());
        $pdf->MultiCell(162, 5, $nomeLine, 0, 'L');

        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetX(28);
        $pdf->Cell(162, 5, "Papel: {$signatario['papel']}", 0, 1);

        $pdf->SetX(28);
        $pdf->SetFont('helvetica', '', 8);
        $cadeia = "Emitido por: {$signatario['cadeia']}";
        if ($signatario['icp_brasil']) {
            $cadeia .= ' (Assinatura ICP-Brasil)';
        }
        $pdf->MultiCell(162, 4, $cadeia, 0, 'L');
    }

    private function renderFooter(Fpdi $pdf, string $urlVerificacao): void
    {
        $pdf->Ln(10);
        $pdf->SetFont('helvetica', '', 9);
        $pdf->MultiCell(
            170,
            5,
            'Para verificar a validade das assinaturas, acesse a Central de Verificação por meio do link:',
            0,
            'C',
        );
        $pdf->Ln(2);
        $pdf->SetFont('helvetica', 'U', 9);
        $pdf->SetTextColor(0, 0, 200);
        $pdf->Cell(170, 5, $urlVerificacao, 0, 1, 'C', false, $urlVerificacao);
        $pdf->SetTextColor(0, 0, 0);
    }

    /**
     * @param  array<int, array{
     *     nome: string,
     *     cpf_mascarado?: string,
     *     papel?: string,
     *     assinado_em?: string,
     *     cadeia?: string,
     *     icp_brasil?: bool
     * }>  $signatarios
     */
    private function mergePdfs(
        string $sourcePath,
        string $verificationPagePath,
        string $outputPath,
        string $codigoVerificacao,
        string $urlVerificacao,
        array $signatarios,
    ): void {
        $pdf = new Fpdi('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(0, 0, 0);
        $pdf->SetAutoPageBreak(false);

        $pageCount = $pdf->setSourceFile($sourcePath);
        for ($page = 1; $page <= $pageCount; $page++) {
            $template = $pdf->importPage($page);
            $size = $pdf->getTemplateSize($template);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($template);
            $this->renderLateralStamp(
                $pdf,
                (float) $size['width'],
                (float) $size['height'],
                $codigoVerificacao,
                $urlVerificacao,
                $signatarios,
            );
        }

        $verificationPageCount = $pdf->setSourceFile($verificationPagePath);
        for ($page = 1; $page <= $verificationPageCount; $page++) {
            $template = $pdf->importPage($page);
            $size = $pdf->getTemplateSize($template);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($template);
        }

        $pdf->Output($outputPath, 'F');
    }

    /**
     * Tarja lateral ICP-Brasil na margem direita de cada página.
     *
     * @param  array<int, array{nome: string}>  $signatarios
     */
    private function renderLateralStamp(
        Fpdi $pdf,
        float $pageWidth,
        float $pageHeight,
        string $codigoVerificacao,
        string $urlVerificacao,
        array $signatarios,
    ): void {
        $count = count($signatarios);
        $pessoasLabel = $count === 1 ? '1 pessoa' : "{$count} pessoas";
        $nomes = implode(', ', array_map(fn (array $s) => $s['nome'], $signatarios));

        $line1 = "Assinado por {$pessoasLabel}: {$nomes}";
        $line2 = "Para verificar a validade das assinaturas, acesse {$urlVerificacao} e informe o código {$codigoVerificacao}";

        $marginRight = 1.5;
        $marginBottom = 4.0;
        $topMargin = 8.0;
        $gapAboveLogo = 3.0;
        $logoW = 7.0;
        $logoH = 9.0;
        $logoX = $pageWidth - $logoW - $marginRight;
        $logoY = $pageHeight - $logoH - $marginBottom;
        $availableHeightMm = max($logoY - $topMargin - $gapAboveLogo, 30.0);

        $logoPath = $this->getIcpLogoPath();
        if ($logoPath && file_exists($logoPath)) {
            $pdf->Image($logoPath, $logoX, $logoY, $logoW, $logoH);
        }

        $stampImage = $this->createVerticalStampImage($line1, $line2, $availableHeightMm);
        if ($stampImage !== null) {
            $this->placeStampImage($pdf, $stampImage, $pageWidth, $logoY, $marginRight, $gapAboveLogo);
        } else {
            $this->renderLateralStampFallback($pdf, $pageWidth, $pageHeight, $line1, $line2, $logoY);
        }
    }

    private function rotatedTextMetrics(string $font, int $fontSize, int $angle, string $text): array
    {
        $box = imagettfbbox($fontSize, $angle, $font, $text) ?: [0, 0, 0, 0, 0, 0, 0, 0];

        return [
            'minX' => min($box[0], $box[2], $box[4], $box[6]),
            'maxX' => max($box[0], $box[2], $box[4], $box[6]),
            'minY' => min($box[1], $box[3], $box[5], $box[7]),
            'maxY' => max($box[1], $box[3], $box[5], $box[7]),
        ];
    }

    private function createVerticalStampImage(string $line1, string $line2, float $availableHeightMm): ?array
    {
        if (! function_exists('imagettftext')) {
            return null;
        }

        $font = $this->getStampFontPath();
        if ($font === null) {
            return null;
        }

        $renderDpi = 192;
        $angle = 90;
        $targetPxH = (int) round(($availableHeightMm * $renderDpi) / 25.4);
        $padding = 20;

        $fontSize = 6;
        for ($fs = 6; $fs <= 20; $fs++) {
            $m1 = $this->rotatedTextMetrics($font, $fs, $angle, $line1);
            $m2 = $this->rotatedTextMetrics($font, $fs, $angle, $line2);
            $textH = max($m1['maxY'] - $m1['minY'], $m2['maxY'] - $m2['minY']);
            if ($textH + $padding <= $targetPxH) {
                $fontSize = $fs;
            } else {
                break;
            }
        }

        $columnGap = (int) round($fontSize * 1.6);

        $m1 = $this->rotatedTextMetrics($font, $fontSize, $angle, $line1);
        $m2 = $this->rotatedTextMetrics($font, $fontSize, $angle, $line2);
        $hor1 = imagettfbbox($fontSize, 0, $font, $line1) ?: [];
        $hor2 = imagettfbbox($fontSize, 0, $font, $line2) ?: [];

        $col1W = (int) abs(($hor1[5] ?? 0) - ($hor1[1] ?? 0));
        $col2W = (int) abs(($hor2[5] ?? 0) - ($hor2[1] ?? 0));
        $col1H = (int) ($m1['maxY'] - $m1['minY']);
        $col2H = (int) ($m2['maxY'] - $m2['minY']);

        $imgW = $padding + $col1W + $columnGap + $col2W + $padding;
        $imgH = $padding + max($col1H, $col2H) + $padding;

        $image = imagecreatetruecolor($imgW, $imgH);
        if ($image === false) {
            return null;
        }

        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 255, 255, 255, 127));

        $textColor = imagecolorallocate($image, 35, 35, 35);

        $x1 = $padding - $m1['minX'];
        $x2 = $padding + $col1W + $columnGap - $m2['minX'];
        $baselineY1 = ($imgH - $padding) - $m1['maxY'];
        $baselineY2 = ($imgH - $padding) - $m2['maxY'];

        imagettftext($image, $fontSize, $angle, $x1, $baselineY1, $textColor, $font, $line1);
        imagettftext($image, $fontSize, $angle, $x2, $baselineY2, $textColor, $font, $line2);

        $path = sys_get_temp_dir().'/lst_'.bin2hex(random_bytes(6)).'.png';
        if (! imagepng($image, $path)) {
            imagedestroy($image);

            return null;
        }

        imagedestroy($image);

        return [
            'path' => $path,
            'width_px' => $imgW,
            'height_px' => $imgH,
            'dpi' => $renderDpi,
        ];
    }

    /**
     * @param  array{path: string, width_px: int, height_px: int, dpi: int}  $stampImage
     */
    private function placeStampImage(
        Fpdi $pdf,
        array $stampImage,
        float $pageWidth,
        float $logoY,
        float $marginRight,
        float $gapAboveLogo,
    ): void {
        $dpi = $stampImage['dpi'];
        $mmW = $stampImage['width_px'] * 25.4 / $dpi;
        $mmH = $stampImage['height_px'] * 25.4 / $dpi;

        $x = $pageWidth - $mmW - $marginRight;
        $y = $logoY - $mmH - $gapAboveLogo;

        $pdf->Image($stampImage['path'], $x, $y, $mmW, $mmH, 'PNG');
        @unlink($stampImage['path']);
    }

    private function renderLateralStampFallback(
        Fpdi $pdf,
        float $pageWidth,
        float $pageHeight,
        string $line1,
        string $line2,
        float $logoY,
    ): void {
        $colWidth = 9.0;
        $gap = 2.5;
        $marginRight = 1.5;
        $topY = 8.0;
        $maxH = max($logoY - $topY - 3, 30);

        $pdf->SetFont('helvetica', '', 7);
        $pdf->SetTextColor(35, 35, 35);

        $col2X = $pageWidth - $colWidth - $marginRight;
        $col1X = $col2X - $gap - $colWidth;

        $pdf->startTransaction();
        $pdf->SetXY($col1X, $topY);
        $pdf->MultiCell($colWidth, 3.0, $line1, 0, 'L');
        $h1 = $pdf->GetY() - $topY;

        $pdf->rollbackTransaction(true);

        $pdf->SetXY($col2X, $topY);
        $pdf->MultiCell($colWidth, 3.0, $line2, 0, 'L');
        $h2 = $pdf->GetY() - $topY;

        $scale = 1.0;
        $needed = max($h1, $h2);
        if ($needed > $maxH) {
            $scale = $maxH / $needed;
        }

        if ($scale < 1.0) {
            $fontSize = max(5.0, 7.0 * $scale);
            $lineHeight = 3.0 * $scale;
            $pdf->SetFont('helvetica', '', $fontSize);
        } else {
            $lineHeight = 3.0;
        }

        $pdf->SetXY($col1X, $topY);
        $pdf->MultiCell($colWidth, $lineHeight, $line1, 0, 'L');
        $pdf->SetXY($col2X, $topY);
        $pdf->MultiCell($colWidth, $lineHeight, $line2, 0, 'L');

        $pdf->SetTextColor(0, 0, 0);
    }

    private function getStampFontPath(): ?string
    {
        $candidates = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            resource_path('fonts/DejaVuSans.ttf'),
        ];

        foreach ($candidates as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    private function getIcpLogoPath(): ?string
    {
        $path = resource_path('images/icp-brasil-logo.png');

        return file_exists($path) ? $path : null;
    }
}
