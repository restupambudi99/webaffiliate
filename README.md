# Desk Edit

Independent home workspace publication built with **Astro 6 + EmDash CMS 1.2**. Custom editorial theme with responsive layouts, live CMS content, practical buying guides, category filters, search, comparisons, and policy pages.

Brand: **Desk Edit** · Audience: English-speaking US home-office readers · Contact: `nikolasjuan34@gmail.com`.

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

## Cloudflare hosting

The Cloudflare build uses Workers + D1 (`DB`) + R2 (`MEDIA`) and KV for CMS authentication sessions. It uses no Cloudflare Images binding. A custom domain can be added later; Workers supplies a `workers.dev` address first.

```sh
npx wrangler login
npm run build:cloudflare
npx wrangler secret put EMDASH_ENCRYPTION_KEY
npx wrangler deploy
```

Use the **generated key from your ignored `.env`** as the Worker secret. Never commit it, and keep a backup. Configure `SITE_URL` and `EMDASH_SITE_URL` to the final Workers origin before owner onboarding. See [complete CMS/deployment instructions](docs/CMS.md).

Cloudflare authentication and owner passkey setup require the owner's account. The separate private online design preview is a static preview and does not host the CMS admin.

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
