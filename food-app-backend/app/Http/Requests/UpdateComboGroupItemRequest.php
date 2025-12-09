<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateComboGroupItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'dish_id' => ['sometimes', 'string', 'exists:dishes,id'],
            'extra_price' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
