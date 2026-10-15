# Desk Edit

Independent home workspace publication built with **Astro 6 + EmDash CMS 1.2**. Custom editorial theme with responsive layouts, live CMS content, practical buying guides, category filters, search, comparisons, and policy pages.

Brand: **Desk Edit** · Audience: English-speaking US home-office readers · Contact: `nikolasjuan34@gmail.com`.

Production site: **[affiliate.restupambudi.my.id](https://affiliate.restupambudi.my.id)**. The application is deployed on the owner's Ubuntu 22.04 VPS with an isolated Node 24.16.0 runtime, SQLite, and local media storage. Cloudflare proxy and HTTPS are active; the public homepage returns HTTP 200 and HTTP requests redirect with 308 while preserving the path and query. The origin has a valid Let's Encrypt certificate. See [VPS operations](docs/VPS.md) and [domain setup](docs/DOMAIN.md).

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

The `desk-edit` systemd service runs as `deskedit`, from `/opt/desk-edit/app`, using `/opt/desk-edit/runtime/node/bin/node`. It listens on `127.0.0.1:4321` behind the VPS HTTPS reverse proxy. Persistent state is stored at `/var/lib/desk-edit`: `content.db`, `uploads/`, and `sessions/`. Set `EMDASH_SESSIONS_DIR` explicitly alongside the database and upload paths. CMS uploads are limited to **5 MiB per file**. Build and runtime must use the same paths and HTTPS origin. Back up the database, uploaded files, and private environment configuration together; see [VPS operations](docs/VPS.md).

The initial owner passkey is still pending. After the owner confirmed readiness, production was enabled behind a temporary OpenLiteSpeed authentication realm on `/_emdash/`: anonymous requests receive 401 and protected owner setup receives 200. Temporary access details are stored privately outside Git. Remove that realm only after the owner registers a passkey and verifies login, then **leave `CMS_ADMIN_ENABLED=true`** for normal authentication, editing, and public CMS media. The source default remains false for safe first deployments and deliberate maintenance; false also interrupts uploaded media. Local development is unaffected. No EmDash owner credentials are fabricated.

Use the generated `EMDASH_ENCRYPTION_KEY` from the private environment configuration, keep a backup, and never commit it. See the [CMS and owner setup instructions](docs/CMS.md). The separate private online design preview is a static preview and does not host the CMS admin.

## Optional Cloudflare Workers scaffold

The repository retains an alternative Workers build scaffold with D1 content, R2 media, and KV authentication sessions. It is **not the production deployment** and is not required for the VPS. Do not activate R2, paid Cloudflare services, or deploy this alternative as part of the current VPS setup. `workers.dev` and preview URLs remain disabled in the scaffold.

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
