<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreComboGroupItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'dish_id' => ['required', 'string', 'exists:dishes,id'],
            'extra_price' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
