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
