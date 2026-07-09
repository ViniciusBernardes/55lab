<?php

namespace App\Http\Requests\Assinatura;

use Illuminate\Foundation\Http\FormRequest;

class StoreCertificadoDigitalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'apelido' => ['required', 'string', 'max:120'],
            'certificado' => ['required', 'file', 'max:10240'],
            'senha' => ['required', 'string', 'max:255'],
            'is_padrao' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'certificado.required' => 'Informe o arquivo do certificado digital (.pfx / .p12).',
            'senha.required' => 'Informe a senha do certificado.',
        ];
    }
}
