# Fieldcheck — HS&E Gang Inspections

**Open the local demo: https://aiden-card-roberts.github.io/H-S-App/**

Company login and subscription support is implemented separately with a secure Node server. It is tested locally and awaiting hosting, Stripe and email connections. See [account setup and deployment](docs/ACCOUNTS.md).

A mobile-friendly, offline-first web app based on **GTWF 44, issue 10 (13 January 2026)**. The original uploaded PDF is retained locally in `docs/GTWF44-issue10.pdf`; it is excluded from the published website.

## Develop and validate

Requires Node.js 24+ and npm. Node’s built-in SQLite runs the company account database.

```sh
cd /workspace/H-S-App
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm test
npm run build
npm start
```

For account testing run `npm run test:accounts`. For offline validation of the original local demo, run `npm run build:demo` first and use `npm run preview -- --port 4173 --strictPort`. The service worker is deliberately enabled only in production builds to avoid caching development source. Wait for **Offline ready** before disconnecting. A first visit requires connectivity. Production deployment requires HTTPS; service workers also work on localhost for testing. Use a stable origin: different domains/ports have separate audit storage.

## Browser smoke test

With the production preview running on port 4173 and Chromium installed, run `npm run test:smoke`. Set `CHROMIUM_PATH` if Chromium is elsewhere (default `/usr/bin/chromium`). This uses isolated browser contexts and test data; it checks the full inspection, photo, signature, scoring, export, PDF, offline reload and creation, and backup restore. Test artifacts are written under `/tmp/fieldcheck-*`.

## Included workflow

- Inspection, assessor, gang, vehicle, operative, tablet and phone details.
- All 61 numbered Yes / No / N/A checks, with the red and yellow card markers from the source PDF.
- Observations, corrective actions, owners and due dates for every No.
- Van inventory, serial-number comments, operative feedback and drawn inspector signature.
- Photos resized to a maximum 1,600-pixel edge, with captions, saved in IndexedDB with the audit.
- Manager review, unsafe-activity deduction and grading.
- Autosaving on the device, JSON backup export and restore, and a printable report (use the browser’s Save as PDF option).

Completion requires site, gang number, assessor, date, all 61 answers, observations/owner/due date for every No, inventory statuses (N/A allowed), comments for missing inventory items, and the inspector’s name and signature. Editing a completed inspection returns it to draft.

Scoring follows the user-confirmed interpretation: Yes earns one point, No zero, N/A reduces the maximum from 61. Unsafe activity multiplies earned points by 0.45. Percentage = adjusted earned points / applicable maximum × 100. All-N/A produces no percentage. Grading uses the form’s bands; percentages above 99 but below 100 remain Excellent. Items 59 and 61 retain the form’s literal Yes/No scoring even though their questions ask about non-conformities. Intermediate scores are marked incomplete.

## Data and operational limits

The public GitHub Pages demo stores data only in the browser on the current device. The account-enabled server adds verified logins, company-scoped storage, manual sync, inspector invitations and subscription enforcement, but live services have not been connected. Neither version includes DepotNet integration or automatic manager notification. Export backups regularly; clearing site data or losing the device can lose the audits. Restore adds new audit IDs and preserves existing records with matching IDs. Only this app’s GTWF 44 issue 10 JSON backups are accepted.

Photos, names, signatures and other inspection data are included in exported backups and printed reports. Manage those files using your company’s storage and access procedures. Print output is a readable report, not an exact copy of the paper layout. Photo input supports formats the browser can decode; unsupported formats display an error.

File completed reports in the Site Inspections folder and manually distribute non-conformities within the form’s 48-hour requirement. The app records findings and reminders; it does not claim that reporting has been completed.

## Company plans

- Team 5: **£55 per company per month**, up to 5 inspectors.
- Team 10: **£75 per company per month**, up to 10 inspectors.

The owner counts towards the inspector limit. Payments use hosted Stripe Checkout and a customer portal. Real payments are not active yet.

## Cloud environment

Use this existing isolated checkout; do not create a Git worktree unless requested. Dependencies and generated builds are retained files. Development/preview servers must be restarted in a new task. Installation and startup instructions are also saved in the cloud environment draft for review and publication.

## Website publishing

`npm run build:pages` builds the app for the `/H-S-App/` path used by GitHub Pages. `npm run publish:pages` builds and uploads only the generated website files to the existing repository’s `gh-pages` branch, preserving branch history and rejecting concurrent conflicting updates. The uploaded PDF and local browser audit data are not included.

GitHub Pages must serve the `gh-pages` branch from its root directory. If it has not enabled that automatically, it can be configured through the repository Pages settings or the GitHub API. Uploading a branch alone does not prove that Pages is enabled or the website is live. Verify the resulting HTTPS site and its offline workflow before declaring publishing complete.

The browser test also supports `APP_URL`, for example `APP_URL=http://127.0.0.1:4174/H-S-App/ npm run test:smoke`, to validate the project-path build. Keep a stable final website address because audits are stored per browser origin.
