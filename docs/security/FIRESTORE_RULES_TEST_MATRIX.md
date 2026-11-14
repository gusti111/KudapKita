# Firestore Rules Test Matrix — KudapKita

This matrix describes client permissions after the trusted-backend migration. It is a test plan until the CI Firestore Emulator job reports a passing result.

| Actor | Action | Expected | Reason |
|---|---|---:|---|
| Visitor | Read published `publicProducts` | Allow | Public catalogue |
| Visitor | Read unpublished `publicProducts` | Deny | Unpublished record |
| Visitor | Read `products` including HPP | Deny | Internal data |
| Visitor | Get `publicSettings/storefront` | Allow | Public store contact |
| Visitor | Read `privateSettings/business` | Deny | Bank/address privacy |
| Anonymous customer A | Get an order created by UID A | Allow | Own session |
| Anonymous customer A | Get an order created by UID B | Deny | Prevent IDOR |
| Anonymous customer A | List all orders | Deny | No order enumeration |
| Anonymous customer A | Create/update/delete order directly | Deny | Callable-only order writes |
| Owner without active profile | Read owner data | Deny | Owner profile guard |
| Active owner | Read/write private products and categories | Allow | Catalogue management |
| Active owner | Write safe public product/category projection | Allow | Published catalogue management |
| Active owner | Add HPP or private bank field to public projection | Deny | Data minimization |
| Active owner browser | Create/update/delete order directly | Deny | Trusted-backend only |
| Active owner browser | Create/update/delete payment directly | Deny | Trusted-backend only |
| Active owner browser | Create/update/delete inventory directly | Deny | Trusted-backend only |
| Active owner browser | Create/update/delete stock movement directly | Deny | Trusted-backend only |
| Active owner browser | Create/update/delete production run directly | Deny | Trusted-backend only |
| Active owner browser | Create/update/delete direct sale directly | Deny | Trusted-backend only |
| Active owner | Read order/payment/stock/production/sale records | Allow | Operational UI reads |
| Inactive owner | Read owner operational collections | Deny | Disabled profile |

## Callable-level tests required

Callable authorization is checked from Firebase Authentication and the server-side `userProfiles/{uid}` record. Firestore Rules tests do not replace callable tests.

- [ ] Anonymous customer can create a valid request containing active published products.
- [ ] Unauthenticated caller cannot create a request.
- [ ] Authenticated non-owner cannot call owner-only functions.
- [ ] Customer-supplied product name and price are ignored; server reads canonical product data.
- [ ] Reusing the same clientRequestId + same payload returns the original order/result.
- [ ] Reusing the same clientRequestId with a different payload returns already-exists.
- [ ] Quote only applies to REQUESTED + UNPAID order.
- [ ] Payment verification only applies to WAITING_PAYMENT + UNPAID order and creates one verified payment.
- [ ] Duplicate payment verification does not create a second revenue record.
- [ ] Unpaid order cannot move to PREPARING.
- [ ] Paid order stock deduction is all-or-nothing when entering PREPARING.
- [ ] Repeated PREPARING request does not deduct stock twice.
- [ ] Production writes inventory + production run + movement in one transaction.
- [ ] Stock adjustment validates non-negative final stock and reason.
- [ ] Direct sale recalculates prices on the server and writes sale + stock + movement atomically.
- [ ] Insufficient stock leaves every involved document unchanged.

## Release note

Do not claim Rules/Functions are production-ready merely because unit tests pass. Record the CI run, emulator output, Firebase staging project ID (non-secret), and smoke-test date before deployment.
