# Firestore Rules Test Matrix

Use Firebase Emulator Suite or Firestore Rules Playground before deploying the rules. These are expected outcomes, not a record of already executed emulator tests.

| Actor | Action | Expected | Reason |
|---|---|---:|---|
| Signed-out visitor | Read published `publicProducts` | Allow | Public catalog projection |
| Signed-out visitor | Read unpublished `publicProducts` | Deny | Not published |
| Signed-out visitor | Read `products` | Deny | Internal product data |
| Signed-out visitor | Create `orders` | Deny | Checkout requires guest auth |
| Anonymous customer A | Create valid order with published product | Allow | Initial state must be `REQUESTED` + `UNPAID` |
| Anonymous customer A | Create order with unpublished/unknown product | Deny | Item must resolve to a published public product |
| Anonymous customer A | Create order with forged product name or displayed price | Deny | Submitted values must match public catalog snapshot |
| Anonymous customer A | Create delivery order without address | Deny | Delivery address required |
| Anonymous customer A | Create order with initial `PAID` or `PREPARING` state | Deny | Customer cannot self-approve |
| Anonymous customer A | Get own order document by exact ID | Allow | `createdByUid` matches current UID |
| Anonymous customer A | Get customer B's order document | Deny | UID mismatch |
| Anonymous customer A | List all orders | Deny | Customer cannot enumerate orders |
| Anonymous customer A | Update/delete own order | Deny | Status is owner-controlled |
| Anonymous customer | Read `payments`, `inventory`, `orderPrivate` | Deny | Owner-only operational data |
| Signed-in user without owner profile | Open owner data collections | Deny | No active owner profile |
| Owner with active profile | Read/write internal products and operations data | Allow | Owner role and active flag |
| Owner with inactive profile | Access private collections | Deny | `isActive` is false |
| Owner client | Create/update/delete `userProfiles` | Deny | Role documents are provisioned manually |

## Test before launch

- [ ] Confirm every `allow` and `deny` row with Rules Playground or Emulator.
- [ ] Test a query for public products with `where('isPublished', '==', true)`.
- [ ] Test direct document reads for same-UID and different-UID guest sessions.
- [ ] Test owner sign-in with valid, missing, and inactive profile documents.
- [ ] Test a cart containing six distinct published products to confirm rules access-call limits.
- [ ] Test requests after a product is unpublished or its display price changes.
- [ ] Check Firestore usage and Authentication anonymous-account usage during pilot.
