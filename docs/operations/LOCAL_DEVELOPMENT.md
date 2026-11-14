# Local Development Setup

## Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Firebase config

Copy the web app configuration from Firebase Console into `.env.local`. These values identify the Firebase web app; they are not server credentials. Firestore Security Rules must still protect all data.

## Useful commands

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Windows PowerShell

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

## Local testing notes

- Without Firebase configuration, the storefront uses clearly marked demo records only.
- Owner login and checkout submission remain disabled until Firebase is configured.
- Use a separate browser profile for owner and guest checkout tests because the same browser session cannot simultaneously be both an authenticated owner and an anonymous guest.
- Check browser console and Firestore Rules errors during integration tests.
