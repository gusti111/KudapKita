# Third-Party Dependency Audit — 14 November 2026

## CI observation

GitHub Actions on commit `76f6993cb756e63422fedfa70e3388ef256ceaf1` completed:
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm audit`: reports **4 high**, 0 critical, 0 moderate, 0 low.

The committed lockfile resolves:
- `firebase@13.2.0` (direct dependency)
- `@firebase/firestore@4.19.1`
- `@firebase/firestore-compat@0.4.17`
- `@grpc/grpc-js@1.9.16`

The audit report identifies `firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, and `@grpc/grpc-js` as affected package entries. The npm remediation suggestion is a downgrade to `firebase@9.14.0` marked as a semver-major change. That downgrade was deliberately **not** applied because it would be a large, unverified SDK change and may break the current code.

## Upstream dependency context

The Firebase JS SDK issue [#10400](https://github.com/firebase/firebase-js-sdk/issues/10400) documents that `@firebase/firestore` pins `@grpc/grpc-js` to `~1.9.0`, which resolves to `1.9.16` and prevents consumers from receiving newer fixes through normal semver resolution. The issue discussion says the Node gRPC transport is not loaded by browser-only applications (browser Firestore uses WebChannel), but npm audit still flags the installed dependency tree.

GitHub advisory [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) affects `@grpc/grpc-js` versions before `1.13.6` and `1.14.0`–`1.14.4`; patched versions are `1.13.6` and `1.14.5`. The locked `1.9.16` remains within the affected range for this advisory. The exact exploitability for this browser-only KudapKita bundle is narrower than a server using gRPC credentials, but the dependency audit cannot be represented as clean.

## Decision

- Do not use `npm audit fix --force`.
- Do not force an out-of-range npm override without proving Firebase Firestore compatibility and confirming the lockfile dependency graph.
- Keep the audit report visible in CI.
- Re-check the Firebase JS SDK issue and lockfile on each dependency refresh.
- Before introducing Node-side Firestore Admin, gRPC server functionality, Functions, or other server runtime, resolve this dependency finding with an upstream fix or an explicitly tested dependency strategy.
- Keep this item open as a dependency/security release gate. It does not invalidate the passing TypeScript and Vite build, but it does prevent claiming a clean npm audit.

## Related CI notices

The Vite build now emits route chunks, but still reports a main bundle around 907 kB minified (about 280 kB gzip). This is lower than the pre-route-splitting bundle, but remains a performance optimization candidate for later dynamic Firebase initialization / vendor splitting.
