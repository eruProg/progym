# Publish eruProg/progym

Prepared for the public repository https://github.com/eruProg/progym and Supabase project `iavtrbzholgceynvunmd`.

The expected website address is https://eruprog.github.io/progym/. It becomes available after a successful Pages deployment.

## Already checked

The supplied publishable key is accepted by Supabase. Email authentication and new-user registration are enabled; email confirmation is required. The `profiles` table exists and refuses anonymous reads. These checks do not confirm the complete database schema or production email delivery. Do not re-run the creation SQL if you already ran it successfully.

## Initialize GitHub

1. Open https://github.com/eruProg/progym while signed in to GitHub.
2. If the repository is empty, click **creating a new file** in the Quick setup area.
3. Enter `README.md` as the filename, type `Pro Fitness Gym`, and choose **Commit changes**. Commit to `main`.

## Add the connection settings

1. Open https://github.com/eruProg/progym/settings/variables/actions.
2. Under **Variables → Repository variables**, select **New repository variable**.
3. Name: `SUPABASE_URL`. Value: `https://iavtrbzholgceynvunmd.supabase.co`. Choose **Add variable**.
4. Add another repository variable. Name: `SUPABASE_ANON_KEY`. Value: `sb_publishable_dE-q9dgQR5FGn0UIij5oRQ_btJGaQ-i`.
5. The variable name intentionally remains `SUPABASE_ANON_KEY` even though its value is a newer publishable key. The build reads that exact name. Use the **Variables** tab, not Secrets.

## Enable Pages

1. Open https://github.com/eruProg/progym/settings/pages.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Do not choose a suggested starter workflow; the project already includes one.

## Set the sign-in redirect

1. Open https://supabase.com/dashboard/project/iavtrbzholgceynvunmd/auth/url-configuration.
2. Set **Site URL** to `https://eruprog.github.io/progym/` and save.
3. Under **Redirect URLs**, choose **Add URL**, enter the same address, and save it.
4. Keep the trailing slash and the `/progym/` path. The project URL ending in `.supabase.co` is not your website's Site URL.

## Upload the website source

1. Download the updated `pro-fitness-github-ready.zip` delivered in this chat.
2. In Windows File Explorer, right-click it and choose **Extract All**.
3. Open the extracted folder that directly contains `package.json`.
4. Open https://github.com/eruProg/progym. Select **Add file → Upload files**.
5. Drag the files and folders inside the extracted folder into GitHub. Do not drag the ZIP or an enclosing folder. Include `.github`, `public`, `scripts`, `tests`, `supabase`, `docs`, `package.json`, and `package-lock.json`.
6. Enter `Publish Pro Fitness member website` as the commit message and commit directly to `main`.
7. On the repository's Code page, confirm `package.json` is at the top level. Open `.github → workflows → deploy.yml` to confirm the workflow was uploaded. Dot-prefixed files/folders can be easy to overlook in file pickers.

## Deploy and open

1. Open https://github.com/eruProg/progym/actions.
2. Open **Deploy Pro Fitness to GitHub Pages**, then the latest run.
3. Wait until both **build** and **deploy** show green checks.
4. If no run started, select the workflow, click **Run workflow**, choose `main`, and run it.
5. Open https://eruprog.github.io/progym/ after deployment succeeds. If it initially returns 404, allow a few minutes for Pages to become available.
6. If the run fails, open the red job and failed step. Check the log before changing anything. `npm ci` depends on uploading the lockfile; Pages deployment depends on Source being set to GitHub Actions; member access depends on both repository variables being present.
7. If you add or change variables after a build, start a new workflow run. GitHub variables are embedded into the JavaScript during the build.

## Configure email for real members

Supabase's default email service restricts recipients to project organization members and is for testing. It is not sufficient for arbitrary gym members. Keep email confirmation enabled and configure custom SMTP before launch.

1. Open the project's **Authentication → Email** area and find **SMTP Settings**. Depending on the dashboard layout this may appear as **Custom SMTP**.
2. Choose an email service that supports SMTP. Complete its sender/domain verification; the required DNS entries are specific to that service and your domain.
3. Copy the service's SMTP host, port, username, and SMTP password into Supabase. Use the service's SMTP credentials, not your Supabase database password.
4. Set the sender email to the verified address and sender name to `Pro Fitness Gym`.
5. Enable custom SMTP and save. Check the authentication email rate limit against your expected signup volume.
6. Leave Supabase's confirmation and recovery link templates at their defaults unless deliberately configuring another flow.

Official SMTP instructions: https://supabase.com/docs/guides/auth/auth-smtp.

## Test registration

1. Open https://eruprog.github.io/progym/#signup.
2. Enter a name, an email you control, a password of at least 12 characters, the branch, and the matching confirmation password.
3. Click **Create account**. If SMTP is not yet configured, use the email associated with your Supabase organization account for this initial test.
4. Open the confirmation email (also check spam), click its link, then sign in if prompted.
5. Verify the private dashboard shows your name and **Pending activation**. A new account does not automatically become a paid gym membership.
6. Add a workout, reload, and verify it remains. Sign out and reopen `#member` to confirm sign-in is required.
7. Test **Forgot password?** and follow the delivered reset link.
8. In Supabase **Table Editor → profiles**, verify the test user's row exists. An authorized staff member can set `membership_status` to `active` and enter the agreed `valid_until` date after payment. Members cannot change those fields themselves.

If confirmation or signup fails, inspect Authentication logs and SMTP delivery. If signup succeeds but the dashboard reports a missing profile, check that the complete supplied schema and signup trigger were installed. Never grant anonymous access to private member tables to work around that error.
