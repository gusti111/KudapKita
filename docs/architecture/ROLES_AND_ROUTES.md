# Roles, Authentication and Route Boundaries

## User classes

### Visitor
- No login needed.
- Can read only published public categories and products.
- Can search/filter and maintain a local cart.
- Cannot access owner routes or private Firestore collections.

### Customer (guest checkout)
- No public registration form and no password.
- Firebase Anonymous Authentication is activated when the customer submits checkout.
- Each order stores `createdByUid` matching that guest UID.
- The customer can read only their own order document while the anonymous session remains available in that browser.
- If browser site data is cleared or the customer changes device, guest tracking may no longer resolve. Contact owner with the order reference in that case.

### Owner
- Email/password sign-in.
- No owner sign-up route.
- Must have `userProfiles/{uid}` with `role: "owner"` and `isActive: true`.
- Profile is provisioned manually through Firebase Console in the Spark MVP.
- Can use owner workspace and owner-only collections.

## Routes

| Route | Surface | Access |
|---|---|---|
| `/` | Storefront home | Public |
| `/menu` | Catalog | Public |
| `/keranjang` | Cart | Public/browser-local |
| `/checkout` | Checkout | Public UI; guest auth required to submit |
| `/pesanan/:orderId` | Order tracking | Matching guest UID or owner |
| `/owner/login` | Owner sign-in | Public login page |
| `/owner` | Dashboard | Owner only |
| `/owner/pesanan` | Order management | Owner only |
| `/owner/produk` | Product management | Owner only |
| `/owner/kategori` | Category management | Owner only |
| `/owner/produksi` | Production | Owner only |
| `/owner/persediaan` | Inventory | Owner only |
| `/owner/penjualan-langsung` | Direct sales | Owner only |
| `/owner/laporan` | Reports | Owner only |
| `/owner/pengaturan` | Settings | Owner only |

## Important security distinction

React route guards prevent accidental navigation and provide a suitable user experience. They do **not** secure Firestore. Firestore Rules are the actual authorization boundary and must deny all access by default.
