// Production environment configuration
export const environment = {
  production: true,
  apiUrl: '/api/v1', // Relative URL - will be proxied by Nginx
  apiTimeout: 15000, // 15 seconds timeout for production
  enableLogging: false
};
