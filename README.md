# Tatkaal Portal (working prototype)

Two separate pages, plain HTML/CSS/JS with no build step:

- `index.html` — Applicant portal: eligibility → adult/minor form → document upload → application number → status tracking.
- `admin.html` — Consular officer portal: demo login → dashboard → search/filter → review documents → approve/reject → remarks/history.

## Demo officer login

Username: `officer`
Password: `consulate123`

This login is for prototype testing only. It must be replaced with server-side authentication before real use.

## Current storage limitation

Applications and document previews are stored in the browser's `localStorage`. This means the applicant and officer must use the same browser/device/site to see the same test data. It is not suitable for real applicants.

The next production step is to replace `load()` / `save()` in `js/shared.js` with a PHP + MySQL backend and move authentication and document storage to the server.

## Current prototype flow

1. Applicant completes eligibility checks.
2. Applicant selects adult/minor.
3. Applicant enters application information and uploads JPEG documents.
4. A unique reference such as `TAT2026000001` is generated.
5. The application appears in the officer dashboard.
6. Officer can search by application number, passport number, name or email.
7. Officer opens the application and views document previews.
8. Officer approves or rejects the application and can add remarks.
9. The application keeps a basic history of submission and decision.
10. Applicant can track status using the application number and passport number.

## Hostinger static deployment

Upload `index.html`, `admin.html`, `css/`, and `js/` into the site's public directory. No `package.json` or build command is required for this prototype.

## Before real/internal use

Do not enter real applicant information into this static prototype. Before real testing with personal information, implement:

- PHP + MySQL server-side application storage
- Secure officer authentication and sessions
- Server-side authorization
- Secure document storage and access control
- Server-side validation and upload restrictions
- Audit logging
- Email/SMS integration
- Duplicate passport-number checks on the server
- Backups and appropriate security/privacy controls
