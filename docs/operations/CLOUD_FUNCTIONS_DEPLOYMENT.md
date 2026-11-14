# Cloud Functions Deployment — KudapKita

## Runtime and plan

- Frontend build: Node.js 24.12+.
- Cloud Functions runtime: Node.js 22 (supported Functions runtime).
- Callable region: `asia-southeast2`.
- Firebase Cloud Functions deployment requires the Firebase project to use the Blaze pay-as-you-go plan. This repository does not enable or change billing.

## Local checks

From repository root:

```bash
npm install
npm run typecheck
npm run build
npm install --prefix functions
npm --prefix functions run check
npm --prefix functions test
npx firebase-tools emulators:exec --only firestore --project demo-kudapkita "npm --prefix functions run test:rules"
```

Use Java 11+ for Firebase Emulator Suite. CI performs the same checks with Java installed by the workflow.

## Configure a staging Firebase project

1. Create or select the KudapKita staging project. Verify the project ID carefully.
2. Confirm Blaze plan and budget/alerts with the owner before deploying Functions.
3. Enable Email/Password and Anonymous Authentication.
4. Create an owner Authentication account.
5. Provision `userProfiles/{uid}` from an administrator-controlled process:
   - `uid`: Firebase Auth UID
   - `role`: `owner`
   - `isActive`: `true`
6. Set the Web App config in `.env.local`; never commit service-account credentials or `.env.local`.
7. Login to the intended Firebase project with Firebase CLI and confirm it with `firebase use`.

## Deploy order

After Emulator tests pass:

```bash
firebase deploy --only functions
```

Run callable smoke tests in staging using guest customer, active owner, inactive owner and non-owner accounts. Inspect Functions logs and Firestore records; verify idempotent retry and stock shortage behavior.

Then deploy Rules/indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Finally build and deploy Hosting:

```bash
npm run typecheck
npm run build
firebase deploy --only hosting
```

Do not run these commands against production until the owner explicitly approves project ID, billing and operational data.
