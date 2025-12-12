<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComboCalculationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $combo = $this->route('combo');

        return [
            'groups' => ['required', 'array', 'min:1'],
            'groups.*.group_id' => [
                'required',
                'string',
                Rule::exists('combo_groups', 'id')->where(function ($query) use ($combo) {
                    if ($combo) {
                        $query->where('combo_id', $combo->id);
                    }
                }),
            ],
            'groups.*.selected' => ['present', 'array'],
            'groups.*.selected.*.dish_id' => ['required', 'string', 'exists:dishes,id'],
            'groups.*.selected.*.option_ids' => ['sometimes', 'array'],
            'groups.*.selected.*.option_ids.*' => ['string', 'exists:dish_options,id'],
        ];
    }
}
