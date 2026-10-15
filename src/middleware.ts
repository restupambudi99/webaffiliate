import { defineMiddleware } from 'astro:middleware';
import { cmsBootstrapResponse } from './lib/cms-bootstrap';
import { mcpCanonicalResponse } from './lib/mcp-access';

export const onRequest = defineMiddleware((context, next) => {
  const canonicalMcp = mcpCanonicalResponse(context.request);
  if (canonicalMcp) return canonicalMcp;
  // Local development remains available. Public Node deployments start closed
  // until the owner is present to register their own passkey.
  if (import.meta.env.PROD) {
    const hold = cmsBootstrapResponse(context.request, {
      CMS_ADMIN_ENABLED: process.env.CMS_ADMIN_ENABLED,
    });
    if (hold) return hold;
  }
  return next();
});
