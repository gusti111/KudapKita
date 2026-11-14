# Implementation Roadmap — KudapKita

## Phase 0 — Foundation
- [x] React, TypeScript, Vite, Tailwind and Firebase scaffold.
- [x] Customer / owner route separation.
- [x] Owner authentication and manually provisioned role profile.
- [x] Guest checkout identity through Anonymous Authentication.
- [ ] Firebase staging project setup and rules deployment test.

## Phase 1 — Customer storefront
- [x] Brand-first responsive home page and catalog route.
- [x] Published product query, search, category filtering.
- [x] Browser-local cart and quantity updates.
- [x] Guest checkout with pickup/delivery and customer notes.
- [x] Customer order request and own-session tracking.
- [x] WhatsApp handoff using owner public setting with environment fallback.
- [ ] Final product photos, approved copy, contact details, and price data.

## Phase 2 — Owner order operations
- [x] Dashboard and owner order inbox.
- [x] Owner quote and confirmed total.
- [x] Manual payment verification with append-only payment record.
- [x] Order state machine and status badges.
- [x] Stock deduction when paid order enters preparation.
- [ ] Proof attachment flow (requires secure file storage/backend; out of Spark MVP scope).

## Phase 3 — Catalog and stock
- [x] Private product CRUD and public projection.
- [x] HPP stays private and is not copied into public projection.
- [x] Category creation.
- [x] Finished-goods inventory balance.
- [x] Production run and stock movement history.
- [x] Inventory adjustment with required reason.
- [ ] Raw-material recipe, ingredient inventory, and automatic HPP calculation.

## Phase 4 — Direct sales and reporting
- [x] Direct sale entry.
- [x] Stock deduction and movement in same Firestore transaction.
- [x] Separate online / direct revenue channels.
- [x] Revenue counts only verified payment records.
- [ ] Date-range reports, downloadable CSV/PDF, margin/HPP and product ranking.

## Phase 5 — Hardening and launch
- [x] Deny-by-default Firestore Rules baseline.
- [x] Order transition restrictions and append-only payment/stock/production/direct-sale records.
- [x] Empty, loading, error, and success states on operational screens.
- [x] Responsive owner navigation and storefront.
- [ ] TypeScript CI pass on development pull request.
- [ ] Firebase Rules Emulator suite and query-index verification.
- [ ] Cross-device UI/accessibility test (keyboard, contrast, mobile viewport).
- [ ] Firebase staging smoke test and backup/restore verification.
- [ ] Real product photos and owner-approved business data.
- [ ] Final sign-off and production deploy.

Status markers reflect code included in the branch, not successful deployment or production verification.
