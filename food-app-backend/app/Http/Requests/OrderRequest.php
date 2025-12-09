<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'restaurant_id' => 'required|exists:restaurants,id',
            'notes' => 'nullable|string',
            'delivery_address' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.type' => ['required', Rule::in(['dish', 'combo'])],
            'items.*.dish_id' => ['required_if:items.*.type,dish', 'nullable', 'exists:dishes,id'],
            'items.*.combo_selection_id' => ['required_if:items.*.type,combo', 'nullable', 'exists:combo_selections,id'],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.total_price' => 'required|integer|min:0',
            'items.*.notes' => ['nullable', 'string'],
            'items.*.options' => ['nullable', 'array'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $items = collect($this->input('items', []))->map(function ($item) {
            if (!isset($item['type'])) {
                if (!empty($item['combo_selection_id'])) {
                    $item['type'] = 'combo';
                } else {
                    $item['type'] = 'dish';
                }
            }

            return $item;
        });

        if ($items->isNotEmpty()) {
            $this->merge(['items' => $items->all()]);
        }
    }
}
