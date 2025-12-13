<?php

namespace App\Http\Controllers\Api\Combos;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComboGroupItemRequest;
use App\Http\Requests\UpdateComboGroupItemRequest;
use App\Http\Resources\ComboGroupItemResource;
use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use App\Services\Combos\ComboGroupItemService;
use App\Traits\ApiResponseTrait;

class ComboGroupItemController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly ComboGroupItemService $itemService)
    {
    }

    public function index(Combo $combo, ComboGroup $group)
    {
        $this->authorize('update', $combo);
        $this->ensureComboOwnership($combo, $group);

        $items = $this->itemService->list($group);

        return $this->success(ComboGroupItemResource::collection($items));
    }

    public function store(StoreComboGroupItemRequest $request, Combo $combo, ComboGroup $group)
    {
        $this->authorize('update', $combo);
        $this->ensureComboOwnership($combo, $group);

        $item = $this->itemService->create($group, $request->validated());

        return $this->success(new ComboGroupItemResource($item), 'Combo group item created successfully', 201);
    }

    public function storeDirect(StoreComboGroupItemRequest $request, ComboGroup $group)
    {
        $combo = $group->combo;
        $this->authorize('update', $combo);

        $item = $this->itemService->create($group, $request->validated());

        return $this->success(new ComboGroupItemResource($item), 'Combo group item created successfully', 201);
    }

    public function update(UpdateComboGroupItemRequest $request, Combo $combo, ComboGroup $group, ComboGroupItem $item)
    {
        $this->authorize('update', $combo);
        $this->ensureComboOwnership($combo, $group);
        $this->ensureItemOwnership($group, $item);

        $item = $this->itemService->update($item, $request->validated());

        return $this->success(new ComboGroupItemResource($item), 'Combo group item updated successfully');
    }

    public function updateDirect(UpdateComboGroupItemRequest $request, ComboGroupItem $item)
    {
        $group = $item->comboGroup;
        $combo = $group->combo;
        $this->authorize('update', $combo);

        $item = $this->itemService->update($item, $request->validated());

        return $this->success(new ComboGroupItemResource($item), 'Combo group item updated successfully');
    }

    public function destroy(Combo $combo, ComboGroup $group, ComboGroupItem $item)
    {
        $this->authorize('update', $combo);
        $this->ensureComboOwnership($combo, $group);
        $this->ensureItemOwnership($group, $item);

        $this->itemService->delete($item);

        return $this->success(null, 'Combo group item deleted successfully');
    }

    public function destroyDirect(ComboGroupItem $item)
    {
        $group = $item->comboGroup;
        $combo = $group->combo;
        $this->authorize('update', $combo);

        $this->itemService->delete($item);

        return $this->success(null, 'Combo group item deleted successfully');
    }

    protected function ensureComboOwnership(Combo $combo, ComboGroup $group): void
    {
        if ($group->combo_id !== $combo->id) {
            abort(404);
        }
    }

    protected function ensureItemOwnership(ComboGroup $group, ComboGroupItem $item): void
    {
        if ($item->combo_group_id !== $group->id) {
            abort(404);
        }
    }
}
