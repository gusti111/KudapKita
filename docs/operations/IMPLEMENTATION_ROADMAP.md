# Implementation Roadmap — KudapKita

## Phase 0 — Foundation
- [x] React, TypeScript, Vite, Tailwind and Firebase scaffold.
- [x] Customer / owner route separation.
- [x] Owner authentication and manually provisioned role profile.
- [x] Guest checkout identity through Anonymous Authentication.

## Phase 1 — Customer storefront
- [x] Brand-first responsive home page and catalogue.
- [x] Published product query, search and category filtering.
- [x] Browser-local cart and quantity updates.
- [x] Guest checkout with pickup/delivery and customer notes.
- [x] Customer order request and own-session tracking.
- [x] WhatsApp handoff using owner public setting with environment fallback.
- [ ] Final product photos, approved copy, contact details and price data.

## Phase 2 — Owner order operations
- [x] Dashboard and owner order inbox.
- [x] Owner quote and confirmed total through callable backend.
- [x] Manual payment verification through callable backend with one payment record.
- [x] Order state machine enforced by trusted backend.
- [x] Stock deduction when paid order enters preparation.
- [ ] Secure payment-proof attachment flow (requires storage rules and operational policy).

## Phase 3 — Catalogue and stock
- [x] Private product CRUD and public projection.
- [x] HPP stays private and is not copied into public projection.
- [x] Category creation.
- [x] Finished-goods inventory balance.
- [x] Production run and stock movement history via callable backend.
- [x] Inventory adjustment via callable backend.
- [ ] Raw-material recipe, ingredient inventory and automatic HPP calculation.

## Phase 4 — Direct sales and reporting
- [x] Direct sale entry via callable backend.
- [x] Server-side price calculation and atomic stock deduction.
- [x] Separate online / direct revenue channels.
- [x] Revenue counts only verified payment records.
- [ ] Date-range reports, downloadable CSV/PDF, margin/HPP and product ranking.
- [ ] Direct-sale refund/correction workflow.

## Phase 5 — Hardening and launch
- [x] Deny-by-default Firestore Rules baseline.
- [x] Sensitive transaction writes denied from browser clients.
- [x] Callable backend with server-side owner verification and retry protection.
- [x] Empty/loading/error/success states on operational screens.
- [x] Responsive owner navigation and storefront.
- [ ] TypeScript + Vite CI pass on the final trusted-backend branch.
- [ ] Callable unit tests and Firestore Rules Emulator suite pass.
- [ ] Firebase staging smoke test and backup/restore verification.
- [ ] Cross-device UI/accessibility test.
- [ ] Owner-approved real product photos and business data.
- [ ] Owner's billing approval (Blaze) and staging sign-off.
- [ ] Production deploy and operational handover.

Status markers distinguish source implementation from successful test/deployment. A code path is not production-ready until its test and staging checks pass.
