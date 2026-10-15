import { defineMiddleware } from 'astro:middleware';
import { cmsBootstrapResponse } from './lib/cms-bootstrap';

export const onRequest = defineMiddleware((context, next) => {
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
