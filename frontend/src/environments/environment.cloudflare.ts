/**
 * Environment configuration for Cloudflare Pages builds
 * Frontend and backend are on different origins, so this must be an absolute URL
 * pointing at the Render-hosted backend. Update if the Render service name/URL changes.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://pomowatch-api.onrender.com/api'
};
