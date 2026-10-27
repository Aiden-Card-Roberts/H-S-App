# PPE requests

Open **PPE requests** from the audit header, or use the public demo at `https://aiden-card-roberts.github.io/H-S-App/#ppe`.

The supplied stock list is the default dropdown:

- Fire retardant Hi-vis waterproof coat
- Fire retardant Hi-vis sweatshirt
- Fire retardant Hi-vis polo shirt (L/S)
- Fire retardant Hi-vis trousers
- Hi-vis waterproof trousers
- Hi-Vis Coverall
- Hi-Vis waterproof Coverall
- Haix Boots

Clothing sizes: **Small, Medium, Large, Extra Large, 2 Extra Large, 3 Extra Large**. Boot sizes: **5, 6, 7, 8, 9, 10, 11, 12, 13**. Sizes are required for these items. The owner can edit their company's items, size options and size requirements through **Edit PPE list**. Existing submitted requests retain the item name recorded when submitted.

## Form and evidence

Each request has one item, size, quantity (1–100), a required reason, optional site and gang details, and 1–5 required evidence photos. A camera input and a gallery/file input are provided. Original images must be smaller than 25 MB; the browser resizes them to at most 1,600 pixels on the longest edge and converts them to JPEG. Each saved image must fit within the 3 MB evidence limit. Captions are optional. The signed-in inspector's name is applied by the server and cannot be spoofed in a submitted request.

The public GitHub Pages demo stores requests, photos, local review decisions and PPE-list changes only on the current device. It clearly labels them as unsent and does not contact or email a company. Its submit button reads **Save request on this device**.

In the account-enabled server, a verified paid inspector can submit a request to the company workspace. Owners see the company's submitted requests; inspectors see only their own. Requests progress from **Requested** to **Approved** or **Declined**, then from Approved to **Issued** or Declined. Declining requires a manager note. Only a verified, paid company owner can change a submitted request's status or edit the company dropdown. Review actions are versioned, timestamped and identify the reviewer. Company membership, subscription/seat access, CSRF and browser-origin checks apply to writes.

## Offline and recovery

Drafts save as you work. An account request submitted while offline is marked **Saved — not yet submitted**. On reconnection choose **Sync requests**; saved queued requests are submitted and statuses refreshed. Drafts that were never submitted are not uploaded automatically. A subscription and an available inspector place are required for new submissions; existing submitted history can still be refreshed/read after subscription expiry.

Submission IDs are idempotent, so retrying the same request cannot create a second company record. A retry with different details is rejected and the local edit is kept as a separate draft rather than overwriting submitted evidence. Progress is saved after each successful upload. Company PPE-list changes can invalidate an old draft item or size; the draft stays on the device so the user can select a current option.

PPE data uses a separate IndexedDB database per company and user; it does not migrate or overwrite the existing audit database. Signing out warns about unsent audits or PPE drafts and clears the current company/user's audit and PPE caches. Offline sign-in/editing follows the account's existing offline lease. A review refresh or submission checks the current server session before writing, including account changes in another tab.

**Export PPE backup** includes requests and evidence in a JSON file. **Restore PPE backup** deliberately restores records as new drafts with fresh IDs; it does not forge prior company submissions or manager approval. A submitted/local-saved request can also be printed or saved as PDF through the browser. There is no automatic email notification, purchasing or stock deduction.

## Server and deployment

`server/database.js` adds the `ppe_catalogs` and `ppe_requests` tables and an index using additive `CREATE TABLE IF NOT EXISTS` statements. Existing audit, account and billing data is retained. Keep the persistent disk required by the account deployment. `server/ppe.js` implements the permission-checked catalog, submission/list and review endpoints. The Docker image includes the shared PPE validation model used by the server.

This feature does not resolve the earlier Render storage/Stripe/email configuration requirements; see [ACCOUNTS.md](ACCOUNTS.md). Secure company submission needs that server to be configured and running. The public demo remains usable without those services.

## Verification

`npm test` includes PPE validation, supplied stock/sizes, required evidence, invalid size rejection, idempotent submissions, company separation, paid writes, inspector/owner permissions, review versions and preservation of prior item names.

For the public demo browser test:

```sh
npm run build:pages
npm exec vite preview -- --host 0.0.0.0 --port 4174 --strictPort --base /H-S-App/ --outDir dist-pages
# In another terminal:
npm run test:ppe
```

This checks the mobile form, supplied size lists including boot size 5, required photos, captions, local review, offline reload, JSON backup/restore, printing and preservation of an existing audit. `npm run test:accounts` also exercises offline PPE submission, reconnection/sync and company-owner review against the real local API with simulated payment/email providers.
