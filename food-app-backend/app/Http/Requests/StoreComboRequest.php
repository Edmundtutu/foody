<?php

namespace App\Http\Requests;

class StoreComboRequest extends ComboRequest
{
    public function rules(): array
    {
        return array_merge(
            $this->comboRules(),
            $this->nestedGroupRules()
        );
    }
}
