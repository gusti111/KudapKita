# KudapKita — Release Checklist

## Business data
- [ ] Owner confirms product names, categories, sale units, selling prices, and HPP.
- [ ] Owner confirms per-day production capacity and which products are ready-stock vs pre-order.
- [ ] Owner confirms pickup address, delivery area/fee, WhatsApp number, Instagram handle, and bank account details.
- [ ] Real photos replace placeholders. Confirm owner permission for all images.
- [ ] Demo catalog is disabled in production.

## Firebase
- [ ] Verify the exact Firebase project ID before deploying.
- [ ] Enable Email/Password and Anonymous Authentication.
- [ ] Create owner auth account and active `userProfiles/{uid}`.
- [ ] Back up any existing Firestore data.
- [ ] Run all cases in `FIRESTORE_RULES_TEST_MATRIX.md` in Emulator/staging.
- [ ] Check public projection does not leak HPP, account details, or private notes.
- [ ] Deploy `firestore.rules` and `firestore.indexes.json` only after Rules tests pass.
- [ ] Test product list query, order query, payment summary query, stock movements, and production run query.

## Application QA
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Test storefront at 320, 393, 768, 1024, and 1440 CSS px.
- [ ] Test screen reader names, keyboard focus, form labels, empty/loading/error states.
- [ ] Test guest checkout in a separate browser profile from owner login.
- [ ] Test failed checkout retry and order tracking after refresh.
- [ ] Test insufficient stock stops preparation without partial deduction.
- [ ] Test production + stock increase in one transaction.
- [ ] Test direct sale + stock decrease + movement in one transaction.
- [ ] Test pickup and delivery lifecycle separately.
- [ ] Confirm WhatsApp link and message use the configured business number.
- [ ] Confirm that only verified payments contribute to reports.

## Operations and handover
- [ ] Agree who can access the owner account; use a strong unique password and MFA where available.
- [ ] Record manual payment verification procedure.
- [ ] Record manual process for transaction correction/refund.
- [ ] Establish data export/backup cadence.
- [ ] Train owner on category, product, price, HPP, production, stock, order, and direct-sale workflows.
- [ ] Save a release tag and commit SHA.
- [ ] Perform staging smoke test and owner sign-off before public launch.

## Known MVP exclusions
- Automatic payment gateway or webhook.
- Secure proof-of-payment upload.
- Cloud Functions / trusted server validation and rate limiting.
- Ingredient recipe inventory and automatic HPP calculation.
- Multi-role cashier/warehouse accounts.
- Date-range and profit/margin reporting.
- Direct sale refund/cancellation workflow.
