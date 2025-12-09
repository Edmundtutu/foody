<?php

namespace App\Http\Controllers\Api\Combos;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComboGroupRequest;
use App\Http\Requests\UpdateComboGroupRequest;
use App\Http\Resources\ComboGroupResource;
use App\Models\Combo;
use App\Models\ComboGroup;
use App\Services\Combos\ComboGroupService;
use App\Traits\ApiResponseTrait;

class ComboGroupController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly ComboGroupService $groupService)
    {
    }

    public function index(Combo $combo)
    {
        $this->authorize('update', $combo);

        $groups = $this->groupService->list($combo);

        return $this->success(ComboGroupResource::collection($groups));
    }

    public function store(StoreComboGroupRequest $request, Combo $combo)
    {
        $this->authorize('update', $combo);

        $group = $this->groupService->create($combo, $request->validated());

        return $this->success(new ComboGroupResource($group), 'Combo group created successfully', 201);
    }

    public function update(UpdateComboGroupRequest $request, Combo $combo, ComboGroup $group)
    {
        $this->authorize('update', $combo);
        $this->ensureComboOwnership($combo, $group);

        $group = $this->groupService->update($group, $request->validated());

        return $this->success(new ComboGroupResource($group), 'Combo group updated successfully');
    }

    public function destroy(Combo $combo, ComboGroup $group)
    {
        $this->authorize('update', $combo);
        $this->ensureComboOwnership($combo, $group);

        $this->groupService->delete($group);

        return $this->success(null, 'Combo group deleted successfully');
    }

    protected function ensureComboOwnership(Combo $combo, ComboGroup $group): void
    {
        if ($group->combo_id !== $combo->id) {
            abort(404);
        }
    }
}
