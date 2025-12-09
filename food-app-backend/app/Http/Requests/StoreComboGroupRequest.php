<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreComboGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'allowed_min' => ['required', 'integer', 'min:0'],
            'allowed_max' => ['required', 'integer', 'min:1'],
            'category_hint_ids' => ['sometimes', 'array'],
            'category_hint_ids.*' => ['string', 'exists:menu_categories,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $min = (int) $this->input('allowed_min', 0);
            $max = (int) $this->input('allowed_max', 0);

            if ($max < $min) {
                $validator->errors()->add('allowed_max', __('Allowed max must be greater than or equal to allowed min.'));
            }
        });
    }
}
