## Plan: Dish Image Enhancements

Vendor stakeholders keep highlighting that dish cards feel flat without imagery, vendors want to upload visuals alongside pricing, and product wants to confirm the backend already stores `images` so that the UI work is unblocked. Below drafts a concise plan for reconciling these threads into a cohesive rollout.

### Context Recap
- Vendors asked for richer dish presentation plus promos highlighting hero dishes.
- Design feedback emphasized pairing text with thumbnails to signal quality.
- Product confirmed Laravel already persists `images` arrays and exposes them over REST, but no upload helper exists yet.
- Frontend currently omits image inputs and rendering, so the feature gap is purely in the UI layer and file handling.

### Current UI State
- `food-app-frontend/src/pages/vendor/Menu.tsx` lists dishes via `Card` components showing name, category badge, description, price, and availability, but no media slot.
- The `Add/Edit Dish` dialog reuses `react-hook-form` inputs for text fields only; `DishFormData` lacks `images` and there is no preview gallery.
- Data fetching (`useDishes`, `menuService.getDishes`) already hydrates `images?: string[]`, yet the component simply ignores that property when rendering.
- No image capture/upload hooks are imported on the vendor menu; existing image utilities (`useImageCapture`) are scoped to social-post flows only.

### Backend Support
- Model: `food-app-backend/app/Models/Dish.php` includes `images` in `$fillable` and casts it to `array`, so multiple image URLs are stored.
- Validation: `app/Http/Requests/DishRequest.php` permits `images` as a nullable array, meaning create/update routes already accept lists of URLs.
- Transport: `app/Http/Resources/DishResource.php` returns the `images` payload verbatim, so frontend simply needs to consume it.
- Controller/Service: `app/Http/Controllers/Api/Dishes/DishController.php` delegates to `DishService`; no specialized upload endpoint exists, implying we must either reuse a generic media service or add one.

### Anticipated Approach

#### Backend
- Add a Laravel controller (e.g., `UploadController`) exposing `POST /api/uploads/dishes` that accepts multipart form-data, validates each file (`image|mimes:jpeg,png,webp|max:5120`), and stores them on the local `public` disk (`storage/app/public/dishes`).
- Return payload `{ data: [{ url, path, name, size }...] }`, where `url = Storage::url(path)`; ensure `php artisan storage:link` is part of infra setup.
- Dish creation/update stays JSON-based: frontend first uploads files to get URLs, then submits `images: string[]` (hero image at index 0). `DishService` just writes the array, so no schema change required now.
- Add feature tests verifying upload success/failure and that `DishResource` reflects stored URLs.

#### Frontend
- Extend `DishFormData` in `src/pages/vendor/Menu.tsx` (and types in `src/services/menuService.ts`) to include `images: string[]`.
- Create `src/services/uploadService.ts` that wraps the new backend endpoint, taking `File[]` and returning uploaded URL metadata.
- Update the add/edit Dish dialog to include an “Images” section with: drag-drop or button file picker, preview grid, hero selector (mark star → reorder array with hero first), delete/reorder controls, and validation messages.
- Enhance `Menu.tsx` dish cards to show the hero thumbnail as a background/cover (using `dish.images?.[0]`), plus fallback placeholders when absent. Consider a secondary badge for additional images (e.g., “+3 photos”).
- Optionally reuse logic in other vendor views (kitchen graph quick-add) by extracting a `DishImagesField` component.

### Risks & Open Questions
- Need decision on per-dish image limit (e.g., max 8) and allowed mime/size; backend validation must match frontend guidance.
- Whether hero image should eventually be its own column (`hero_image`) for clarity; current plan keeps ordering semantics only.
- Confirm that local-disk URLs (e.g., `/storage/dishes/...`) are acceptable in production environments; if CDN/S3 is expected later, abstract upload service accordingly.
- Determine retention/cleanup policy if images are uploaded but dish creation is canceled — we may need a cron to purge orphaned files.

_This plan captures option C (split sections) with the locked-in local disk upload service, multi-image support, and a hero thumbnail strategy._
