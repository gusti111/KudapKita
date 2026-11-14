# Security Model and Spark MVP Boundaries

## Required configuration

1. Enable Email/Password authentication for owner.
2. Enable Anonymous authentication for guest checkout.
3. Provision the first owner in Firebase Authentication and create `userProfiles/{uid}` manually.
4. Deploy `firebase/firestore.rules` before exposing the site.
5. Test allow/deny cases with Rules Playground or Firebase Emulator Suite.

## Access matrix

| Resource | Visitor | Guest customer | Owner |
|---|---:|---:|---:|
| Published `publicProducts` | Read | Read | Read/write |
| Internal `products` | Deny | Deny | Read/write |
| `orders` create | Deny | Create own initial request | Read/write all |
| `orders` get | Deny | Read own UID only | Read/write all |
| `orders` list | Deny | Deny | Read/write all |
| `orderPrivate` | Deny | Deny | Read/write |
| `payments` | Deny | Deny | Read/write |
| `inventory` and `stockMovements` | Deny | Deny | Read/write |
| `directSales` | Deny | Deny | Read/write |
| `privateSettings` | Deny | Deny | Read/write |

## Important safeguards

- Public documents must contain only public-safe values.
- Owner role is not writable from the client.
- Customer cannot update/delete an order after submission.
- Customer cannot choose initial order/payment states other than `REQUESTED`/`UNPAID`.
- Customer order documents are tied to `createdByUid`.
- Public catalog queries must filter for `isPublished == true` (or active category) because Firestore Rules are not post-query filters.
- Never deploy permissive wildcard rules such as `allow read, write: if true`.

## What Spark MVP does not provide

- No trusted server function for price calculation or stock transactions.
- No secure file upload through Firebase Storage under the chosen no-cost plan constraint.
- No payment gateway or webhook.
- No scheduled cancellation/expiry automation.
- No robust anti-spam rate limiter for guest order creation.
- No tamper-proof audit log: owner-side browser writes can be edited by an owner. It is an operational log, not a compliance ledger.

Owner must manually validate order line items, price, product availability, delivery charge, and payment receipt through the actual bank/merchant channel. The rules validate each requested product against its published public catalog document; the owner still confirms the final total. Consider a trusted backend and billing review before adding automatic payments, inventory reservation, or user-uploaded files.
