# KudapKita Callable Contract

All callable functions use region `asia-southeast2`, Firebase Authentication and server-side Firestore role lookup. Owner-only functions require `userProfiles/{uid}.role == 'owner'` and `isActive == true`.

| Operation | Callable | Actor | Input | Server-owned effects |
|---|---|---|---|---|
| Guest checkout | `createOnlineOrder` | Anonymous customer | `clientRequestId`, customer details, fulfillment, product IDs and quantities | Reads canonical product names/prices; creates `REQUESTED + UNPAID` order; no stock/revenue |
| Confirm order quote | `confirmOrderQuote` | Owner | `orderId`, positive integer `confirmedTotal` | Moves `REQUESTED → WAITING_PAYMENT` and saves quote actor/time |
| Verify payment | `verifyOrderPayment` | Owner | `orderId`, `BANK_TRANSFER | QRIS` | Verifies one payment and updates payment state atomically |
| Order lifecycle | `transitionOrderStatus` | Owner | `orderId`, next status | Validates transition; PREPARING deducts stock + records movement atomically |
| Production | `recordProduction` | Owner | `clientRequestId`, `productId`, quantity, note | Writes production run, inventory increase and movement |
| Stock adjustment | `adjustFinishedStock` | Owner | `clientRequestId`, `productId`, signed delta, reason | Prevents negative balance; writes stock and movement |
| Direct sale | `createDirectSale` | Owner | `clientRequestId`, product IDs/quantities, payment method, note | Reads server prices; writes sale, stock deduction and movements atomically |

## Shared guarantees

- All inputs are validated on the server. Rupiah and quantities use safe integers.
- The server does not trust customer-supplied product names or prices.
- Retryable operations derive deterministic document IDs from UID, client request ID and operation type.
- A SHA-256 fingerprint rejects the same request ID if it is reused for a different payload.
- Firestore transactions ensure all related writes commit together or not at all.
- Callable errors use Firebase `HttpsError` codes. Unknown errors return a generic internal message; client must not assume a failed request was saved.

## Explicit boundaries

- Payment confirmation is a manual reconciliation action; no gateway/webhook is configured.
- Cloud Functions deployment requires the Firebase Blaze plan. Billing approval belongs to the owner.
- Functions and Rules must be tested in Emulator and staging before production.
