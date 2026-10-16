# Company accounts and subscriptions

The account implementation is prepared and tested locally. **Live Stripe billing, live email delivery and a hosted account server are not activated.** The GitHub Pages site is an explicitly labelled local demo; it cannot run the secure backend.

## Plans

| Company plan | Monthly charge | Inspector places |
| --- | --- | --- |
| Team 5 | GBP 55 | 5 |
| Team 10 | GBP 75 | 10 |

The owner counts as one inspector. Pending invitations reserve places for seven days. Removing an inspector revokes their server sessions. On downgrade, the owner and the earliest remaining inspectors up to the new limit retain write access. Other authenticated members can export/read their existing records but cannot upload changes. No free trial or discount is configured. Stripe handles card details, invoices, plan changes, prorations and cancellation through its hosted pages.

## Run locally

Node 24.5+ is required. From `/workspace/H-S-App`:

```sh
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm test
npm run build
npm start
```

The default origin is `http://localhost:3000`. If using `127.0.0.1`, set `APP_URL=http://127.0.0.1:3000` so the browser Origin matches. A local `.env` is supported by `npm start`; copy `.env.example` without committing real values. The API and app share an origin. Development without email credentials writes verification/reset messages to ignored `data/dev-mail.jsonl`; inspect links privately on the machine and do not paste tokens into chat or commits. Without Stripe keys, checkout responds with a clear unavailable error and no payment access is granted.

`npm run test:accounts` starts its own server with an in-memory database, captured email and simulated Stripe. It exercises the mobile signup and verification flows, server-owned prices, subscription activation, protected sync, offline editing, cache deletion on logout, company isolation, conflict copies and interrupted-sync recovery. It makes no real charges. `npm test` includes the API permission, seat, webhook and password-reset checks. These checks do not validate a real merchant account, email provider, bank payouts or a hosting deployment.

`npm run dev` remains the original device-local demo. For a production-style demo build use `npm run build:demo`; `npm run build` always produces the account-enabled app and fails closed in the UI if its API is unavailable. `npm run build:pages` explicitly builds the demo for GitHub Pages.

## Secure hosting

