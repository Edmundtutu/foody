<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DishOptionRequest extends FormRequest
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
            'dish_id' => 'required|exists:dishes,id',
            'name' => 'required|string|max:255',
            'extra_cost' => 'nullable|integer|min:0',
            'required' => 'nullable|boolean',
        ];
    }
}
