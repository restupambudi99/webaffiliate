import { defineMiddleware } from 'astro:middleware';
import { cmsBootstrapResponse } from './lib/cms-bootstrap';
import { mcpCanonicalResponse } from './lib/mcp-access';
import { passwordLoginRedirect } from './auth/password-policy';

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
  const passwordLogin = passwordLoginRedirect(context.request);
  if (passwordLogin) return passwordLogin;
  return next();
});
