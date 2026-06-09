<?php

namespace App\Services\Helpdesk;

use App\Models\Helpdesk\Ticket;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class TicketAttachmentService
{
    /** @param  array<string, mixed>  $attachment */
    public function storeFromPayload(Ticket $ticket, array $attachment): Ticket
    {
        $filename = $this->sanitizeFilename((string) ($attachment['filename'] ?? ''));
        $mime = (string) ($attachment['mime'] ?? '');
        $content = $this->decodeBase64((string) ($attachment['content'] ?? ''));

        $this->validateMime($mime);
        $this->validateSize(strlen($content), isset($attachment['size']) ? (int) $attachment['size'] : null);

        $path = sprintf(
            'helpdesk/tickets/%d/%s_%s',
            $ticket->id,
            Str::uuid(),
            $filename,
        );

        Storage::disk('local')->put($path, $content);

        $ticket->update([
            'attachment_path' => $path,
            'attachment_filename' => $filename,
            'attachment_mime' => $mime,
            'attachment_size' => strlen($content),
        ]);

        return $ticket->fresh();
    }

    public function deleteForTicket(Ticket $ticket): void
    {
        if (filled($ticket->attachment_path)) {
            Storage::disk('local')->delete($ticket->attachment_path);
        }
    }

    /** @param  array<string, mixed>  $payload */
    public function sanitizePayloadForStorage(array $payload): array
    {
        if (! isset($payload['attachment']) || ! is_array($payload['attachment'])) {
            return $payload;
        }

        $attachment = $payload['attachment'];
        unset($attachment['content']);
        $payload['attachment'] = $attachment;

        return $payload;
    }

    private function decodeBase64(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            throw new InvalidArgumentException('Conteúdo do anexo é obrigatório.');
        }

        if (str_contains($value, ',')) {
            $value = explode(',', $value, 2)[1];
        }

        $decoded = base64_decode($value, true);

        if ($decoded === false) {
            throw new InvalidArgumentException('Conteúdo do anexo inválido (base64).');
        }

        return $decoded;
    }

    private function sanitizeFilename(string $filename): string
    {
        $filename = trim($filename);
        $filename = basename(str_replace('\\', '/', $filename));

        if ($filename === '' || $filename === '.' || $filename === '..') {
            throw new InvalidArgumentException('Nome do arquivo do anexo é inválido.');
        }

        return Str::limit($filename, 255, '');
    }

    private function validateMime(string $mime): void
    {
        $allowed = config('helpdesk.attachment_allowed_mimes', []);

        if (! in_array($mime, $allowed, true)) {
            throw new InvalidArgumentException('Tipo de arquivo do anexo não permitido.');
        }
    }

    private function validateSize(int $actualSize, ?int $declaredSize): void
    {
        $max = (int) config('helpdesk.attachment_max_bytes', 10 * 1024 * 1024);

        if ($actualSize <= 0) {
            throw new InvalidArgumentException('Arquivo do anexo está vazio.');
        }

        if ($actualSize > $max) {
            throw new InvalidArgumentException('Arquivo do anexo excede o tamanho máximo permitido.');
        }

        if ($declaredSize !== null && $declaredSize > 0 && abs($declaredSize - $actualSize) > 1024) {
            throw new InvalidArgumentException('Tamanho informado do anexo não confere com o conteúdo.');
        }
    }
}
