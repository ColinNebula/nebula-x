/**
 * Azure Application Insights Configuration
 * Get your Instrumentation Key from: https://portal.azure.com/
 *
 * Setup:
 * 1. Go to Azure Portal → Create Application Insights resource
 * 2. Copy the Instrumentation Key from Overview
 * 3. Add to .env: REACT_APP_APPINSIGHTS_KEY=your-key-here
 */

export interface AppInsightsConfig {
  instrumentationKey: string;
  enableAutoRouteTracking: boolean;
  enableRequestHeaderTracking: boolean;
  enableResponseHeaderTracking: boolean;
  disableFetchTracking: boolean;
  enableCorsCorrelation: boolean;
  enableDebug: boolean;
  maxBatchInterval: number;
  disableExceptionTracking: boolean;
}

const appInsightsConfig: AppInsightsConfig = {
  // Get from Azure Portal → Application Insights → Overview
  instrumentationKey: process.env.REACT_APP_APPINSIGHTS_KEY || '',

  // Auto-track SPA route changes
  enableAutoRouteTracking: true,

  // Track request/response headers
  enableRequestHeaderTracking: true,
  enableResponseHeaderTracking: true,

  // Track fetch/XHR calls
  disableFetchTracking: false,

  // CORS correlation for distributed tracing
  enableCorsCorrelation: true,

  // Debug mode (disable in production)
  enableDebug: process.env.NODE_ENV === 'development',

  // Batch telemetry every 15 seconds
  maxBatchInterval: 15000,

  // Track exceptions
  disableExceptionTracking: false,
};

export default appInsightsConfig;