[Create the prepared Render service](https://render.com/deploy?repo=https://github.com/Aiden-Card-Roberts/H-S-App)

`render.yaml` creates one Docker web service with a persistent disk. The plan is Starter; **Render hosting/storage charges are separate from Stripe fees and require the owner to accept them.** The actual hosting account has not been created or connected. Do not use an ephemeral/free filesystem for customer records. The Docker image uses Node 24, runs the app as the `node` user, serves the frontend and API together, and mounts the database at `/var/data/fieldcheck.sqlite`. Keep one instance: SQLite and checkout coordination are designed for one server. For larger deployments, migrate to a shared transactional database and shared rate-limiting/locking before adding instances.

Required private server variables:

| Name | Use |
| --- | --- |
| `APP_URL` | Final HTTPS origin. Render's `RENDER_EXTERNAL_URL` is used automatically if omitted. |
| `DATABASE_PATH` | Persistent SQLite file; blueprint uses `/var/data/fieldcheck.sqlite`. |
| `STRIPE_SECRET_KEY` | Stripe server API credential; never a `VITE_` value. |
| `STRIPE_WEBHOOK_SECRET` | Actual webhook signing secret for local HMAC verification. A network-proxy placeholder cannot verify signatures. |
| `STRIPE_PRICE_TEAM5` | Recurring GBP 55 monthly price ID. |
| `STRIPE_PRICE_TEAM10` | Recurring GBP 75 monthly price ID. |
| `RESEND_API_KEY` | Transactional email credential. |
| `MAIL_FROM` | A sender address verified with the email provider. Real customer email requires an approved sending domain. |
| `TRUST_PROXY` | Set to `1` only behind the intended single hosting reverse proxy (blueprint sets it). |

Production startup checks these requirements and requires HTTPS. Secrets belong in the hosting provider's private environment settings, not source files, frontend variables, screenshots or chat. Cloud-environment secret requirements and Render runtime settings are separate; declaring one does not configure the other.

### Prepare Stripe once the host and credentials are connected

The owner already has a Stripe account, but no Stripe key is bound to this workspace. The setup helper can create the two exact prices and the webhook after the final host URL and secure API credential are supplied:

```sh
npm run setup:stripe
```

It defaults to test mode, verifies the connected Stripe mode, and refuses live configuration unless `STRIPE_MODE=live` is explicitly selected. It uses idempotency keys and writes the price IDs and signing secret to ignored `.env.stripe.generated` with private permissions; it never prints secret values. Copy those settings securely into the deployed server. A repeated run that finds an existing endpoint may require reading its signing secret in Stripe's dashboard; the helper will not invent or replace it. Run the helper from a trusted machine with direct secret access; a proxy-bound Stripe key can make HTTPS API calls, but the webhook secret still needs secure transfer to the host.

Webhook destination: `https://YOUR-HOST/api/billing/webhook`. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

After connection, validate in Stripe test mode: register and verify an owner, pay through hosted Checkout with Stripe's documented test method, confirm a signed webhook activates the account, invite an inspector, upload/download an audit, change plan, cancel/expire access, request a password reset and verify delivery. Confirm the test and live price IDs/signing secrets are not mixed. Complete business identity, sending domain, privacy/terms and backup arrangements before accepting real customers.

## Access and storage behavior

- Passwords are salted with scrypt. Opaque session tokens are hashed in SQLite and issued in HttpOnly, SameSite=Strict cookies; production also uses Secure and the `__Host-` prefix. Sessions last seven days. Password reset revokes all sessions.
- Mutating account/API operations require the configured browser Origin. Authenticated changes also require a session CSRF token. Auth/email endpoints are rate limited. Email verification and one-use reset tokens expire and are stored as hashes.
- Server membership checks scope every audit query to a company. Owners see company audits; inspectors see their own. Inspectors cannot change manager-review fields or billing/team settings.
- Only verified, in-seat users with an active, unexpired approved Stripe subscription can upload audits. The server validates GBP currency, monthly interval, quantity one and exact GBP 55/75 amounts; client prices and successful return URLs do not grant access.
- Stripe webhook signatures are verified before processing. Events are deduplicated, and current subscription state is retrieved from Stripe so stale events cannot restore an old payment state. Different existing subscriptions cannot silently replace an active company subscription. Open checkout sessions are reused or expired before choosing another plan.
- Authenticated users retain read/export access to their existing records after subscription expiry; creating/uploading changes is paid. Reconnect to refresh billing state after checkout or a portal change.
- Inspections save locally in IndexedDB under a company-and-user-specific database name. They sync only when **Sync now** is selected. Existing demo audits are kept separate; export from the demo and deliberately import into the company workspace to transfer them. Nothing is silently uploaded from the old demo.
- A verified paid session can edit offline for up to 24 hours from its last online check, capped by its server-session and paid-period expiry. Offline access relies on locally cached data, not a tamper-proof licence; a server revocation cannot immediately erase data from a disconnected device. Server API checks remain authoritative when it reconnects. Use trusted, access-controlled devices for inspection data.
- Sign-out clears the current local company cache after warning about unsynced edits. If offline, server revocation is queued until the next online launch. This does not revoke sessions on other devices; a password reset does.
- Concurrent server versions are checked on upload. A conflicting local edit becomes a separate draft, preserving the current server record. Inspector conflict copies reset the manager-review fields so they cannot impersonate a manager. Upload progress is saved so retrying after a connection interruption does not duplicate successful records.
- Photos are currently included in the SQLite audit document. A single upload is limited to 25 MB; export a local backup if a record exceeds that. Monitor disk size and increase storage before onboarding more companies. The plan cards do not promise unlimited storage.

## Backups and operations

Persistent storage survives redeployment; it is not a complete backup strategy. Configure off-host encrypted backups and test restoration before live sales. SQLite uses WAL; use SQLite's online backup facility or stop the service before copying the database and WAL files. Backups contain names, signatures, images, membership and payment identifiers, password hashes and token hashes: restrict access and define retention/deletion procedures. Stripe retains card/payment data on its service; the app never receives card numbers.

The app does not send audits or NC notifications to managers automatically. The form's manual filing and 48-hour reporting process remains in place. A printed report is generated by the browser; JSON backup/restore includes photos and signatures.

## Validation completed in this workspace

- 18 automated audit/API tests passed.
- Mobile browser account flow passed with simulated Stripe and email, including offline edits, conflicting edits, interrupted sync, cross-session isolation and sign-out cache removal.
- Original 61-check demo browser flow passed, including photo/signature, printing, backup/restore and offline reload.
- Docker build passed with package integrity and TLS verification retained. The image starts as a non-root user, denies anonymous audit access and retains SQLite data on its mounted volume across restart.
- Live merchant payments, actual email delivery and the external hosting deployment remain unverified because their credentials/account connections are not available.
