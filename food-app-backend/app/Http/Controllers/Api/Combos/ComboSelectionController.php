<?php

namespace App\Http\Controllers\Api\Combos;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComboSelectionRequest;
use App\Http\Resources\ComboSelectionResource;
use App\Models\Combo;
use App\Services\Combos\ComboPricingService;
use App\Services\Combos\ComboSelectionService;
use App\Traits\ApiResponseTrait;

class ComboSelectionController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly ComboPricingService $pricingService,
        private readonly ComboSelectionService $selectionService
    ) {
    }

    public function store(StoreComboSelectionRequest $request, Combo $combo)
    {
        $payload = $request->validated();
        $calculation = $this->pricingService->calculate($combo, $payload);
        $selection = $this->selectionService->createFromCalculation(
            $combo,
            $calculation,
            $request->user()?->id
        );

        return $this->success(new ComboSelectionResource($selection), 'Combo selection saved successfully', 201);
    }
}
