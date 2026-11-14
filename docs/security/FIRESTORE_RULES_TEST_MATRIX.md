# Firestore Rules Test Matrix — Release Gate

This table describes expected behavior. It is not proof that Firebase Emulator tests have run. Every case must be verified against a staging Firebase project or Emulator Suite before deployment.

| Actor | Action | Expected | Reason |
|---|---|---:|---|
| Signed-out visitor | Read published `publicProducts` query with `isPublished == true` | Allow | Public catalog |
| Signed-out visitor | Read unpublished product | Deny | Unpublished |
| Signed-out visitor | Read internal `products` or HPP | Deny | Internal business data |
| Signed-out visitor | Get `publicSettings/storefront` | Allow | Public brand/contact projection |
| Signed-out visitor | Get `privateSettings/business` | Deny | Bank/address private data |
| Anonymous customer A | Create valid request from published items | Allow | Guest checkout |
| Anonymous customer A | Create request with forged name/price/product ID | Deny | Must match public projection |
| Anonymous customer A | Create request in `PAID` or `PREPARING` state | Deny | Customer cannot self-approve |
| Anonymous customer A | Get own order | Allow | Exact UID ownership |
| Anonymous customer A | Get customer B order | Deny | UID mismatch |
| Anonymous customer A | List orders, update own order, delete own order | Deny | No enumeration or client transition |
| Owner without active profile | Read/write owner data | Deny | Profile/role guard |
| Owner with active profile | Read/write product and category records | Allow | Owner-only CRUD |
| Owner with active profile | Publish product with public projection | Allow | Owner controls catalog |
| Owner with active profile | Update order REQUESTED → WAITING_PAYMENT with positive integer total | Allow | Quote transition |
| Owner with active profile | Update order REQUESTED → PAID or COMPLETED | Deny | Invalid state transition |
| Owner with active profile | Mark payment WAITING_PAYMENT/UNPAID → PAID with method + server timestamps | Allow | Manual verification |
| Owner with active profile | Mark payment PAID before quote exists | Deny | Quote required |
| Owner with active profile | Move paid order WAITING_PAYMENT → PREPARING | Allow | Valid transition |
| Owner with active profile | Move unpaid order to PREPARING | Deny | Payment not verified |
| Owner with active profile | Move PREPARING pickup order → READY_FOR_PICKUP | Allow | Fulfillment transition |
| Owner with active profile | Move PREPARING pickup order → OUT_FOR_DELIVERY | Deny | Mismatched fulfillment |
| Owner with active profile | Change COMPLETED order | Deny | Terminal state |
| Owner with active profile | Create production run with positive quantity | Allow | Production history |
| Owner with active profile | Update/delete stock movement or production run | Deny | Append-only history |
| Owner with active profile | Create direct sale with valid positive total/payment status | Allow | Direct sale record |
| Owner with active profile | Update/delete direct sale or payment record | Deny | Transaction history |
| Owner client | Create/update/delete userProfiles role | Deny | Manual provisioning |

## Required end-to-end tests

- [ ] Test public product query and public category query against Rules.
- [ ] Test one order with one item and one order with six different items.
- [ ] Test anonymous customer A cannot read customer B's order.
- [ ] Test customer cannot update or delete an order.
- [ ] Test quote transition and invalid direct state jumps.
- [ ] Test payment verification and duplicate verification.
- [ ] Test unpaid order cannot move into PREPARING.
- [ ] Test insufficient stock prevents online order preparation and does not partially deduct stock.
- [ ] Test production run and inventory balance commit together.
- [ ] Test direct sale, stock deduction, and stock movement commit together.
- [ ] Test order completion transitions for pickup and delivery.
- [ ] Test public projection does not expose HPP, bank details, or private settings.
- [ ] Check index availability, quota, auth session behavior, and browser refresh on guest tracking.

## Release note

The Rules matrix is a test plan, not a test report. Record actual Emulator/staging results, date, project ID (non-secret), and commit SHA before marking launch-ready.
