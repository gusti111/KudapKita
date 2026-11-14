# Dapur Bunda Reference Mapping — KudapKita

The uploaded archive `Dapur Bunda.zip` was reviewed as the source reference. This is a mapping of concrete principles from its audit/release documents; KudapKita is not a clone of the Dapur Bunda POS.

## Source documents inspected

- `docs/audit/04-data-model-audit.md`
- `docs/audit/05-business-logic-audit.md`
- `docs/audit/06-security-audit.md`
- `docs/release/phase1-callable-contract.md`
- `docs/release/phase1-firestore-rules-review.md`
- `docs/release/phase1-security-review.md`
- `docs/PHASE_B_FAST_SYNC_TRUSTED_BACKEND.md`
- `docs/FINAL_RELEASE.md`

## Reference findings and KudapKita decisions

| Dapur Bunda source finding/principle | KudapKita adaptation |
|---|---|
| `orders.items[]` snapshots menu identity, selling price and HPP for historical reporting (`04-data-model-audit.md`). | KudapKita snapshots product identity and quantity; owner sets confirmed total. HPP stays private and is not copied into public projection. |
| `stock_movements` records signed quantity, before/after balances, reference and reason. | `stockMovements` records signed deltas, before/after stock, operation type and reference. |
| Client-only order state transitions were marked HIGH risk because DevTools could bypass stock deduction/restoration (`05-business-logic-audit.md`). | Order transitions move to callable Functions; browser clients cannot write order records directly. |
| Dapur Bunda Phase B uses trusted Callable Functions, server-side role lookup, Firestore transactions and retry guards. | KudapKita uses Firebase Functions v2 in `asia-southeast2`, checks active owner profile server-side, and uses deterministic operation IDs plus request fingerprints. |
| The Phase 1 callable contract documents input validation, transaction and idempotency behavior per operation. | KudapKita provides an explicit callable contract in `docs/operations/CALLABLE_CONTRACT.md` and domain tests for request validation, totals and state transitions. |
| Firestore Rules use default-deny and deny sensitive direct client writes; Admin SDK callables perform trusted mutation (`phase1-firestore-rules-review.md`). | Rules deny client create/update/delete for orders, payments, inventory, stock movements, production runs and direct sales. |
| Public customer catalogue must not expose internal recipe/HPP data (`FINAL_RELEASE.md`). | Separate `publicProducts` projection from private `products`; public writes use an explicit field whitelist. |
| Dapur Bunda distinguishes local/unit tests from Emulator and production deployment proof. | CI runs domain tests and Rules Emulator tests; Firebase staging and production remain separate owner-approved steps. |

## What is intentionally not transferred

KudapKita's current business need is a public snack storefront and an owner-operated order flow. The following Dapur Bunda POS features are intentionally outside this MVP:

- Cashier/manager/warehouse RBAC and device pairing.
- Recipe-based raw-material stock consumption and fractional quantities.
- Automatic HPP from recipe ingredients, purchase records and supplier workflows.
- POS cash/change handling and QR payment reconciliation.
- Refund lifecycle, payment gateway, dynamic QRIS and external accounting integration.
- Desktop Electron packaging.

## Business constraints preserved

1. Customer checkout creates a request; it is not revenue.
2. Customer-provided product labels and prices are not trusted by the backend.
3. Payment verification is a manual owner action after reconciliation against the real bank/merchant transaction.
4. A paid online order deducts finished-goods stock only when it enters preparation.
5. Stock shortage fails the entire transaction; no partial stock deduction.
6. Production adds inventory only after completed production is recorded.
7. Direct sales calculate prices from the server product catalogue and atomically update sale + stock + movement.
8. No fabricated prices, HPP, photos, stock quantities, payment accounts or contact details.

## Release status

The mapping does not mean KudapKita has been deployed. Passing CI/Emulator tests is still distinct from testing Functions and Rules against the owner's staging Firebase project.
