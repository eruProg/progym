# Pro Fitness Gym

Pro Fitness Gym is a fitness business serving Antipolo and Cainta. It offers gym memberships, personal coaching, and group exercise classes. This website is for visitors exploring the gym, members managing their training records, and gym staff managing memberships through Supabase.

## Problem being solved

Gym information and member records can be scattered across posters, messages, and manual logs. This system brings the gym's information into one website and gives each member a private place to view membership details and track workouts.

## Features

- **Landing page:** gym branding, membership rates, coaches, classes, and careers.
- **Membership rates:** PHP 1,500 membership fee and PHP 1,800 monthly rate.
- **Users:** email registration, email confirmation, sign-in, sign-out, and password recovery.
- **Member dashboard:** membership status, expiry date, and home branch.
- **Create:** register an account and add workout records.
- **Read:** view the public website, personal profile, and workout history.
- **Update:** edit the member's name and home branch; reset the account password.
- **Delete:** remove personal workout records after confirmation.
- **Access control:** members can access only their own profile and workouts. They cannot activate or extend their own membership.
- **Responsive design:** layouts verified at desktop, tablet, and mobile widths.

Membership payment and activation happen at the gym. Authorized staff manage membership status and expiry in the Admin portal. The Admin portal provides a protected staff overview, member search, and membership editing. Online payments are not implemented. Workout entries support create, read, and delete; there is no workout-edit form.

## Tech stack

- HTML, CSS, and vanilla JavaScript
- Supabase Auth and PostgreSQL with Row Level Security
- Supabase JavaScript SDK
- Node.js 22+ and esbuild
- GitHub Pages and GitHub Actions
- Node test runner, PGlite, and Playwright

## Setup and run

1. Install Node.js 22 or newer and Git.
2. Clone the repository and install dependencies:

   ```sh
   git clone https://github.com/eruProg/progym.git
   cd progym
   npm ci
   ```

3. Create a Supabase project. In its SQL Editor, run [supabase/schema.sql](supabase/schema.sql) once. Skip this if that project already has the schema installed.
4. Enable email sign-up and email confirmation under **Authentication → Sign In / Providers → Email**. Set the minimum password length to 12. Add `http://127.0.0.1:4173/` to the allowed redirect URLs.
5. Copy `.env.example` to `.env` and enter your project's URL and publishable key:

   ```dotenv
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-KEY
   ```

   The variable name `SUPABASE_ANON_KEY` also accepts newer `sb_publishable_...` keys. Never put a service-role key, secret key, or database password in the frontend. `.env` is ignored by Git.

6. Test, build, and run:

   ```sh
   npm test
   npm run build:local
   npm run preview
   ```

7. Open http://127.0.0.1:4173/.

For a public-page preview without Supabase configuration, run `npm run build` instead of `npm run build:local`. Registration is disabled until the connection settings are supplied.

### Clean-install verification

Installation, tests, and build passed in a fresh local directory on Windows with Node.js 24.20.0 and on a GitHub-hosted Ubuntu runner with Node.js 22. Both used `npm ci`, `npm test`, and `npm run build` with no existing `node_modules` folder.

### Browser tests

Start the preview server, then in a second terminal run:

```sh
npx playwright install chromium
npm run test:browser
```

Run these tests against `npm run build` output without Supabase environment variables. The tests inject a simulated backend to exercise authentication and dashboard flows without creating real accounts. Database tests execute the SQL schema and verify member isolation and protected membership fields using PGlite. Real email delivery must be checked against the configured Supabase project.

## Demo configuration

For the owner-approved demo, Supabase email confirmation is disabled so new accounts can sign in immediately. Resend is still restricted to its test sender: password-reset emails to other recipients will fail until an owned sending domain is verified. Restore confirmation for public use. See [email setup](docs/EMAIL_SETUP.md).

## Test accounts



**Administrator**

**Admin user**

- Username: `TestAdmin`
- Password: `TestAdmin123321`
- Role: Admin
Open `/#admin` (or `/progym/#admin` on GitHub Pages), also linked in the footer. Run `supabase/admin.sql` after the member schema and follow [admin setup](docs/ADMIN_SETUP.md) to create an account. The requested username is `TestAdmin`; it is not created by deploying the website. Live passwords and privileged keys are never committed. The browser API cannot grant admin access.

## Deploy on Vercel

Follow [the Vercel and Supabase guide](docs/VERCEL_SUPABASE.md). Import `eruProg/progym`, add the two Supabase environment variables in Vercel, and deploy. The included `vercel.json` configures the static build and `dist` output. Update Supabase's Site URL and Redirect URLs to the actual Vercel production domain, then test confirmation and password-reset emails.

## Publish to GitHub Pages

Follow [the step-by-step guide for eruProg/progym](docs/PUBLISH_PROGYM.md).

Set the repository's `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables, choose **GitHub Actions** in Pages settings, and push to `main`. The workflow builds and publishes `dist/`.

Expected website address after successful deployment: https://eruprog.github.io/progym/.

Configure Supabase's Site URL and redirect allowlist with that exact address. Custom SMTP is required to send confirmation and password-reset emails to general gym members; Supabase's default mail service is limited to organization-member testing.

## AI tools used

**OpenAI Codex** assisted with the website implementation, responsive styling, Supabase integration, SQL access policies, automated tests, deployment workflow, and documentation. Business rates, coach details, class schedules, hiring content, and images were supplied by the project owner. The supplied images were not AI-generated as part of this implementation.

## Source structure

```text
.github/workflows/deploy.yml  GitHub Pages deployment
public/site.js               Website pages and interactions
public/member-api.js         Authentication and member data access
public/admin.js              Staff sign-in and member management
public/content.js            Business content and validation
public/site.css              Current website styling
public/styles.css            Shared base styling
public/images/               Supplied business images
supabase/schema.sql          Database tables, trigger, and access rules
supabase/admin.sql           Admin permissions and membership audit
scripts/                     Build and local preview
tests/                       Automated checks
docs/                        Setup, deployment, and design notes
```

The original prototype files in `public/` are retained for reference but are excluded from the build. Its sample members and prototype staff controls are excluded. The current staff portal uses real Supabase data.
