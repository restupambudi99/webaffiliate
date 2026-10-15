const mcpPath = '/_emdash/api/mcp';

/** EmDash's Bearer-only guard matches this exact path; aliases must not use session auth. */
export function mcpCanonicalResponse(request: Request): Response | undefined {
  const original = new URL(request.url).pathname;
  let decoded = original;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch { break; }
  }
  const normalized = decoded.replaceAll('\\', '/').replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  if (normalized !== mcpPath || original === mcpPath) return undefined;
  return new Response('Use the canonical MCP endpoint: /_emdash/api/mcp', {
    status: 400,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
