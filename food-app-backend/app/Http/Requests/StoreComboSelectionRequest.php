<?php

namespace App\Http\Requests;

class StoreComboSelectionRequest extends ComboCalculationRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return parent::rules();
    }
}
