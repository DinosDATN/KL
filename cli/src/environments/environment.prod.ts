// Production environment configuration
export const environment = {
  production: true,
  apiUrl: '/api/v1', // Relative URL - will be proxied by Nginx
  socketUrl: '', // Empty string = same origin (will use Nginx proxy)
  apiTimeout: 15000, // 15 seconds timeout for production
  enableLogging: false
};
