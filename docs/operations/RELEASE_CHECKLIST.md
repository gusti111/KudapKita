# KudapKita — Release Checklist

## Business data
- [ ] Owner confirms product names, categories, sale units, selling prices and HPP.
- [ ] Owner confirms per-day production capacity and which products are ready-stock vs pre-order.
- [ ] Owner confirms pickup address, delivery area/fee, WhatsApp number, Instagram handle and bank account details.
- [ ] Owner-approved product photos replace public reference photos before launch. Confirm owner permission for all images.
- [ ] Demo catalogue is disabled in production.

## Firebase project and billing
- [ ] Verify exact Firebase project ID and take a backup.
- [ ] Enable Email/Password and Anonymous Authentication.
- [ ] Enable Firebase Storage and verify the bucket is the intended KudapKita bucket.
- [ ] Create owner auth account and active `userProfiles/{uid}` through an administrator.
- [ ] Confirm the Firebase project billing plan and budget alerts.
- [ ] Cloud Functions deployment requires Blaze. Obtain explicit owner approval before upgrading/enabling billing; this repository does not activate billing.
- [ ] Never deploy to Dapur Bunda's Firebase project or another reference project.

## Test gates
- [ ] Root TypeScript check and Vite build pass on Node 24.12+.
- [ ] Functions syntax check and domain unit tests pass on Node 22.
- [ ] Firestore Rules Emulator tests pass.
- [ ] Storage Rules scenarios pass: public read only in product-images; active owner-only writes/deletes; wrong UID, inactive owner, unsupported MIME and oversized files denied.
- [ ] Callable auth tests: anonymous customer, owner, inactive owner and non-owner.
- [ ] Customer-supplied prices/names are not trusted by server.
- [ ] Repeated callable request ID + same payload is idempotent.
- [ ] Repeated callable request ID + different payload is rejected.
- [ ] Insufficient stock prevents partial deduction.
- [ ] Production, stock movement and inventory balance commit together.
- [ ] Direct sale, stock movement and inventory balance commit together.
- [ ] Paid online order stock deduction and status transition commit together.
- [ ] Verify public projection does not leak HPP, bank data or private notes.
- [ ] Resolve/accept the open npm audit findings documented in `DEPENDENCY_AUDIT_2026-11-14.md`.

## Responsive, accessibility and role-experience gates
- [ ] Test guest storefront, cart, checkout and order tracking at small-phone, large-phone, tablet portrait/landscape, laptop and desktop widths.
- [ ] Verify Owner bottom navigation and the “Lainnya” drawer on touch devices; no content is obscured by the safe-area bottom bar.
- [ ] Verify mobile menus, focus order, Escape, Tab trapping, visible focus, form labels, and 200% zoom/reflow.
- [ ] Verify `prefers-reduced-motion` disables non-essential reveal and transition effects.
- [ ] Keep Guest checkout working while Member auth is not implemented.
- [ ] Do not show Premium badges/benefits until backend subscription entitlement is implemented and tested.
- [ ] QR Owner pairing remains a release blocker until challenge expiry, one-time use, explicit Owner approval, per-device revocation, Firestore Rules and callable enforcement are tested end-to-end.

## Staging
- [ ] Deploy Functions to the intended staging Firebase project.
- [ ] Deploy Firestore Rules/indexes and Storage Rules to staging after Emulator tests pass.
- [ ] Test checkout in a separate guest browser profile.
- [ ] Test duplicate checkout/network retry and own-order tracking.
- [ ] Test owner quote, manual payment verification, preparation, pickup and delivery lifecycle.
- [ ] Test production, stock adjustment and direct sale against staging data.
- [ ] Confirm WhatsApp link/message uses owner-configured business number.
- [ ] Verify backup/export and restore procedure.

## Production and handover
- [ ] Owner explicitly approves billing and target project.
- [ ] Owner approves final content, products, prices, HPP, photos, contact and account details.
- [ ] App Check reCAPTCHA v3 configured and monitored; enforcement enabled only after valid traffic is confirmed.
- [ ] Save release tag and commit SHA.
- [ ] Perform production smoke test and owner sign-off.
- [ ] Train owner on catalogue, orders, payment verification, production, stock, direct sales and reports.

## Known MVP exclusions
- Owner QR Device Pairing (design only; not active yet).
- Member account, subscription plans, payment verification and premium entitlements (design only; not active yet).
- Automatic payment gateway, dynamic QRIS and webhook.
- Secure proof-of-payment upload (intentionally not enabled; public product-image storage must not be reused for private proof files).
- Ingredient recipe inventory and automatic HPP calculation.
- Multi-role cashier/warehouse accounts.
- Date-range and profit/margin reports.
- Refunds and direct-sale void/correction workflow.
- Rate limiting and advanced anti-abuse controls; App Check enforcement remains opt-in until configured and validated.
