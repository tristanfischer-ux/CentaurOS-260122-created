/**
 * Environment Configuration
 *
 * Centralized configuration management for the app.
 * Supports local development, staging, and production environments.
 *
 * When ready for production:
 * 1. Set up environment variables in EAS Build
 * 2. Update .env.local for local development
 * 3. Configure secrets in your CI/CD pipeline
 */

// Environment type
export type Environment = 'development' | 'staging' | 'production';

// Feature flags for gradual rollout
export interface FeatureFlags {
  enableBackendSync: boolean;
  enablePushNotifications: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enableOfflineMode: boolean;
  enableBiometricAuth: boolean;
  enableRevenueCat: boolean;
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Auth Configuration
export interface AuthConfig {
  provider: 'local' | 'supabase' | 'clerk' | 'firebase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  clerkPublishableKey?: string;
}

// Analytics Configuration
export interface AnalyticsConfig {
  enabled: boolean;
  mixpanelToken?: string;
  amplitudeApiKey?: string;
  posthogApiKey?: string;
  posthogHost?: string;
}

// Error Tracking Configuration
export interface ErrorTrackingConfig {
  enabled: boolean;
  sentryDsn?: string;
  environment: Environment;
}

// Payments Configuration
export interface PaymentsConfig {
  enabled: boolean;
  revenueCatApiKey?: string;
}

// Full App Configuration
export interface AppConfig {
  environment: Environment;
  appName: string;
  appVersion: string;
  buildNumber: string;
  api: ApiConfig;
  auth: AuthConfig;
  analytics: AnalyticsConfig;
  errorTracking: ErrorTrackingConfig;
  payments: PaymentsConfig;
  features: FeatureFlags;
}

/**
 * Get environment from Expo constants or environment variables
 */
function getEnvironment(): Environment {
  // Check for explicit environment variable
  const envVar = process.env.EXPO_PUBLIC_APP_ENV || process.env.NODE_ENV;

  if (envVar === 'production') return 'production';
  if (envVar === 'staging') return 'staging';
  return 'development';
}

/**
 * Development configuration
 * Used when running locally with `npx expo start`
 */
const developmentConfig: AppConfig = {
  environment: 'development',
  appName: 'Centaur OS (Dev)',
  appVersion: '1.0.0',
  buildNumber: '1',
  api: {
    baseUrl: 'http://localhost:3000/api', // Local backend or mock
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  auth: {
    provider: 'local', // Use local mock auth in development
    // Uncomment when ready:
    // provider: 'supabase',
    // supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    // supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  analytics: {
    enabled: false, // Disable in development
  },
  errorTracking: {
    enabled: false, // Disable in development
    environment: 'development',
  },
  payments: {
    enabled: false, // Disable in development
  },
  features: {
    enableBackendSync: false, // Use local storage in development
    enablePushNotifications: false,
    enableAnalytics: false,
    enableCrashReporting: false,
    enableOfflineMode: true,
    enableBiometricAuth: false,
    enableRevenueCat: false,
  },
};

/**
 * Staging configuration
 * Used for TestFlight/internal testing builds
 */
const stagingConfig: AppConfig = {
  environment: 'staging',
  appName: 'Centaur OS (Staging)',
  appVersion: '1.0.0',
  buildNumber: '1',
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.centauros.app',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  auth: {
    provider: 'supabase',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  analytics: {
    enabled: true,
    posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
    posthogHost: 'https://app.posthog.com',
  },
  errorTracking: {
    enabled: true,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: 'staging',
  },
  payments: {
    enabled: true,
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
  },
  features: {
    enableBackendSync: true,
    enablePushNotifications: true,
    enableAnalytics: true,
    enableCrashReporting: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableRevenueCat: true,
  },
};

/**
 * Production configuration
 * Used for App Store builds
 */
const productionConfig: AppConfig = {
  environment: 'production',
  appName: 'Centaur OS',
  appVersion: '1.0.0',
  buildNumber: '1',
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.centauros.app',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  auth: {
    provider: 'supabase',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  analytics: {
    enabled: true,
    posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
    posthogHost: 'https://app.posthog.com',
  },
  errorTracking: {
    enabled: true,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: 'production',
  },
  payments: {
    enabled: true,
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
  },
  features: {
    enableBackendSync: true,
    enablePushNotifications: true,
    enableAnalytics: true,
    enableCrashReporting: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableRevenueCat: true,
  },
};

/**
 * Get the current configuration based on environment
 */
export function getConfig(): AppConfig {
  const env = getEnvironment();

  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    default:
      return developmentConfig;
  }
}

// Export singleton config instance
export const config = getConfig();

// Helper functions
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';
export const isProduction = () => config.environment === 'production';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return config.features[feature] ?? false;
};
