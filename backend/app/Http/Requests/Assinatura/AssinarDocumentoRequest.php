<?php

namespace App\Http\Requests\Assinatura;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AssinarDocumentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'certificado_id' => ['nullable', 'integer', 'exists:certificados_digitais,id'],
            'certificado' => ['nullable', 'file', 'max:10240'],
            'senha' => ['nullable', 'string', 'max:255'],
            'papel' => ['nullable', 'string', Rule::in(config('assinatura.papeis'))],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $hasSaved = $this->filled('certificado_id');
            $hasUpload = $this->hasFile('certificado');

            if (! $hasSaved && ! $hasUpload) {
                $validator->errors()->add('certificado', 'Selecione um certificado cadastrado ou envie um arquivo .pfx.');
            }

            if ($hasUpload && ! $this->filled('senha')) {
                $validator->errors()->add('senha', 'Informe a senha do certificado.');
            }
        });
    }
}
