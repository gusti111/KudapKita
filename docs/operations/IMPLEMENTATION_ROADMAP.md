# Implementation Roadmap

## Phase 0 — Project and security foundation
- Confirm Firebase project ID and environment variables.
- Enable Email/Password and Anonymous sign-in.
- Create owner profile manually.
- Deploy and test Firestore Rules.
- Validate public catalog projection.

## Phase 1 — Storefront MVP
- Final brand identity and actual product photos (static assets under `apps/web/public/images/products/` for Spark MVP).
- Product catalog, product details, category filters and search.
- Browser-local cart.
- Guest checkout and order request creation.
- WhatsApp click-to-chat with order reference.
- Guest own-order tracking.

## Phase 2 — Owner order operations
- Owner login and role guard.
- Order inbox and detail view.
- Confirm availability and final total.
- Manual payment status verification.
- Order production/fulfillment statuses.
- Customer-facing tracking projection.

## Phase 3 — Catalog and stock
- Private product CRUD and public catalog projection.
- Category CRUD.
- Finished-goods inventory.
- Stock movement history.
- Production capacity and pre-order configuration.

## Phase 4 — Offline sales and reports
- Direct sale entry.
- Separate online/offline channels.
- Revenue based on verified payments.
- Date filters and downloadable summaries.

## Phase 5 — Hardening and launch
- Rules emulator tests for each role.
- Mobile/tablet/desktop UX test.
- Firestore query/index review.
- Accessibility review.
- Error and abuse monitoring.
- Backup/export and operational handover.
- Firebase Hosting deployment.

Do not start Phase 3 or 4 by adding placeholder screens alone. Implement data model, authorization, validation, loading/empty/error states, and tests together.
