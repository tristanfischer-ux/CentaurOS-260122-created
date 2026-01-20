/**
 * Currency Localization System
 *
 * Provides consistent currency formatting across the app based on user's locale/country.
 * Supports automatic detection and manual override.
 */

import { NativeModules, Platform } from 'react-native';

// Get device locale
function getDeviceLocale(): string {
  try {
    if (Platform.OS === 'ios') {
      return (
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en-GB'
      );
    } else {
      return NativeModules.I18nManager?.localeIdentifier || 'en_GB';
    }
  } catch {
    return 'en-GB';
  }
}

// Supported currencies with their properties
export interface CurrencyInfo {
  code: string;        // ISO 4217 code (USD, GBP, EUR, etc.)
  symbol: string;      // Display symbol ($, £, €, etc.)
  name: string;        // Full name
  position: 'before' | 'after';  // Symbol position relative to amount
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    position: 'before',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    decimalPlaces: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 0,
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: "'",
    decimalPlaces: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    decimalPlaces: 2,
  },
};

// Map country codes to their default currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // United Kingdom
  GB: 'GBP',
  UK: 'GBP',

  // United States
  US: 'USD',

  // Eurozone
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  BE: 'EUR', // Belgium
  AT: 'EUR', // Austria
  PT: 'EUR', // Portugal
  IE: 'EUR', // Ireland
  FI: 'EUR', // Finland
  GR: 'EUR', // Greece

  // Other
  AU: 'AUD', // Australia
  CA: 'CAD', // Canada
  JP: 'JPY', // Japan
  CH: 'CHF', // Switzerland
  IN: 'INR', // India
  SG: 'SGD', // Singapore
  NZ: 'NZD', // New Zealand
};

// Default currency if we can't detect
const DEFAULT_CURRENCY = 'GBP';

/**
 * Detect user's currency based on device locale
 */
export function detectUserCurrency(): string {
  try {
    const locale = getDeviceLocale();

    // Parse locale string (e.g., "en_GB", "en-US", "de_DE")
    // Replace underscores with hyphens for consistency
    const normalizedLocale = locale.replace('_', '-');
    const parts = normalizedLocale.split('-');

    if (parts.length >= 2) {
      // Get the region code (last part, e.g., "GB" from "en-GB")
      const regionCode = parts[parts.length - 1].toUpperCase();
      const currency = COUNTRY_TO_CURRENCY[regionCode];

      if (currency && SUPPORTED_CURRENCIES[currency]) {
        return currency;
      }
    }

    // Try first part as region code for simple locales
    if (parts.length === 1) {
      const regionCode = parts[0].toUpperCase();
      const currency = COUNTRY_TO_CURRENCY[regionCode];
      if (currency && SUPPORTED_CURRENCIES[currency]) {
        return currency;
      }
    }
  } catch (error) {
    console.warn('[Currency] Failed to detect locale:', error);
  }

  return DEFAULT_CURRENCY;
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const info = getCurrencyInfo(code);
  return info.symbol;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  }
): string {
  const { showSymbol = true, showCode = false, compact = false } = options || {};
  const info = getCurrencyInfo(currencyCode);

  // Handle compact formatting for large numbers
  let formattedAmount: string;
  let suffix = '';

  if (compact && Math.abs(amount) >= 1000000) {
    formattedAmount = (amount / 1000000).toFixed(1);
    suffix = 'M';
  } else if (compact && Math.abs(amount) >= 1000) {
    formattedAmount = (amount / 1000).toFixed(1);
    suffix = 'K';
  } else {
    // Format with proper decimal places and separators
    const fixed = amount.toFixed(info.decimalPlaces);
    const [whole, decimal] = fixed.split('.');

    // Add thousands separator
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandsSeparator);

    formattedAmount = decimal
      ? `${formattedWhole}${info.decimalSeparator}${decimal}`
      : formattedWhole;
  }

  // Build the final string
  let result = formattedAmount + suffix;

  if (showSymbol) {
    result = info.position === 'before'
      ? `${info.symbol}${result}`
      : `${result}${info.symbol}`;
  }

  if (showCode) {
    result = `${result} ${info.code}`;
  }

  return result;
}

/**
 * Format currency for display in forms (just symbol)
 */
export function formatCurrencyInput(amount: number | string, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;

  if (info.position === 'before') {
    return `${info.symbol}${numAmount.toLocaleString()}`;
  }
  return `${numAmount.toLocaleString()}${info.symbol}`;
}

/**
 * Get list of supported currencies for picker
 */
export function getSupportedCurrencyList(): Array<{ code: string; label: string; symbol: string }> {
  return Object.values(SUPPORTED_CURRENCIES).map(currency => ({
    code: currency.code,
    label: `${currency.name} (${currency.symbol})`,
    symbol: currency.symbol,
  }));
}

/**
 * Parse a currency string to number (removes symbol and formatting)
 */
export function parseCurrencyInput(input: string, currencyCode: string): number {
  const info = getCurrencyInfo(currencyCode);

  // Remove currency symbol and any non-numeric characters except decimal separator
  let cleaned = input
    .replace(info.symbol, '')
    .replace(new RegExp(`\\${info.thousandsSeparator}`, 'g'), '')
    .trim();

  // Convert decimal separator to standard period
  if (info.decimalSeparator !== '.') {
    cleaned = cleaned.replace(info.decimalSeparator, '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
