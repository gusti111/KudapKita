# Dapur Bunda Reference Mapping — KudapKita

This document distinguishes **what was observed in Dapur Bunda's audit/source** from **how KudapKita adapts it**. KudapKita remains a customer-facing snack ordering platform plus owner workspace; it is not a clone of the Dapur Bunda POS application.

## 1. Reference material reviewed

The supplied Dapur Bunda archive includes:
- `docs/audit/04-data-model-audit.md`
- `docs/audit/05-business-logic-audit.md`
- `docs/audit/06-security-audit.md`
- `docs/audit/07-ui-ux-audit.md`
- `docs/audit/08-mobile-desktop-audit.md`
- `docs/audit/09-qr-device-pairing-blueprint.md`
- `docs/audit/10-v2-feature-priority.md`
- `docs/audit/12-final-recommendation.md`
- `docs/FINAL_RELEASE.md` / `docs/final-audit/`
- `README.md`

The source's release status explicitly warns that passing local static/unit checks does not prove live Firebase Rules, Functions, hosting, or real-device smoke tests are deployed and working. KudapKita adopts the same release discipline.

## 2. Decisions mapped to KudapKita

| Dapur Bunda finding/principle | KudapKita adaptation | Status / boundary |
|---|---|---|
| Order item snapshot preserves transaction context | Each order keeps product ID, display name, quantity, and displayed price snapshot; owner confirms the final total | Implemented at request/quote level |
| Separate payment state from order state | `orderStatus` and `paymentStatus` remain separate; payment record is written only after owner verification | Implemented |
| State machine must reject invalid transitions | Firestore Rules constrain owner order status updates; repository validates transition before write | Implemented in source; Emulator verification still required |
| Stock movement needs before/after balances and a reference | `stockMovements` stores quantity delta, before/after quantity, type, and optional reference | Implemented for production, adjustment, direct sale, and online preparation |
| Stock deduction must be atomic and idempotent | Firestore transaction reads balance and commits inventory + movement + order status together | Atomic within app transaction; no trusted backend / strict server idempotency |
| Avoid stale/ambiguous business metrics | Reports count only verified payment records and direct transactions | Implemented as lifetime aggregate; not period-filtered |
| RBAC must be enforced by Rules, not only hidden UI | Owner route guard plus Firestore Rules check active owner profile | Implemented; role limited to owner in MVP |
| Public catalog must not expose internal HPP/recipe data | Internal `products` and public `publicProducts` are separate documents with an explicit whitelist | Implemented |
| Empty, loading, error, and success states should be consistent | Owner operation pages use shared loading, notice, panel, and empty-state patterns | Implemented in source |
| Avoid native alert/confirm for critical workflow | Shared confirmation dialog is used for product archive and payment verification | Implemented for these owner actions |
| Dashboard needs semantic metrics | Pending, active order and verified-payment figures are distinct; no invented values | Partially implemented; dashboard revenue tile still needs live summary integration |

## 3. Deliberate differences from Dapur Bunda

Dapur Bunda is an operational warung system with POS, cashier-oriented workflow, recipe/HPP calculation, raw-material stock, and device/mobile pairing concepts. KudapKita's current project needs a guest storefront and an owner-managed order flow.

Therefore this MVP does **not** implement:
- POS/cashier role or multi-role RBAC.
- Raw-material stock, recipe consumption, fractional units, supplier purchasing, or automated HPP from recipes.
- QR device pairing or restricted mobile staff sessions.
- Electron desktop packaging.
- Payment gateway, dynamic QRIS, webhook, refund engine, or upload of proof of transfer.
- A tamper-proof audit trail or trusted backend function layer.

## 4. Business safeguards carried forward

1. Requests are not revenue.
2. WhatsApp messages are not payment verification.
3. Online order stock is not deducted at request creation; it is deducted when the owner starts preparation after payment verification.
4. A shortage prevents a stock deduction transaction from committing.
5. Direct sales reduce stock and create a movement in the same transaction.
6. Production increases finished-goods stock only after the owner records completed output.
7. HPP, internal bank information, and private notes are not projected to the public storefront.
8. No claim of production-ready status until Rules, build, Firebase staging, and real-device smoke tests pass.

## 5. Release warning

The code branch is an implementation candidate, not a deployed application. Firebase project configuration, owner account, real catalog values, product photos, Rules Emulator tests, and smoke tests remain release gates. Do not deploy to a Firebase project belonging to Dapur Bunda or any other reference business.
