# Publish Pro Fitness Gym on GitHub Pages

The frontend is ready for GitHub Pages. Supabase supplies email sign-in and a private PostgreSQL database. GitHub Pages alone cannot host member authentication or a database.

## Set up Supabase

1. Create a project at https://supabase.com/dashboard. Keep the database password private.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once in the new project. This creates member profiles automatically at signup, workout logs, and row-level security policies. Do not disable RLS.
3. Under the project's API settings, copy the **Project URL** and **publishable key** (`sb_publishable_…`). A legacy `anon` key is also supported. Never use `service_role` or `sb_secret_…` in this website.
4. Under **Authentication → Providers**, enable email/password sign-in and email confirmation. Set the minimum password length to 12 to match the frontend.
5. Under **Authentication → URL Configuration**, set the Site URL to your exact deployed address, including the repository path and trailing slash: `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. Add that exact address to allowed Redirect URLs. Also add `http://127.0.0.1:4173/` for local testing. Add any custom domain separately.
6. Configure production SMTP under Authentication before admitting members; the default email service has delivery restrictions. Review Supabase's email rate limits and authentication settings for your expected volume.

Email confirmation and recovery return to the website root. The Supabase client consumes the authentication callback and the website opens the relevant member/password screen. Do not replace the default confirmation/reset email links with a different, unimplemented route.

Official references: [password authentication](https://supabase.com/docs/guides/auth/passwords), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [SMTP configuration](https://supabase.com/docs/guides/auth/auth-smtp).

## Publish from GitHub

1. Create your GitHub repository and upload/commit the project, including `.github/workflows/deploy.yml`, `package.json`, `package-lock.json`, `public/`, `scripts/`, `tests/`, and `supabase/`. Do not commit `.env`, `node_modules/`, or member data. The existing `.openai/hosting.json` is unrelated to GitHub Pages and is ignored by this workflow.
2. In **Settings → Pages**, choose **GitHub Actions** as the build source.
3. In **Settings → Secrets and variables → Actions → Variables**, create `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the values above. These are public client configuration protected by database policies, not admin credentials.
4. Push to `main`, or run **Actions → Deploy Pro Fitness to GitHub Pages → Run workflow**. If your default branch has another name, update the workflow's branch filter.
5. The workflow runs the tests, bundles the client, and deploys `dist/`. GitHub shows the website address on the successful deployment. Assets use relative paths and navigation uses hash routes, so repository-path hosting requires no rewrite or custom 404 page.
6. Add the final address to Supabase's Site URL and Redirect URLs before testing email flows. Re-run the deployment after changing the GitHub variables; configuration is embedded at build time.

With no Supabase variables, the public site still builds and displays an honest “Online member access is coming soon” message with disabled authentication submission. It never simulates a successful account.

## Local development

Requires Node.js 22 or newer.

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env with your project URL and public key.
npm run build:local
npm run preview
```

Open http://127.0.0.1:4173/. To preview only the public site without configuration, use `npm run build` followed by `npm run preview`. Environment files are excluded from Git. Build output contains the public URL and publishable key; this is expected.

## Activate or renew a membership

Registration creates a **pending** profile. It does not record payment or grant an active gym membership. Only the gym owner or authorized staff with Supabase administrative access should change membership fields.

In Supabase's **Table Editor → profiles**, find the member by their account ID (match against **Authentication → Users**). After verifying payment, set `membership_status` to `active` and `valid_until` to the agreed expiry date. Set `expired` if needed. Members can edit their name and home branch only. There is no public staff/admin route.

Membership fee and monthly rate are separate: PHP 1,500 and PHP 1,800. No fee duration, online payment, class inclusion, or cross-branch entitlement is assumed. Coach enquiries and job applications open the user's email app; they are not silently sent.

## Verify before accepting real members

- Register a test account, receive its confirmation email, and sign in.
- Verify a second account cannot read/change the first account's profile or workouts; policies also run in automated PostgreSQL tests.
- Edit a profile, add/delete a workout, refresh, sign out, and check that direct `#member` links require sign-in.
- Complete password recovery from an actual delivered email. Repeat confirmation and recovery on another browser/device.
- Activate a test membership as staff and verify the member sees the correct status and expiry.
- Confirm branch availability of the supplied GX timetable and coaches with reception. The original class poster does not specify a branch.

Automated browser tests use a mocked Supabase API, so passing tests do not verify your project's credentials, live email delivery, or actual deployment. The SQL schema is executed and tested with a local PostgreSQL engine (PGlite).

## Verification commands

```powershell
npm test
npm run build
npm run preview
# In a second terminal, use an installed Chrome browser:
$env:BROWSER_CHANNEL='chrome'
npm run test:browser
```

Alternatively run `npx playwright install chromium`, then `npm run test:browser`. Screenshots are saved in ignored `test-results/`. The old prototype is retained as source history and its checks can be run with `npm run test:legacy`; none of its sample records or scripts are shipped.
