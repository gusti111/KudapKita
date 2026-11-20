# Third-Party Dependency Audit — 14 November 2026

## What CI currently reports

The browser application lockfile reports four high-severity package entries in the Firebase JS SDK / Firestore dependency tree:

- `firebase@13.2.0` (direct web dependency)
- `@firebase/firestore@4.19.1`
- `@firebase/firestore-compat@0.4.17`
- `@grpc/grpc-js@1.9.16`

The npm remediation suggestion is a downgrade to `firebase@9.14.0`, marked as a SemVer-major change. That downgrade is not applied: it would be a broad, unverified Firebase SDK regression and is not a safe automatic fix.

The upstream Firebase JS SDK issue [#10400](https://github.com/firebase/firebase-js-sdk/issues/10400) documents that the Firestore SDK pins its Node gRPC transport to `~1.9.0`, which resolves to `1.9.16`. The issue discussion explains that browser Firestore uses WebChannel and does not load the Node gRPC transport in a browser runtime. This narrows direct runtime exposure for the storefront, but it does **not** make the installed lockfile audit-clean.

## Separate Functions runtime

KudapKita now includes a separate Node 22 Firebase Functions runtime using `firebase-admin` and `firebase-functions`. The Functions CI audit uses `npm audit --omit=dev --prefix functions` so test-only dependencies such as `firebase` and `@firebase/rules-unit-testing` are not mistaken for production runtime dependencies. The exact production-only result is emitted by the latest GitHub Actions run and must be reviewed there.

The Functions directory is separately locked in the release ZIP. Do not add the Firebase web SDK to production Functions dependencies unless a server-side feature explicitly requires it.

## Decision and release gate

- Do not run `npm audit fix --force`.
- Do not force an out-of-range transitive dependency override without proving Firebase compatibility and testing the full emulator/staging flow.
- Keep root web-app audit findings visible in CI.
- Review the production-only Functions audit independently.
- Re-check the Firebase JS SDK issue and lockfile on dependency refresh.
- Keep the web dependency finding open until upstream resolution or a separately reviewed compatibility strategy is available.
- This does not invalidate passing TypeScript, build, domain and Rules Emulator tests, but it prevents claiming a clean dependency audit.

## Related performance notice

Route-level lazy loading reduces the initial application payload, but the main bundle remains around 901 kB minified (about 278 kB gzip). Further optimization can split Firebase initialization and vendor dependencies without changing the current functional flows.
