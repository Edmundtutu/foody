<?php

namespace App\Http\Controllers\Api\Combos;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComboRequest;
use App\Http\Requests\UpdateComboRequest;
use App\Http\Resources\ComboResource;
use App\Models\Combo;
use App\Services\Combos\ComboService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class ComboController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly ComboService $comboService)
    {
        $this->authorizeResource(Combo::class, 'combo', [
            'except' => ['index', 'show'],
        ]);
    }

    public function index(Request $request)
    {
        $withRelations = $request->boolean('include_relations', true);
        $combos = $this->comboService->list($withRelations);

        return $this->success(ComboResource::collection($combos));
    }

    public function store(StoreComboRequest $request)
    {
        $combo = $this->comboService->create($request->validated());

        return $this->success(new ComboResource($combo), 'Combo created successfully', 201);
    }

    public function show(Combo $combo)
    {
        $combo = $this->comboService->get($combo, true);

        return $this->success(new ComboResource($combo));
    }

    public function update(UpdateComboRequest $request, Combo $combo)
    {
        $combo = $this->comboService->update($combo, $request->validated());

        return $this->success(new ComboResource($combo), 'Combo updated successfully');
    }

    public function destroy(Combo $combo)
    {
        $this->comboService->delete($combo);

        return $this->success(null, 'Combo deleted successfully');
    }
}
