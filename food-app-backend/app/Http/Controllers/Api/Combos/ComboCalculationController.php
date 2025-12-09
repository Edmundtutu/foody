<?php

namespace App\Http\Controllers\Api\Combos;

use App\Http\Controllers\Controller;
use App\Http\Requests\ComboCalculationRequest;
use App\Models\Combo;
use App\Services\Combos\ComboPricingService;
use App\Traits\ApiResponseTrait;

class ComboCalculationController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly ComboPricingService $pricingService)
    {
    }

    public function __invoke(ComboCalculationRequest $request, Combo $combo)
    {
        $result = $this->pricingService->calculate($combo, $request->validated());

        return $this->success($result);
    }
}
