import handler, { createScheduledHandler, PluginBridge } from '@emdash-cms/cloudflare/worker';
import { httpsRedirectDestination } from '../site.config.mjs';

export { PluginBridge };

const fetchRequest = async (request: Request, env: unknown, ctx: unknown): Promise<Response> => {
  const destination = httpsRedirectDestination(request.url);
  if (destination) return Response.redirect(destination, 308);
  if (!handler.fetch) return new Response('Server unavailable', { status: 503 });
  return handler.fetch(request, env, ctx);
};

export default {
  ...handler,
  fetch: fetchRequest,
  scheduled: createScheduledHandler(),
};
