# Plan: Kitchen Graph Full Implementation

**TL;DR:** Fix the Kitchen Graph/Inventory system by resolving database enum mismatch, adding authorization policies, fixing frontend service dependencies, creating API resources, and implementing proper entity management. This transforms a semi-functional prototype into a production-ready feature with proper security, type safety, and complete CRUD operations.

## Steps

1. **Fix database schema enum mismatch** - Update `inventory_nodes` migration to include `'modification'` in the `entity_type` enum, simplify to only support `['dish', 'modification', 'category']` types (remove ingredient/station from backend validation), preventing database constraint violations and keeping the graph focused on menu structure

2. **Create and implement KitchenPolicy** - Build authorization policy in `food-app-backend/app/Policies/KitchenPolicy.php` with methods (`viewGraph`, `createNode`, `updateNode`, `deleteNode`, `createEdge`, `deleteEdge`), register in `AuthServiceProvider`, and add `$this->authorize()` calls in `KitchenController.php` to prevent unauthorized users from manipulating other restaurants' kitchen graphs

3. **Create API Resources for standardized responses** - Build `InventoryNodeResource.php` and `InventoryNodeEdgeResource.php` in `food-app-backend/app/Http/Resources/` to transform raw model data into consistent API responses, then update `KitchenController.php` to return resources instead of raw models

4. **Fix frontend service dependencies** - Remove/refactor references to non-existent `modificationService`, `inventoryService`, and `addonService` in `KitchenGraphFlow.tsx`, replacing with proper calls to `kitchenService.ts` or creating placeholder services

5. **Simplify entity management to core types only** - Use the existing `dish_options` table for modifications/add-ons, remove ingredient and station node types from the UI (they add unnecessary complexity), focus the kitchen graph on visualizing dish-to-category relationships and dish-to-modification connections only, update frontend to stop trying to create new dish/modification entities and instead just create nodes that reference existing entities

6. **Add comprehensive error handling and UI polish** - Implement try-catch blocks in all mutations with user-friendly toast notifications, add optimistic updates with rollback on failure, fix UI labels (change "Menu" to "Kitchen Graph" in `Kitchen.tsx`), and ensure all loading/error states display properly

## Further Considerations

1. **Simplified Entity Management** - Kitchen graph will only handle 3 entity types: categories (menu_categories table), dishes (dishes table), and modifications (dish_options table). This covers the core menu visualization use case without the complexity of ingredient tracking or station management, which can be separate features if needed later.

2. **Testing Strategy** - No tests exist for Kitchen API endpoints. Should we add Feature tests for all CRUD operations and Policy tests for authorization? Recommend at minimum testing the authorization rules and node creation validation before production deployment.
