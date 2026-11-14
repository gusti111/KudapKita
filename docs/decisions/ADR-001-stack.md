# ADR-001 — MVP Technology Stack

- **Status:** Accepted for MVP
- **Decision:** React + TypeScript + Vite + Tailwind CSS + Firebase Spark

## Context

KudapKita needs a responsive customer storefront and a separate owner workspace in one maintainable web codebase. Initial operating cost should be minimized and the stack should provide practical Full Stack development experience.

## Decision

Use TypeScript as the primary language; React for UI; Vite for tooling/build; Tailwind CSS for responsive styling; Firebase Authentication for owner and guest sessions; Firestore as database; Firebase Hosting for deployment; Git/GitHub for version control.

## Constraints

- Do not include Cloud Functions in the Spark MVP because deployment requires Blaze.
- Do not include Firebase Storage under the selected Spark constraint; since February 3, 2026 new/default Cloud Storage access on Spark is not available according to Firebase's current Storage FAQ.
- No payment gateway in the MVP.
- Manual operational verification is required where trusted backend logic is unavailable.

## Consequences

This is a cost-conscious frontend-first architecture, not a fully trusted backend architecture. If trusted automatic price calculation, stock reservation, payment webhooks, uploaded payment evidence, or scheduled jobs become required, revisit this decision and the budget before implementation.
