# Pro Fitness Gym — member website

A responsive gym website with the supplied Pro Fitness logo, coach profiles, weekday GX schedule, Cainta recruitment details, and a private member portal.

- Membership fee: **PHP 1,500**; monthly rate: **PHP 1,800**.
- Email registration, confirmation, sign-in, sign-out, and password recovery through Supabase.
- Private dashboard with membership status, home branch, profile editing, and personal workout logs.
- Database policies isolate member records and prevent self-activation of paid memberships.
- GitHub Actions builds and publishes to GitHub Pages, including repository subpaths.

## Get started

Requires Node.js 22+.

```sh
npm ci
npm test
npm run build
npm run preview
```

Open http://127.0.0.1:4173/. Without backend configuration, public pages work and member access clearly shows that it is not available yet.

**Follow [the deployment guide](docs/DEPLOYMENT.md) to create your Supabase project, configure email sign-in, and publish from GitHub.** Run [supabase/schema.sql](supabase/schema.sql) once in the new Supabase SQL Editor. No Supabase project or GitHub deployment is created by building locally.

## Source

- `public/site.js` — pages, navigation, and member interactions
- `public/member-api.js` — Supabase authentication and member data access
- `public/content.js` — supplied gym content and validation
- `public/site.css`, `public/styles.css` — responsive presentation
- `public/images/` — supplied logo, posters, and lobby photography
- `supabase/schema.sql` — tables, automatic profile creation, grants, and RLS policies
- `.github/workflows/deploy.yml` — GitHub Pages deployment
- `docs/IMPLEMENTATION.md` — design and acceptance criteria

The browser does not store passwords. Supabase manages sessions and token refresh. Membership payment/activation happens at the gym; the website does not process payments. Staff update membership status through authorized Supabase access. Enquiry/application buttons open email drafts.

Coaching credentials and recruitment requirements are transcribed from the supplied artwork. Ashley, Micko, and JL John appear in the class schedule; Domz and Paul have coach profiles. The schedule does not assume a branch because the original poster does not identify one.

## Verification

`npm test` runs validation and actual PostgreSQL row-policy tests via PGlite. `npm run test:browser` tests desktop/mobile layouts and authentication/dashboard flows against a mocked API; start the preview server first. See the deployment guide for browser setup and the live email/account verification steps.

The prior prototype source (`seed.js`, `domain.js`, `views.js`, `app.js`) is retained for reference but excluded from the live bundle and build. Its synthetic members, public staff controls, and local demo transactions are not part of the member service. The historical `OWNER_PITCH.md` describes that earlier prototype, not the current implementation.
