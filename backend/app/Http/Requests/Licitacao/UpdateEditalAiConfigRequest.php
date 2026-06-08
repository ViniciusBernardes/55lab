<?php

namespace App\Http\Requests\Licitacao;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEditalAiConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enabled' => ['sometimes', 'boolean'],
            'provider' => ['sometimes', Rule::in(['mock', 'openai'])],
            'model' => ['nullable', 'string', 'max:100'],
            'system_prompt' => ['nullable', 'string'],
            'extraction_schema' => ['nullable', 'array'],
            'extraction_schema.fields' => ['nullable', 'array'],
            'extraction_schema.fields.*.key' => ['required_with:extraction_schema.fields', 'string', 'max:100'],
            'extraction_schema.fields.*.label' => ['nullable', 'string', 'max:255'],
            'extraction_schema.fields.*.required' => ['nullable', 'boolean'],
            'require_review' => ['sometimes', 'boolean'],
            'auto_analyze_on_upload' => ['sometimes', 'boolean'],
        ];
    }
}
