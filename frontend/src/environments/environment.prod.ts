/**
 * Environment configuration for production builds
 * Used when building for Docker or production deployment
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api'  // Relative URL for Docker (nginx will proxy to backend)
};
