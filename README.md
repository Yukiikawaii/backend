# Aqua Grace — Backend

Node.js + Express + TypeScript API for customer registration, email
verification, and login. Talks to MySQL (works with XAMPP's MySQL).

This phase implements only customer account creation/verification/login —
no sessions/JWTs, no staff/admin, no orders — per the current project scope.

## Requirements

- Node.js 18+ (same as the frontend)
- MySQL, via XAMPP (Apache isn't needed — just start MySQL from the XAMPP
  control panel)

## 1. Set up the database

1. Start MySQL from your XAMPP control panel.
2. Open phpMyAdmin (or any MySQL client) and run the contents of
   `src/db/schema.sql` — either paste it into phpMyAdmin's SQL tab, or from
   a terminal:
   ```
   mysql -u root -p < src/db/schema.sql
   ```
   (XAMPP's default root user usually has no password — just press Enter.)
3. This creates the `aqua_grace` database and a single `customers` table.

## 2. Configure environment variables

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
   (On Windows, just duplicate the file in File Explorer and rename it, or
   `copy .env.example .env` in the terminal.)
2. Open `.env` and adjust `DB_USER` / `DB_PASSWORD` if your MySQL isn't the
   XAMPP default (`root` / no password).
3. Leave `GMAIL_USER` and `GMAIL_APP_PASSWORD` blank for now if you don't
   have them yet — see "Connecting Gmail" below for when you're ready.

## 3. Install dependencies and run

```
npm install
npm run dev
```

You should see:
```
Aqua Grace backend listening on http://localhost:4000
```

Leave this running in its own terminal, separate from the frontend's
`npm run dev` (they run on different ports: backend on 4000, frontend on
5173).

## 4. Point the frontend at this backend

The frontend already defaults to `http://localhost:4000/api`. If you ever
run the backend on a different port, create `.env` in the **frontend**
project with:
```
VITE_API_BASE_URL=http://localhost:PORT/api
```

## Connecting Gmail (real verification emails)

Without this, verification codes are printed to this terminal and appended
to `dev-emails.log` instead of being emailed — fully usable for testing.

To send real emails through Gmail:

1. Go to https://myaccount.google.com/security and turn on **2-Step
   Verification** on the Gmail account you want to send from (required for
   the next step, even if you don't otherwise use 2FA-required logins).
2. Go to https://myaccount.google.com/apppasswords
3. Under "Select app", choose **Mail**. Google generates a 16-character
   password (shown with spaces, e.g. `abcd efgh ijkl mnop`).
4. In this project's `.env`, set:
   ```
   GMAIL_USER=your.address@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```
   (remove the spaces from the app password)
5. Restart the backend (`Ctrl+C`, then `npm run dev` again).
6. Try registering a new account from the site — the code should now
   arrive in that Gmail inbox instead of the terminal.

Your regular Gmail password will **not** work here and shouldn't be used —
only an App Password, which can be revoked independently at any time from
the same Google Account page.

## API reference

All responses are JSON. All endpoints are under `/api/auth`.

| Method | Path | Body | Purpose |
|---|---|---|---|
| POST | `/register` | `{ fullName, email, phone, password }` | Create account, or handle duplicate email per rules below |
| POST | `/login` | `{ email, password }` | Sign in; blocks unverified accounts |
| POST | `/verify-email` | `{ email, code }` | Activate an account with its 6-digit code |
| POST | `/resend-verification` | `{ email }` | Send a fresh code (respects cooldown) |
| DELETE | `/unverified-account` | `{ email, code }` | Permanently delete an unverified account |

### Duplicate email on registration

- Existing account is **verified** → `exists_verified`, tells the customer
  to sign in instead. No new account is created.
- Existing account is **unverified** → `exists_unverified`. A fresh code is
  sent (unless the resend cooldown is active) and the customer is offered
  "Verify Existing Account" or "Delete Account and Register Again" — both
  implemented in the frontend's register page.

### Security notes

- Passwords are hashed with bcrypt (`bcryptjs`) before storage — never
  stored or logged in plain text.
- The 6-digit verification code is generated with `crypto.randomInt` and
  stored only as a bcrypt hash, never in plain text.
- Deleting an unverified account requires that account's current
  verification code as proof of ownership — there's no way to delete an
  account just by knowing its email address.
- An expired code never deletes the account — it just means that code no
  longer works; the customer can request a new one.
- Login and resend-verification give deliberately generic responses for
  unknown/verified emails so the API can't be used to check who has an
  account.

## What's intentionally NOT implemented yet

- Sessions, JWTs, or any persisted "logged in" state after a successful
  login
- Password reset ("Forgot password?" is a placeholder in the UI)
- Rate limiting beyond the per-account resend cooldown
- Staff/admin accounts, customer dashboard, orders, or any other feature
  beyond registration/verification/login

These are for later phases.
