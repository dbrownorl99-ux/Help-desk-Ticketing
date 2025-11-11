# Helpdesk Ticketing Site

Simple, modern Helpdesk ticketing system:

- Next.js 14 (App Router, TypeScript)
- Firebase Firestore (tickets + messages)
- Email alerts via Resend or SMTP (Nodemailer)
- Chat per ticket, statuses, search by ticket number
- Admin dashboard for helpdesk agents

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

RESEND_API_KEY=... # or SMTP_*
ALERT_EMAIL_TO=you@example.com
ALERT_EMAIL_FROM=support@example.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Run dev:

```bash
npm run dev
```

Open:

- `/new-ticket` to create a ticket
- `/` to search by ticket number
- `/admin` for the helpdesk dashboard
