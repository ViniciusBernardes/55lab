<?php

namespace App\Http\Requests\Helpdesk;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHelpdeskExternalSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $system = $this->route('helpdesk_external_system');

        return [
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('helpdesk_external_systems', 'code')->ignore($system?->id),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'webhook_url' => ['sometimes', 'required', 'url', 'max:2048'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'O identificador deve usar letras minúsculas, números e hífens (ex.: sistema-cliente).',
        ];
    }
}
