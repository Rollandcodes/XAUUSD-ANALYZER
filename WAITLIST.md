# PipNexus Waitlist System

This document describes the current waitlist implementation and usage.

## Features

- Multi-field waitlist form: name, email, interest checkbox, optional comments.
- Waitlist API endpoint with validation and duplicate-email handling.
- Welcome email generation and delivery attempt through Resend.
- Referral code creation for each successful signup.
- Local JSON persistence for waitlist entries.

## Data Model

```ts
interface WaitlistEntry {
  id: string
  name: string
  email: string
  interested: boolean
  comments: string
  referralCode: string
  createdAt: string
  source: string
}
```

## API Endpoints

### `POST /api/waitlist`

Submits a new waitlist signup.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "interested": true,
  "comments": "Excited for launch",
  "source": "website"
}
```

Success response:

```json
{
  "success": true,
  "message": "Welcome to the waitlist! Welcome email sent successfully.",
  "referralCode": "REFCODE123ABC",
  "emailSent": true
}
```

### `GET /api/waitlist`

Returns current total waitlist count.

Response:

```json
{
  "success": true,
  "message": "Total waitlist entries: 500"
}
```

## File Structure

```text
XAUUSD-ANALYZER/
├── pages/
│   ├── waitlist.tsx
│   └── api/
│       └── waitlist.ts
├── lib/
│   └── email.ts
└── data/
    └── waitlist.json
```

## Environment Variables

Required for real email delivery:

```dotenv
RESEND_API_KEY=your_resend_key_here
```

Optional sender override:

```dotenv
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Notes

- If `RESEND_API_KEY` is missing, signup still succeeds and email sending is skipped safely.
- Current storage is file-based (`data/waitlist.json`) for simplicity.
- Production can migrate storage to a managed database without changing form behavior.

## Quick Test

1. Start the app.
2. Open `/waitlist`.
3. Submit the form with a valid email.
4. Confirm success message and referral code display.
5. Check API result message for email delivery status.
