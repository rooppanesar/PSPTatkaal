# Tatkaal Portal (prototype)

Two separate pages, plain HTML/CSS/JS (no build step):

- `index.html` — Applicant portal (eligibility check → application form → submit)
- `admin.html` — Consular officer portal (login → pending list → review documents → approve / reject)

## Run in VS Code
1. Install the **Live Server** extension.
2. Right-click `index.html` → *Open with Live Server*. Open `admin.html` the same way (same address/port).
3. Demo officer login: `officer` / `consulate123` (edit in `js/admin.js`).

## Important limitation
Applications are saved in the browser's localStorage. Both pages share them only when opened in the
**same browser on the same site**. That is fine for testing the flow on one computer, but an applicant
submitting from their phone will NOT reach the officer's browser. Before real testing on Hostinger,
`load()` / `save()` in `js/shared.js` must be replaced with calls to a server (e.g. PHP + MySQL),
and the officer login must move to server-side authentication.

## Uploading to Hostinger
Upload everything (`index.html`, `admin.html`, `css/`, `js/`) into `public_html`.
