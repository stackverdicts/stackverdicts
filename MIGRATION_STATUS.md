# Products Migration Status

## ✅ COMPLETED:

### 1. Database
- ✅ Created `products` table with all fields
- ✅ Added `product_id` and `product_name` columns to `landing_pages`
- ✅ Dropped `site_offers` table (no longer needed for single-site)
- ✅ Added proper indexes for performance

### 2. Backend
- ✅ Created `/backend/src/routes/products.ts` with full CRUD operations
- ✅ Added Product interface to `/backend/src/models/types.ts`
- ✅ Registered products route in `/backend/src/index.ts`
- ✅ API endpoint available at `/api/products`

### 3. Documentation
- ✅ Updated README.md to reflect new YouTube + dev tools strategy
- ✅ Removed all MaxBounty references
- ✅ Updated branding to StackVerdicts

---

## ⏳ REMAINING WORK:

### 1. Create Products Management Page
**File:** `/frontend/app/dashboard/products/page.tsx`

**What it needs:**
- List all products with filtering by category
- Add new product form
- Edit/delete existing products
- Show commission info and affiliate links

**Template to use:** Copy structure from `/frontend/app/dashboard/networks/page.tsx`

Replace `network` with `product` and add these categories:
- hosting
- saas
- developer_tools
- courses

---

### 2. Update Pages That Reference "Offers"

#### A) `/frontend/app/dashboard/bulk-operations/page.tsx`
**Changes needed:**
- Line 8: Change `interface Offer` to `interface Product`
- Line 28: Change `offers` to `products`
- Line 46: Change API call from `/api/offers` to `/api/products`
- Line 84: Change `offerIds` to `productIds` in request body
- Line 119: Change `offerIds` to `productIds` in request body
- Line 328: Change heading "Select Offers" to "Select Products"
- Lines 350-370: Update variable names from `offer` to `product`

#### B) `/frontend/app/dashboard/email/page.tsx`
**Changes needed:**
- Line 62: Change `interface Offer` to `interface Product`
- Line 76: Change `offers` to `products`
- Line 136: Change API call from `/api/offers` to `/api/products`
- Line 157: Change `offerName` to `productName`
- Line 444: Change label "Select Offer" to "Select Product"
- Lines 453-456: Update variable names

#### C) `/frontend/app/dashboard/landing-pages/page.tsx`
**Changes needed:**
- Line 10: Change `offer_id` to `product_id`
- Line 11: Change `offer_name` to `product_name`
- Line 23: Change `interface Offer` to `interface Product`
- Line 35: Change `offers` to `products`
- Line 74: Change API call from `/api/offers` to `/api/products`
- Line 84: Change alert text
- Line 94: Change `offerId` to `productId`
- Line 203: Change description text
- Line 374: Change label "Select Offer" to "Select Product"
- Lines 383-386: Update variable names

#### D) `/frontend/app/dashboard/content/page.tsx`
**Changes needed:**
- Line 18: Change `offer_id` to `product_id`
- Line 19: Change `offer_name` to `product_name`
- Line 74: Change `offer_name` to `product_name`

---

### 3. Update Backend Routes

#### A) `/backend/src/routes/landing-pages.ts`
**Changes needed:**
- Lines 15, 38: Change `offerId` to `productId`
- Line 79: Update JOIN from `offers o` to `products p`
- Update all `o.` references to `p.`
- Change `payout` and `vertical` to `commission_value` and `category`

#### B) `/backend/src/routes/bulk-operations.ts`
**Changes needed:**
- Lines 13, 47: Change `offerIds` to `productIds`
- Update service calls to use `productIds`

---

### 4. Remove Sites Functionality

#### Delete these files:
```bash
rm -rf /Users/dan.green/PhpstormProjects/automated-affiliate-hub/frontend/app/dashboard/sites
rm /Users/dan.green/PhpstormProjects/automated-affiliate-hub/backend/src/routes/sites.ts
```

#### Update `/backend/src/index.ts`:
- Remove `import sitesRouter from './routes/sites';`
- Remove `app.use('/api/sites', sitesRouter);`
- Remove `sites: '/api/sites'` from endpoints

---

### 5. Update Dashboard Navigation

#### `/frontend/app/dashboard/page.tsx`
**Add Products card** in Operations & Settings section (around line 100):
```tsx
<Link href="/dashboard/products" className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition-all shadow-md hover:shadow-lg">
  <div className="text-3xl mb-2">🛠️</div>
  <div className="font-semibold text-lg">Products</div>
  <p className="text-sm text-purple-100 mt-1">Manage dev tools & hosting</p>
</Link>
```

**Remove Sites card** (line 96-100) - delete it entirely

---

## 🧪 TESTING CHECKLIST:

1. ☐ Visit `/dashboard/products` and add a test product
2. ☐ Go to `/dashboard/bulk-operations` and select the product
3. ☐ Go to `/dashboard/landing-pages` and generate a page for the product
4. ☐ Go to `/dashboard/email` and create a sequence for the product
5. ☐ Verify all pages load without errors
6. ☐ Check that "Sites" is removed from dashboard

---

## 📝 QUICK FIX SCRIPT:

You can do the bulk find-replace with:

```bash
# In frontend/app/dashboard directory
cd /Users/dan.green/PhpstormProjects/automated-affiliate-hub/frontend/app/dashboard

# These files need offer->product replacement:
# - bulk-operations/page.tsx
# - email/page.tsx
# - landing-pages/page.tsx
# - content/page.tsx
```

---

## ✨ WHAT'S WORKING NOW:

- ✅ Backend API at http://localhost:3001/api/products
- ✅ Database table `products` ready to use
- ✅ TypeScript types defined
- ✅ All old MaxBounty code removed
- ✅ Clean StackVerdicts branding

You just need to create the products management UI and update the 4 pages to use `/api/products` instead of `/api/offers`!
