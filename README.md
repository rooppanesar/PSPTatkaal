# Tatkaal Portal

Prototype for the Tatkaal Passport Renewal workflow for CGI Vancouver.

## Current version

The applicant and officer interfaces are still available as a working prototype. The browser `localStorage` workflow has **not** been removed yet.

This version adds the first PHP/MySQL backend pieces so we can migrate safely in stages.

### Backend files

- `api/config/database.php` - server-side MySQL connection settings
- `api/health/check.php` - checks the PHP-to-MySQL connection
- `api/applications/create.php` - first application creation API

### Important

Before deploying the PHP backend, copy `api/config/database.php` to the Hostinger server and replace `YOUR_DATABASE_PASSWORD` with the database password. Do not commit the real password to GitHub.

The real `database.php` is listed in `.gitignore`.

## API test

After uploading to Hostinger and setting the password, open:

`/api/health/check.php`

A successful response should be JSON similar to:

```json
{"success":true,"message":"Database connection is working."}
```

The application creation endpoint accepts a JSON `POST` request. The frontend will be connected to this endpoint in the next step, after the database connection has been tested.

## Current prototype limitation

The browser application still uses `localStorage` for the applicant/admin demo. Do not use real applicant or passport information until the backend migration, authentication, document storage, access controls, and security testing are completed.
