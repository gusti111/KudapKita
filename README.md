<div align="center">

<img src="apps/web/public/brand/kudapkita-mark.svg" width="72" height="72" alt="KudapKita brand mark" />

# KUDAPKITA

**Jajan Enak, Dekat, dan Praktis.**

A digital storefront and owner workspace concept for a family-run Indonesian snack business.

<p>
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=222" alt="Firebase Authentication and Firestore" />
  <img src="https://img.shields.io/badge/Status-MVP%20Development-D97706" alt="MVP development" />
</p>

</div>

---

## Product overview

KudapKita brings a customer-facing snack storefront and a private owner workspace into one React application.

The customer journey focuses on discovering products, building a cart, submitting an order request, and contacting the store for confirmation. The owner workspace supports reviewing requests, confirming the final amount, checking payment manually, and updating order progress.

The workflow reflects the operating model of a small food business: availability, final pricing, fulfillment arrangements, and payment are confirmed by the owner rather than treated as an automatic checkout.

> **Current release boundary**  
> The default main branch is an MVP foundation under active development. Several owner modules remain placeholders. Payment processing, inventory operations, production planning, and delivery-rate calculation are not implemented as complete production workflows.

## Experience

### Customer storefront

- Home page with brand introduction and featured catalog content.
- Firestore-backed published product catalog when Firebase is configured.
- Product search and category filtering.
- Product cards with product details, price display, and availability.
- Cart with quantity adjustment, item removal, and browser-local persistence.
- Guest checkout for customer contact details, pickup or delivery choice, address, and optional notes.
- Order-request creation using Firebase Anonymous Authentication.
- WhatsApp handoff with a prepared message and order reference when a public business number is configured.
- Order tracking in the original guest browser session.

### Owner workspace

- Firebase Email/Password sign-in.
- Owner access check using an active profile record.
- Dashboard summary and recent-order overview.
- Order inbox for reviewing requests, confirming a total, recording manual payment verification, and updating order progress.
- Product, category, production, inventory, direct-sales, reports, and settings sections are represented in navigation; several remain placeholders on main.

## Order lifecycle

A submitted checkout is an **order request**, not an automatically accepted order or payment.

    Customer browses products
             |
             v
       Adds items to cart
             |
             v
       Submits checkout
             |
             v
      REQUESTED / UNPAID
             |
             v
     Owner checks availability
             |
             v
      Owner confirms final total
             |
             v
   Customer pays outside the app
             |
             v
     Owner verifies the payment
             |
             v
    Preparation and fulfillment
             |
             v
       Order completed

Order status and payment status are stored separately. A WhatsApp message or a customer-provided transfer screenshot does not, by itself, prove that funds have been received.

## Current implementation matrix

| Area | Status on main |
| --- | --- |
| Responsive storefront shell | Implemented |
| Public Firestore catalog | Implemented when configured |
| Search and category filtering | Implemented |
| Browser-persisted cart | Implemented |
| Guest order request | Implemented when Firebase is configured |
| WhatsApp follow-up | Implemented when configured |
| Guest order tracking | Session/browser scoped |
| Owner sign-in and order inbox | Implemented when configured |
| Product and category CRUD | Placeholder |
| Production and inventory management | Placeholder |
| Direct sales and operational reports | Placeholder |
| Product image upload / Firebase Storage | Not configured |
| Payment gateway or payment webhook | Not implemented |
| Automatic delivery pricing / route calculation | Not implemented |
| Customer accounts and cross-device order history | Not implemented |
| Offline order submission | Not supported |

### Demo catalog

When Firebase is not configured, VITE_ENABLE_DEMO_CATALOG=true can show fixture records from apps/web/src/data/fixtures/demo-products.ts. Demo records are for interface development only and must not be treated as verified business menu data, current prices, or live stock.

When Firebase is configured, the storefront reads published catalog records from publicProducts.

## Design direction

