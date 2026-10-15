# Desk Edit

Independent home workspace publication built with **Astro 6 + EmDash CMS 1.2**. Custom editorial theme with responsive layouts, live CMS content, practical buying guides, category filters, search, comparisons, and policy pages.

Brand: **Desk Edit** · Audience: English-speaking US home-office readers · Contact: `nikolasjuan34@gmail.com`.

Production hostname: **https://affiliate.restupambudi.my.id**. The primary deployment is the owner's existing Ubuntu 22.04 VPS, using Node 24.11, SQLite, and local media storage. Cloudflare provides DNS and SSL in front of the VPS. Verify the deployed origin, DNS routing, and TLS using the [VPS operations guide](docs/VPS.md) and [domain setup](docs/DOMAIN.md).

## Run locally

Requires Node 24 and npm. From the repository root:

```sh
npm ci
npm run cms:key
npm run seed:build
npm run dev:staging
```

Open `http://127.0.0.1:4321/` for the draft preview and `http://127.0.0.1:4321/_emdash/admin/` for the real EmDash setup. The owner registers a passkey through the official wizard. The seed contains **10 drafts**, never automatic public recommendations.

For production, use `STAGING_PREVIEW=false`, configure the real HTTPS origin, and publish reviewed articles through EmDash. Public routes read published revisions; saving a draft does not publish it.

```sh
npm run seed:validate
node scripts/test-safety.mjs
npm run check
npm run build
npm start
```

## Production hosting on the existing VPS

The server runs the Astro Node application with persistent SQLite content and a local uploads directory. Editors manage articles and upload images in the same **EmDash admin panel**. This deployment adds no media-service subscription or payment activation and requires no R2, Workers subscription, or external media server. It uses the VPS the owner already has.

Build with `npm run build` and run the standalone server behind the VPS HTTPS reverse proxy. Keep the application port bound to loopback. Set `SITE_URL` and `EMDASH_SITE_URL` to `https://affiliate.restupambudi.my.id`, and configure persistent `EMDASH_DATABASE_URL` and `EMDASH_UPLOADS_DIR` locations outside disposable build output. The service name, installed paths, and port are recorded in [VPS operations](docs/VPS.md) after provisioning. Back up the database, uploaded files, and encryption key together.

The production application starts with `CMS_ADMIN_ENABLED=false`, holding all `/_emdash` routes, including setup APIs and uploaded CMS media, until the owner is ready to register a passkey. Enable it for owner onboarding, then **leave it true after the owner account is created** so normal authentication, editing, and public CMS media work. Use false only for a deliberate maintenance hold; it also interrupts media delivery. Local development is unaffected by the production hold. There are no fabricated admin credentials.

Use the generated `EMDASH_ENCRYPTION_KEY` from the private environment configuration, keep a backup, and never commit it. See the [CMS and owner setup instructions](docs/CMS.md). The separate private online design preview is a static preview and does not host the CMS admin.

## Optional Cloudflare Workers scaffold

The repository retains an alternative Workers build scaffold with D1 content, R2 media, and KV authentication sessions. It is **not the production deployment** and is not required for the VPS. The experimental KV media adapter was not released; its consistency limitations ruled it out for this project. Do not activate paid Cloudflare services or deploy this alternative as part of the current VPS setup. `workers.dev` and preview URLs remain disabled in the scaffold.

## Editorial and monetization controls

- Original guide drafts, evidence labels, author/editor fields, sources, image-rights checks, conflict statement, and actual review date.
- EmDash publish/schedule hooks reject incomplete review data or unsupported hands-on testing claims.
- Default `AFFILIATE_MODE=editorial_only`; no example tags, Amazon pricing/ratings/images, or automatic redirects.
- Affiliate CTA requires the verified owner tag, a registered site, a reviewed product reference, and a direct HTTPS Amazon product URL. Disclosure appears beside each CTA.
- No visitor accounts, analytics, newsletter, tracking scripts, or misleading contact submission.
- Original illustrative assets; system typography; tiny JavaScript on public pages. The admin bundle loads on admin routes.

See [PRD implementation status](docs/PRD-CHECKLIST.md) and [asset provenance](docs/ASSETS.md). Review drafts, publisher/privacy details, and hosting configuration before public launch. Code completion is not Amazon application approval.

## Validation

Type checks and Node/Cloudflare builds; real EmDash seed validation; affiliate/publish-gate tests; browser QA at **360, 768, and 1440 px** covering images, overflow, navigation, filter, search, articles, 404, and CMS setup routes.
