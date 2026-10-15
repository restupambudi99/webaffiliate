/// <reference types="astro/client" />
/// <reference types="emdash/locals" />

interface ImportMetaEnv {
  readonly STAGING_PREVIEW?: string;
  readonly SITE_URL?: string;
  readonly EMDASH_SITE_URL?: string;
  readonly AMAZON_ASSOCIATE_TAG?: string;
  readonly AFFILIATE_MODE?: string;
  readonly AMAZON_SITE_REGISTERED?: string;
  readonly CONTACT_EMAIL?: string;
}

interface ImportMeta { readonly env: ImportMetaEnv; }
