# Storage Rules Test Matrix — KudapKita

Run these checks against Firebase Storage Emulator or an isolated staging project before public launch.

| Actor / request | Expected result | Reason |
|---|---|---|
| Unauthenticated visitor reads `/product-images/{ownerUid}/{file}` | Allow | Published product photos are public assets |
| Anonymous customer uploads a product image | Deny | Customer is not an owner |
| Owner with `role: owner`, `isActive: true` uploads under own UID folder | Allow when size/type valid | Active owner may manage public catalogue photos |
| Active owner uploads under another UID folder | Deny | Folder is bound to authenticated owner UID |
| Owner with `isActive: false` uploads or deletes | Deny | Inactive profile loses owner access |
| Signed-in non-owner uploads or deletes | Deny | Role check is server-side through Firestore profile |
| File size is 0 bytes or greater than 5 MB | Deny | Size validation |
| Content type is SVG, HTML, PDF, or another unsupported MIME | Deny | Only `image/jpeg`, `image/png`, and `image/webp` are allowed |
| Visitor or customer deletes a product image | Deny | Deletion is owner-only |
| Upload to any path outside `product-images/{ownerUid}/{fileName}` | Deny | Default-deny rule |
| Attempt to upload payment proof into `product-images` | Deny unless it is a valid public image from active owner | This directory is not for private payment evidence |

## Release notes

- Storage reads under `product-images` are public by design. Never store payment evidence, customer documents, private invoices, or account information there.
- The application validates file type and size before upload; Firebase Storage Rules independently enforce both conditions.
- The Firebase project must have the correct Storage bucket configured in `VITE_FIREBASE_STORAGE_BUCKET`.
