/**
 * Environment configuration for Docker builds
 * Used when building specifically for Docker containers
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api'  // Relative URL - nginx will proxy to backend container
};
