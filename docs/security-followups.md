# Security Follow-ups Before Production

This project is still a school project, but these items should be done before selling or running it for a real customer.

## Supabase Schema and RLS

Current risk: parts of the database setup have been created manually or with placeholder migrations. A fresh Supabase project cannot be trusted to match the current production project unless migrations, seed data, and RLS policies are complete.

Desired end state:
- A fresh Supabase project can be recreated from `supabase/migrations` and `supabase/seed.sql`.
- Every app table has Row Level Security enabled.
- Anonymous users cannot write app data.
- Employees can only perform employee-safe operations.
- Admin users can manage operational data through the API.
- Backend service-role actions are limited to server-side provisioning and cleanup.

Owner checklist:
- Apply migrations to a fresh Supabase project.
- Confirm required lookup rows exist for roles, shift categories, and swap statuses.
- Confirm `employees.supabase_user_id` is populated for every login-enabled employee.
- Confirm policies match the app access model: `employees.app_access` is either `admin` or `employee`.
- Run manual smoke tests for login, employee creation, shift creation, location creation, and swap requests.

Acceptance criteria:
- `supabase/migrations` contains real schema and policy SQL, not placeholders.
- A non-authenticated request cannot insert, update, or delete rows.
- An employee account cannot create management data such as shifts, locations, roles, events, contacts, or associations.
- An admin account can perform the management workflows used in the admin dashboard.

## Admin-to-Employee App Handoff

Original risk: passing Supabase access and refresh tokens in URLs can leak them through browser history, screenshots, logs, and referrers.

Desired end state:
- The admin app redirects to the employee app with only a one-time `transfer_code`.
- The employee app redeems the code server-side, sets the Supabase session, and removes the code from browser history.
- Codes are short-lived and single-use.

Current baseline:
- The app uses a 60-second, single-use transfer code held in API memory.
- This is acceptable for one API instance during school/demo use.
- Before multi-instance deployment, move transfer storage to a shared backend store such as the database or Redis.

Owner checklist:
- Verify no frontend route writes `access_token` or `refresh_token` into query parameters.
- Verify expired or reused transfer codes fail cleanly and redirect to login.
- Verify normal login, reset-password, admin routing, and employee routing still work.

Acceptance criteria:
- URLs never contain Supabase access or refresh tokens.
- Transfer codes expire after 60 seconds.
- Transfer codes can be redeemed exactly once.
- The employee app still loads the authenticated employee portal after redirect.
