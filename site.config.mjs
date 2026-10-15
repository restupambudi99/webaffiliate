export const productionOrigin = 'https://affiliate.restupambudi.my.id';
export const productionHostname = new URL(productionOrigin).hostname;

/** Redirect only this site's HTTP hostname, preserving path and query.
 * @param {string} inputUrl
 */
export function httpsRedirectDestination(inputUrl) {
  const url = new URL(inputUrl);
  if (url.hostname !== productionHostname || url.protocol !== 'http:') return undefined;
  url.protocol = 'https:';
  url.port = '';
  return url.href;
}
