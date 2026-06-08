<?php

namespace App\Http\Requests\Licitacao;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEditalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'numero' => ['nullable', 'string', 'max:100'],
            'orgao' => ['nullable', 'string', 'max:255'],
            'modalidade' => ['nullable', 'string', 'max:100'],
            'objeto' => ['nullable', 'string'],
            'valor_estimado' => ['nullable', 'numeric', 'min:0'],
            'data_abertura' => ['nullable', 'date'],
            'data_encerramento' => ['nullable', 'date', 'after_or_equal:data_abertura'],
            'status' => ['nullable', Rule::in(['rascunho', 'publicado', 'encerrado', 'cancelado'])],
            'observacoes' => ['nullable', 'string'],
        ];
    }
}
