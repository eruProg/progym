# Vercel and Supabase setup

## Administration

Use the footer **Admin portal** link or `/#admin` on Vercel. Follow [admin setup](ADMIN_SETUP.md) to install permissions and provision staff accounts. Members cannot change their own activation or expiry. Supabase Table Editor remains available to the project owner.

## Deploy on Vercel

1. Sign in at https://vercel.com and choose **Add New → Project**.
2. Connect GitHub if asked, find `eruProg/progym`, and click **Import**.
3. Use the repository root (`./`) as **Root Directory**, **Other** as the framework, and Node.js 22.x in project settings. The committed `vercel.json` sets **Install Command** to `npm ci`, **Build Command** to `npm run build`, and **Output Directory** to `dist`.
4. Expand **Environment Variables** and add both values for **Production**. GitHub Actions variables are not automatically copied into Vercel:

   ```dotenv
   SUPABASE_URL=https://iavtrbzholgceynvunmd.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_dE-q9dgQR5FGn0UIij5oRQ_btJGaQ-i
   ```

5. Click **Deploy**. When it succeeds, open the project's **Domains** settings and copy the stable production domain. Use this domain, not a temporary deployment/preview URL, for the following Supabase settings.
6. If you add or change variables after deployment, choose **Deployments → latest deployment → Redeploy**. The build embeds these variables in the client bundle.

Routes use URL fragments such as `/#signup` and `/#member`. No SPA rewrite rule is needed. Deployment to Vercel does not remove the existing GitHub Pages site.

## Finish Supabase

1. Open **Table Editor** and confirm `profiles` and `workouts` exist. If you already ran `supabase/schema.sql` successfully, do not rerun it. If neither exists, run the full file once in **SQL Editor**. If setup previously failed or only one table exists, inspect the error instead of rerunning blindly.
2. Open **Authentication → Sign In / Providers**. Enable **Allow new users to sign up**. Under **Email**, enable email sign-in and **Confirm email**, set the minimum password length to 12, and save.
3. Open **Authentication → URL Configuration**. Set **Site URL** to your exact Vercel production address with a trailing slash, for example `https://YOUR-PROJECT.vercel.app/`. Replace the placeholder with the actual domain Vercel assigned. Do not enter the `.supabase.co` address or append the GitHub `/progym/` path.
4. Under **Redirect URLs**, add the same Vercel production address and save. Retain `https://eruprog.github.io/progym/` only if you also want sign-in to keep working on the existing GitHub Pages site. Local testing can use `http://127.0.0.1:4173/`.
5. Configure email delivery: open **Authentication → Email → SMTP Settings**, or **Custom SMTP** if shown separately. Use an email service supporting SMTP, verify your sender/domain with that service, then enter its SMTP host, port, username, password, sender email, and sender name (`Pro Fitness Gym`). Enable custom SMTP and save. Use the email service's credentials, not your database password. Supabase's default mail service is restricted to organization-member testing, so custom SMTP is needed for general gym members.
6. Keep the default confirmation and password-recovery email links. They are handled by the app at the root URL. Email templates should retain the Supabase confirmation URL rather than point directly at `/#member`.
7. Open the production website at `/#signup`. Register using an email you control and a password of at least 12 characters. Open the confirmation email, follow its link, and sign in if asked.
8. Verify the dashboard shows your name and **Pending activation**. In **Authentication → Users**, confirm the account exists; in **Table Editor → profiles**, confirm the matching profile exists. Log a workout, reload, and check that it remains.
9. Sign out and test **Forgot password?**. Follow the reset email link, choose a new password, and sign in again. Test with another real email after custom SMTP is configured.
10. For an activation test, use the authorized staff workflow above. Refresh the member dashboard to verify the status and expiry changed.

Registration is ready for general members only after email confirmation, sign-in, and password recovery succeed on the production domain. A visible registration form alone does not verify email delivery.

## If something fails

- **Online member access is coming soon:** verify both Vercel environment variables and redeploy.
- **Error sending confirmation email:** open Logs, select Auth, and read the latest `/signup` error. If Resend says “You can only send testing emails to your own email address,” verify an owned domain in Resend and change Supabase’s sender email to that domain. The `resend.dev` test sender cannot deliver to general members. See [email troubleshooting](EMAIL_SETUP.md).
- **Email address not authorized / no confirmation email:** configure custom SMTP, inspect its delivery logs, and check spam.
- **Confirmation returns to the wrong website:** check Site URL, allowed Redirect URLs, and the domain used to request the email. Request a new email after correcting the settings.
- **Member profile not available:** verify the SQL schema and `on_member_signup` trigger were installed. Do not grant anonymous access to private tables.
- **Already exists when running SQL:** stop; the creation script is for a new database, not a repeatable migration.

References: [Vercel builds](https://vercel.com/docs/builds/configure-a-build), [Supabase Auth settings](https://supabase.com/docs/guides/auth/general-configuration), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
