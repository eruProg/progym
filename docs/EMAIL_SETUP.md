# Fix confirmation email delivery

The observed Supabase `/signup` failure is Resend SMTP error 550: the test sender can only send to the Resend account owner's email. A `vercel.app` website URL does not provide a domain you can verify for sending mail.

## Public member registration with Resend

1. Use a domain you own and can manage in DNS. The website can remain on Vercel's free address.
2. In Resend, open **Domains → Add domain**. Add the DNS records Resend displays at your domain's DNS provider.
3. Wait until Resend marks the domain verified.
4. In Supabase, open **Authentication → Emails → SMTP Settings**.
5. Set the sender email to an address at that verified domain, such as `members@YOUR-DOMAIN`, and sender name to **Pro Fitness Gym**.
6. Use host `smtp.resend.com`, port `465`, username `resend`, and a Resend API key as the SMTP password. Do not use the Supabase key here. Save.
7. Keep the default confirmation and recovery templates. Configure Site URL and Redirect URLs with your exact production website address, ending in `/`.
8. Register with an email you control. Confirm the email, sign in, and test password recovery. Inspect both Supabase Auth logs and Resend logs if delivery fails.

## Current demo setting

The owner approved disabling Confirm email on 12 October 2026. Registration and a fresh password sign-in were verified against the live Supabase project. This is a project setting, not a frontend bypass. Resend delivery remains restricted.

## Testing before you have a domain

You may test email delivery using the Resend account owner's own inbox. Other recipients remain blocked until the sender domain is verified.

Alternatively, the project owner can temporarily disable **Confirm email** under **Authentication → Sign In / Providers**. New accounts then sign in without proving ownership of their email address. This is a security tradeoff for a controlled demo, not a repair to email delivery. Password-reset emails still need working SMTP. Restore email confirmation before accepting public member registrations.

After email delivery is fixed, the website's **Resend confirmation email** link requests a fresh link for unconfirmed accounts. If no account exists because signup was rolled back, register again.

Sources: [Resend SMTP](https://resend.com/docs/send-with-smtp), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
