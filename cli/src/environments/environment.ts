// Development environment configuration
export const environment = {
  production: false,
  apiUrl: '/api/v1', // ✅ Relative URL - will be proxied to http://localhost:3000
  apiTimeout: 10000, // 10 seconds timeout
  enableLogging: true
};
