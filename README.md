# Tatkaal Portal

Prototype for the Tatkaal passport renewal approval workflow.

## Current stage

The applicant portal now submits application data and JPEG documents to the PHP API and stores them in the Hostinger MariaDB database. Applicant status lookup also reads from the database.

The officer portal is still using the prototype browser storage and demo login. It will be moved to server-side authentication and database APIs in the next stage.

## Server files

- `api/config/database.php` is created only on the server and must not be committed to GitHub.
- Use `api/config/database.example.php` as the template.
- Uploaded documents are stored under `api/storage/uploads/` and direct web access is blocked.

## Applicant API

- `POST /api/applications/create.php`
- `GET /api/status/get.php?application_number=...&passport_number=...`

The application API validates required fields, accepts JPEG documents up to 5 MB each, checks the 30-day passport-number duplicate rule, stores application history, and creates a reference number based on the database record ID.

## Testing

Do not use real applicant information while this is still a prototype.
