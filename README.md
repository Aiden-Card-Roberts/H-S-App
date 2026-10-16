# Fieldcheck — HS&E Gang Inspections

A mobile-friendly, offline-first web app based on **GTWF 44, issue 10 (13 January 2026)**. The source form is in [docs/GTWF44-issue10.pdf](docs/GTWF44-issue10.pdf).

## Develop and validate

Requires Node.js 22.12+ (this environment uses Node 24) and npm.

```sh
cd /workspace/H-S-App
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm test
npm run build
npm run dev -- --port 5173 --strictPort
```

For offline validation, build first and use `npm run preview -- --port 4173 --strictPort`. The service worker is deliberately enabled only in production builds to avoid caching development source. Wait for **Offline ready** before disconnecting. A first visit requires connectivity. Production deployment requires HTTPS; service workers also work on localhost for testing. Use a stable origin: different domains/ports have separate audit storage.

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

This first version stores data only in the browser on the current device. It has no accounts, server, cross-device sync, DepotNet integration or automatic manager notification. Export backups regularly; clearing site data or losing the device can lose the audits. Restore adds new audit IDs and preserves existing records with matching IDs. Only this app’s GTWF 44 issue 10 JSON backups are accepted.

Photos, names, signatures and other inspection data are included in exported backups and printed reports. Manage those files using your company’s storage and access procedures. Print output is a readable report, not an exact copy of the paper layout. Photo input supports formats the browser can decode; unsupported formats display an error.

File completed reports in the Site Inspections folder and manually distribute non-conformities within the form’s 48-hour requirement. The app records findings and reminders; it does not claim that reporting has been completed.

## Cloud environment

Use this existing isolated checkout; do not create a Git worktree unless requested. Dependencies and generated builds are retained files. Development/preview servers must be restarted in a new task. Installation and startup instructions are also saved in the cloud environment draft for review and publication.

The app is prepared locally in the cloud checkout. It has not been pushed to GitHub or deployed to a public HTTPS host.
