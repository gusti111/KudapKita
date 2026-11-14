# Security Model — KudapKita

## Authentication and roles

- Visitor: public catalogue reads only.
- Customer: Firebase Anonymous Authentication for guest checkout; can read only an order whose `createdByUid` matches the current UID.
- Owner: Email/Password Authentication plus an active server-side `userProfiles/{uid}` document with `role: owner` and `isActive: true`.
- Owner profiles are provisioned administratively. A browser client cannot grant itself the owner role.
- Cashier/manager/warehouse roles are outside this MVP. Do not infer them from the Dapur Bunda reference roles.

## Trusted transaction boundary

All operations that create or change business transactions and stock are callable Cloud Functions v2 in `functions/src/index.js`, region `asia-southeast2`:

- `createOnlineOrder`: guest creates a request; server reloads product identity and display price from Firestore; no stock deduction or revenue is created at request time.
- `confirmOrderQuote`: owner sets the confirmed amount for a REQUESTED, UNPAID order.
- `verifyOrderPayment`: owner marks a payment verified after checking the real bank/merchant transaction; payment record and order payment state update atomically.
- `transitionOrderStatus`: server validates the lifecycle; entering PREPARING deducts finished-goods stock and writes movements in the same transaction.
- `recordProduction`: writes a completed production run, inventory increase and movement atomically.
- `adjustFinishedStock`: validates a stock adjustment and reason; writes balance and movement atomically.
- `createDirectSale`: recalculates product prices on the server and writes direct sale, inventory deduction and movement atomically.

Frontend uses Firebase Callable Functions through `apps/web/src/infrastructure/firebase/functions.ts`. There is no fallback to direct browser writes if a callable is unavailable.

## Firestore Rules

- Default-deny for collections not explicitly matched.
- Public product and category documents use a whitelisted public projection. HPP does not appear in public data.
- Public store settings expose store name, tagline, WhatsApp, and Instagram only.
- Private bank details and pickup address live in `privateSettings/business`.
- Client reads for orders are limited to owner or the order's own anonymous UID.
- Client order/payment/inventory/stock movement/production/direct sale create-update-delete operations are denied. Admin SDK in callable Functions performs trusted writes.
- Product/category editing remains owner-only client CRUD because it is catalogue configuration, not financial transaction processing.
- Owner route guards improve UX but do not replace callable authorization or Firestore Rules.

## Idempotency and integrity

Each callable transaction operation validates input server-side. For retryable actions, the client supplies a random `clientRequestId`; the backend derives a deterministic document ID scoped by UID and operation type. The backend also stores a SHA-256 request fingerprint. Reusing a key for a different payload is rejected rather than silently returning an unrelated previous result.

Order status and payment status remain separate. A payment confirmation is a manual business action; WhatsApp messages or screenshots are not automatically treated as proof of payment. No payment gateway or webhook is integrated.

## Data and operational boundaries

- Finished-goods stock only; no ingredient recipes, fractional ingredient consumption, supplier purchasing or automated HPP calculation.
- Reports currently aggregate verified online payments and direct sales; date-range reporting, refunds and accounting exports are not included.
- No secure proof-of-payment file upload; Firebase Storage has not been configured.
- No App Check enforcement, rate limiting, automated abuse controls or tamper-proof audit log yet.
- No multi-role staff access.
- Guest order tracking is tied to the anonymous browser session; it is not a cross-device customer account system.

## Deployment prerequisites

1. Verify Firebase project ID and take a backup.
2. Enable Email/Password Authentication and Anonymous Authentication.
3. Provision an owner profile administratively.
4. Confirm the Firebase project is on Blaze before deploying Cloud Functions. Do not enable or upgrade billing without the owner's explicit approval.
5. Run domain/unit tests and Firestore Rules Emulator tests.
6. Deploy Functions to a non-production/staging project first.
7. Run callable smoke tests as anonymous customer, active owner, inactive owner and non-owner.
8. Deploy Firestore Rules and indexes, then Hosting only after the staging checks pass.
9. Enable and monitor Firebase App Check before broader public promotion.
