<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class ComboRequest extends FormRequest
{
    /**
     * Base authorization for combo management. Controllers may add policies.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('pricing_mode')) {
            $this->merge([
                'pricing_mode' => strtoupper((string) $this->input('pricing_mode')),
            ]);
        }
    }

    /**
     * Validation rules shared by store/update subclasses.
     */
    protected function comboRules(bool $isUpdate = false): array
    {
        $presence = $isUpdate ? 'sometimes' : 'required';

        return [
            'restaurant_id' => [$presence, 'exists:restaurants,id'],
            'name' => [$presence, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'pricing_mode' => [$presence, Rule::in(['FIXED', 'DYNAMIC', 'HYBRID'])],
            'base_price' => [$presence, 'integer', 'min:0'],
            'available' => ['sometimes', 'boolean'],
            'tags' => ['sometimes', 'nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:50'],
            'images' => ['sometimes', 'nullable', 'array', 'max:8'],
            'images.*' => ['string', 'url', 'max:500'],
        ];
    }

    /**
     * Nested group/items validation fragments shared by subclasses.
     */
    protected function nestedGroupRules(): array
    {
        return [
            'groups' => ['sometimes', 'array'],
            'groups.*.id' => ['sometimes', 'string', 'exists:combo_groups,id'],
            'groups.*.name' => ['required_with:groups', 'string', 'max:255'],
            'groups.*.allowed_min' => ['required_with:groups', 'integer', 'min:0'],
            'groups.*.allowed_max' => ['required_with:groups', 'integer', 'min:1'],
            'groups.*.category_hint_ids' => ['sometimes', 'array'],
            'groups.*.category_hint_ids.*' => ['string', 'exists:menu_categories,id'],
            'groups.*.items' => ['sometimes', 'array'],
            'groups.*.items.*.id' => ['sometimes', 'string', 'exists:combo_group_items,id'],
            'groups.*.items.*.dish_id' => ['required_with:groups.*.items', 'string', 'exists:dishes,id'],
            'groups.*.items.*.extra_price' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $groups = $this->input('groups', []);

            foreach ($groups as $index => $group) {
                if (
                    isset($group['allowed_min'], $group['allowed_max']) &&
                    (int) $group['allowed_max'] < (int) $group['allowed_min']
                ) {
                    $validator->errors()->add(
                        "groups.$index.allowed_max",
                        __('The maximum selection must be greater than or equal to the minimum for this group.')
                    );
                }
            }
        });
    }
}
