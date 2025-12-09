<?php

namespace App\Http\Requests;

class UpdateComboRequest extends ComboRequest
{
    public function rules(): array
    {
        return array_merge(
            $this->comboRules(true),
            $this->nestedGroupRules()
        );
    }
}