The visual system follows a **Warm Modern Artisanal** direction: a contemporary storefront with the familiarity of a neighborhood snack business.

| Token | Value | Intended use |
| --- | --- | --- |
| Cocoa | #493127 | Brand presence and strong headings |
| Cream | #F8F4EC | Warm backgrounds |
| Terracotta | #B85D2E | Primary actions and accents |
| Sage | #54745B | Supporting accents and availability cues |

The storefront prioritizes product discovery and approachable content. The owner workspace prioritizes task clarity and operational status. Reduced-motion preferences are considered in the global styling.

## Architecture

    React application
       ├── Storefront area
       ├── Owner workspace
       ├── Domain entities and validation rules
       ├── Data repositories
       └── Shared UI and utilities
                |
                v
        Firebase Web SDK
          ├── Authentication
          └── Cloud Firestore

The application uses React Router to separate public and owner experiences. Domain modules define entities and business rules, while repositories isolate data access.

### Data and trust boundaries

- publicProducts and publicCategories provide customer-facing catalog information.
- Private operational collections are protected by Firestore Rules.
- Guest checkout uses Firebase Anonymous Authentication.
- Owner access requires an active userProfiles/{uid} record; there is no public owner-registration flow.
- Route guards improve navigation but are not a substitute for Firestore authorization.

**MVP limitation:** order creation and owner order/payment updates on main are performed by the web client through the Firebase Web SDK. Before production use, review the security rules and consider moving trusted payment and order-state transitions into server-side functions.

## Technology

- React 19 and TypeScript 5.9
- Vite 7
- Tailwind CSS 4 with the Vite integration
- React Router 7
- Firebase Authentication and Cloud Firestore
- QR code and barcode utilities using qrcode.react and @zxing/browser
- GitHub Actions for type-check and build validation

## Requirements

- Node.js **24.12.0 or newer**, as declared by package.json.
- npm.
- A Firebase project for live catalog, authentication, and order-request workflows.

The current GitHub Actions workflow uses Node.js 22 while the package manifest requires Node.js 24.12.0 or newer. Align the workflow runtime with the package requirement before relying on CI as the release gate.

## Getting started

    git clone https://github.com/gusti111/KudapKita.git
    cd KudapKita
    npm install

Create a local environment file from the example:

    # Windows PowerShell
    Copy-Item .env.example .env

    # macOS / Linux
    cp .env.example .env

Configure the Firebase web values in .env:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

Optionally configure VITE_PUBLIC_WHATSAPP_NUMBER. For UI development without Firebase, the demo catalog can be enabled through VITE_ENABLE_DEMO_CATALOG=true.

Start the development server:

    npm run dev

Run type checking and create a production build:

    npm run typecheck
    npm run build

Preview the production build locally:

    npm run preview

## Firebase setup and security

1. Create or select a Firebase project.
2. Register a web application and copy its client configuration into the local environment file.
3. Enable the authentication methods used by the app, including Anonymous Authentication for guest order requests and Email/Password for owner access.
4. Review and deploy the Firestore Rules only after validating the data model and owner provisioning workflow.
5. Provision owner profile records through a trusted administrative process.
6. Test with separate guest and owner identities before using real customer data.

Never place service-account JSON files or Firebase Admin credentials in the web client. Firebase client configuration is not a substitute for security rules and backend authorization.

## Documentation

- docs/security/FIRESTORE_RULES_TEST_MATRIX.md — security expectations and test scenarios.
- firebase/firestore.rules — Firestore access policies.
- .env.example — local environment configuration.

The rules test matrix describes expectations; it should not be interpreted as evidence that every Firebase Emulator test has passed.

## Project status

KudapKita is an active MVP project. The current branch provides the foundation for a realistic customer order-request flow and owner-side manual reconciliation, while several broader business operations remain planned or incomplete.

## Repository

[github.com/gusti111/KudapKita](https://github.com/gusti111/KudapKita)