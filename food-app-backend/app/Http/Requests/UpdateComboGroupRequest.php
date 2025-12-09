<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateComboGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'allowed_min' => ['sometimes', 'integer', 'min:0'],
            'allowed_max' => ['sometimes', 'integer', 'min:1'],
            'category_hint_ids' => ['sometimes', 'array'],
            'category_hint_ids.*' => ['string', 'exists:menu_categories,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $group = $this->route('group');

        $validator->after(function ($validator) use ($group) {
            $currentMin = $group?->allowed_min ?? 0;
            $currentMax = $group?->allowed_max ?? 0;

            $min = $this->filled('allowed_min') ? (int) $this->input('allowed_min') : (int) $currentMin;
            $max = $this->filled('allowed_max') ? (int) $this->input('allowed_max') : (int) $currentMax;

            if ($max < $min) {
                $validator->errors()->add('allowed_max', __('Allowed max must be greater than or equal to allowed min.'));
            }
        });
    }
}
