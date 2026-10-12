# Member website specification

Retain the existing static deployment model, with a bundled Supabase client for email/password accounts and a PostgreSQL database protected by row-level security. GitHub Pages serves only public assets; authentication and member data live in the owner's Supabase project. No service-role key is used by the browser or build.

## Visual direction

White editorial layouts, charcoal membership panel, restrained gym red, existing Barlow Condensed and DM Sans typography. Use the supplied logo in navigation, footer and favicon. Preserve the supplied coach and recruitment artwork. Display the weekday class schedule as readable text as well as the original poster. Responsive navigation, visible keyboard focus, labelled forms, inline errors and reduced-motion support.

## Content decisions

- Membership fee: PHP 1,500. Monthly rate: PHP 1,800. Display separately; do not invent duration, promotions, inclusion rules or automatic activation.
- Domz and Paul use only the credentials in the supplied posters. No invented surnames, biographies or branch assignments.
- Monday/Wednesday: Ashley, Mixed Dance Class, 6 PM. Tuesday: Micko, Hip Hop Dance and Dance Work-out, 6 PM. Thursday: same class at 6:30 PM. Friday: JL John, Zumba Class, 6 PM. Asia/Manila time. The poster does not identify a branch; direct branch enquiries to reception.
- Hiring: Cainta, female and male coaches; reproduce supplied qualifications, skills and both application email addresses.

## Acceptance criteria

- Register, confirm email, sign in, sign out, recover password and update password through Supabase.
- Anonymous visitors cannot access the member dashboard. Members can see only their own profile and workout log, enforced in the database.
- New accounts start pending; membership activation and expiry are staff-controlled database fields, never self-assigned.
- Members can edit their name/home branch and create/delete personal workout entries with validation.
- No sample members are exposed by the deployed application. Staff controls require a database-managed admin role.
- Supplied rates, people, classes, recruitment and logo are present and readable on mobile and desktop.
- GitHub Actions tests, builds and publishes a repository-path-safe static artifact. Missing backend configuration is reported honestly and never simulates successful login.
- Document Supabase SQL, URL/key configuration, email redirects and launch validation. No deployment is claimed until it actually occurs.

## Admin and authentication completion

Keep the existing white staff sidebar and restrained red accents. Add a footer Admin portal, separate username sign-in, overview counts, upcoming renewals, member search, and membership editing. Admin roles live in a private table; security-definer functions validate the caller and audit changes. Browser metadata cannot grant access. Clear private data when the session changes. Provision accounts only through a local server-side script; never bundle privileged keys or passwords.

Acceptance: members cannot call admin operations; admins can change membership status and expiry; sign-out clears staff data; forms and tables work at 320px and desktop widths. Member sign-up, confirmation resend, password recovery, and login show actionable errors. Verify database authorization and browser flows separately from live SMTP delivery. Live account creation remains dependent on the owner installing the SQL and supplying local credentials.
