# Admin portal

The footer links to `#admin`. Staff sign in with a username; members continue to use an email address. The staff workspace shows real membership counts, upcoming renewals, searchable members, activation/expiry editing, and password changes. It does not show the old prototype's sample inquiries or check-ins.

## Install permissions

1. Ensure `supabase/schema.sql` has already been installed.
2. Open the Supabase SQL Editor and run all of `supabase/admin.sql`. This migration can be re-run.
3. Admin roles and membership audit records are stored in the private schema. Do not add that schema to the Data API. Do not disable RLS.

## Create TestAdmin locally

1. In the ignored local `.env`, add `SUPABASE_SECRET_KEY` using a Supabase secret or legacy service-role key. Keep the existing project URL and publishable key. Never commit this secret or add it to frontend code.
2. Run `npm run admin:create`, supplying a JSON object on standard input with `username` and `password`. For example, use a local password prompt to construct the object; do not save a live password in a tracked file or shell history.
3. The script creates and confirms the account, assigns the private admin role, and verifies login and protected member access. It refuses to reset an existing account and does not lower the project's password requirements.
4. Open `#admin` and sign in. Change a temporary password under **My account**.

The username is mapped to a synthetic address such as `testadmin@admin.progym.invalid`. This address has no inbox and is not used to send email. Admin recovery requires the Supabase project owner; a signed-in admin can change their password in the portal. Registration through the member form never grants admin access.

The requested password `123321` may be rejected if the project requires a longer password. Use a password meeting the configured policy; do not weaken the project policy to provision an account.

## Verify

- Open `#admin` while signed out: only the login form is visible.
- Sign in with a regular member account: admin access is denied.
- Sign in as an administrator: list a real member, update status and expiry, then confirm the member dashboard reflects it after refresh.
- Sign out: staff records must disappear. The database remains the authority for every admin operation.
