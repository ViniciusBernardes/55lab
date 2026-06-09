<?php

namespace App\Http\Requests\Helpdesk;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExternalTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $attachment = $this->input('attachment');

        if (! is_array($attachment)) {
            return;
        }

        $mime = $attachment['mime'] ?? null;
        if (! is_string($mime) || $mime === '') {
            return;
        }

        $normalizedMime = match (strtolower($mime)) {
            'image/jpg' => 'image/jpeg',
            'text/comma-separated-values', 'application/csv' => 'text/csv',
            default => $mime,
        };

        $attachment['mime'] = $normalizedMime;
        $this->merge(['attachment' => $attachment]);
    }

    public function rules(): array
    {
        return [
            'external_id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'type' => ['required', Rule::in(config('helpdesk.types'))],
            'priority' => ['required', Rule::in(config('helpdesk.priorities'))],
            'requester' => ['required', 'array'],
            'requester.name' => ['required', 'string', 'max:255'],
            'requester.email' => ['required', 'email', 'max:255'],
            'external_system' => ['required', 'string', 'max:100'],
            'attachment' => ['sometimes', 'nullable', 'array'],
            'attachment.filename' => ['required_with:attachment', 'string', 'max:255'],
            'attachment.mime' => [
                'required_with:attachment',
                'string',
                'max:127',
                Rule::in(config('helpdesk.attachment_allowed_mimes')),
            ],
            'attachment.size' => ['nullable', 'integer', 'min:1'],
            'attachment.content' => ['required_with:attachment', 'string'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'external_id.required' => 'O campo external_id é obrigatório.',
            'title.required' => 'O campo title é obrigatório.',
            'description.required' => 'O campo description é obrigatório.',
            'type.required' => 'O campo type é obrigatório.',
            'type.in' => 'O type deve ser: ajuda, duvida, bug, melhoria ou correcao.',
            'priority.required' => 'O campo priority é obrigatório.',
            'priority.in' => 'O priority deve ser: baixa, media, alta ou critica.',
            'requester.required' => 'O objeto requester é obrigatório.',
            'requester.name.required' => 'O campo requester.name é obrigatório.',
            'requester.email.required' => 'O campo requester.email é obrigatório.',
            'requester.email.email' => 'O campo requester.email deve ser um e-mail válido.',
            'external_system.required' => 'O campo external_system é obrigatório.',
            'attachment.mime.in' => 'Tipo de arquivo do anexo não permitido.',
            'attachment.filename.required_with' => 'O campo attachment.filename é obrigatório quando há anexo.',
            'attachment.content.required_with' => 'O campo attachment.content é obrigatório quando há anexo.',
        ];
    }

    /** @return array<string, mixed>|null */
    public function attachmentPayload(): ?array
    {
        $attachment = $this->validated('attachment');

        return is_array($attachment) ? $attachment : null;
    }

    /** @return array<string, mixed> */
    public function sanitizedPayload(): array
    {
        $payload = $this->all();

        if (isset($payload['attachment']['content'])) {
            unset($payload['attachment']['content']);
        }

        return $payload;
    }

    /** @return array<string, mixed> */
    public function ticketPayload(): array
    {
        $validated = $this->validated();

        return [
            'external_id' => $validated['external_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'priority' => $validated['priority'],
            'requester_name' => $validated['requester']['name'],
            'requester_email' => $validated['requester']['email'],
            'external_system' => $validated['external_system'],
        ];
    }
}
