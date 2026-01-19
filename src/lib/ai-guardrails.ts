/**
 * AI Usage Guardrails System
 *
 * Protects against excessive AI API costs by implementing:
 * 1. Rate limiting (requests per minute/hour/day)
 * 2. Token budgets (daily/monthly limits)
 * 3. Per-user quotas
 * 4. Cost tracking and alerts
 * 5. Circuit breaker for runaway costs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AIGuardrailsConfig {
  // Rate limits
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;

  // Token limits (approximate)
  maxTokensPerDay: number;
  maxTokensPerMonth: number;

  // Cost limits (in cents to avoid floating point issues)
  dailyBudgetCents: number;
  monthlyBudgetCents: number;
  alertThresholdPercent: number; // Alert when reaching this % of budget

  // Circuit breaker
  costSpikeFactor: number; // If cost exceeds X times normal, pause
  circuitBreakerCooldownMinutes: number;

  // Per-user limits (for multi-tenant)
  maxRequestsPerUserPerDay: number;
  maxTokensPerUserPerDay: number;
}

// Default conservative limits
export const DEFAULT_GUARDRAILS_CONFIG: AIGuardrailsConfig = {
  // Rate limits - prevent accidental spam
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 500,

  // Token limits - GPT-4o-mini is ~$0.15 per 1M input tokens, ~$0.60 per 1M output
  // Conservative: ~100K tokens/day = ~$0.06-0.15/day
  maxTokensPerDay: 100000,
  maxTokensPerMonth: 2000000,

  // Cost limits
  dailyBudgetCents: 500,    // $5/day
  monthlyBudgetCents: 5000, // $50/month
  alertThresholdPercent: 80,

  // Circuit breaker - if spend in 1 hour exceeds 5x normal hourly average
  costSpikeFactor: 5,
  circuitBreakerCooldownMinutes: 30,

  // Per-user limits
  maxRequestsPerUserPerDay: 50,
  maxTokensPerUserPerDay: 20000,
};

// Model pricing (per 1M tokens, in cents)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 15, output: 60 },           // $0.15/$0.60 per 1M
  'gpt-4o': { input: 250, output: 1000 },             // $2.50/$10 per 1M
  'gpt-4-turbo': { input: 1000, output: 3000 },       // $10/$30 per 1M
  'claude-3-5-sonnet-20241022': { input: 300, output: 1500 }, // $3/$15 per 1M
  'claude-3-haiku-20240307': { input: 25, output: 125 },      // $0.25/$1.25 per 1M
  'gemini-1.5-flash': { input: 7.5, output: 30 },     // $0.075/$0.30 per 1M (free tier available)
  'gemini-1.5-pro': { input: 125, output: 500 },      // $1.25/$5 per 1M
  'whisper-1': { input: 6, output: 0 },               // $0.006 per minute (normalized to tokens)
  'google-speech-to-text': { input: 4, output: 0 },   // ~$0.004 per 15 seconds
};

// ============================================================================
// USAGE TRACKING
// ============================================================================

export interface AIUsageRecord {
  timestamp: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  endpoint: string;
  userId?: string;
  success: boolean;
  error?: string;
}

export interface AIUsageStats {
  // Current period stats
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsToday: number;
  tokensToday: number;
  tokensThisMonth: number;
  costTodayCents: number;
  costThisMonthCents: number;

  // Per-user stats (for current user)
  userRequestsToday: number;
  userTokensToday: number;

  // Circuit breaker state
  circuitBreakerTripped: boolean;
  circuitBreakerResetTime?: number;

  // Recent history
  recentRequests: AIUsageRecord[];

  // Alerts
  alerts: AIAlert[];
}

export interface AIAlert {
  id: string;
  type: 'budget_warning' | 'rate_limit' | 'circuit_breaker' | 'error_spike';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  USAGE_RECORDS: 'ai_usage_records',
  ALERTS: 'ai_alerts',
  CIRCUIT_BREAKER: 'ai_circuit_breaker',
  CONFIG: 'ai_guardrails_config',
};

// ============================================================================
// GUARDRAILS CLASS
// ============================================================================

class AIGuardrails {
  private config: AIGuardrailsConfig;
  private usageRecords: AIUsageRecord[] = [];
  private alerts: AIAlert[] = [];
  private circuitBreakerTripped: boolean = false;
  private circuitBreakerResetTime: number = 0;
  private initialized: boolean = false;

  constructor(config: AIGuardrailsConfig = DEFAULT_GUARDRAILS_CONFIG) {
    this.config = config;
  }

  // Initialize from storage
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load usage records (keep last 7 days)
      const recordsJson = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_RECORDS);
      if (recordsJson) {
        const allRecords: AIUsageRecord[] = JSON.parse(recordsJson);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.usageRecords = allRecords.filter(r => r.timestamp > sevenDaysAgo);
      }

      // Load alerts
      const alertsJson = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      if (alertsJson) {
        this.alerts = JSON.parse(alertsJson);
      }

      // Load circuit breaker state
      const cbJson = await AsyncStorage.getItem(STORAGE_KEYS.CIRCUIT_BREAKER);
      if (cbJson) {
        const cbState = JSON.parse(cbJson);
        this.circuitBreakerTripped = cbState.tripped;
        this.circuitBreakerResetTime = cbState.resetTime;

        // Auto-reset if cooldown passed
        if (this.circuitBreakerTripped && Date.now() > this.circuitBreakerResetTime) {
          this.circuitBreakerTripped = false;
          await this.saveCircuitBreakerState();
        }
      }

      // Load custom config if saved
      const configJson = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (configJson) {
        this.config = { ...DEFAULT_GUARDRAILS_CONFIG, ...JSON.parse(configJson) };
      }

      this.initialized = true;
      console.log('[AIGuardrails] Initialized with', this.usageRecords.length, 'records');
    } catch (error) {
      console.error('[AIGuardrails] Failed to initialize:', error);
      this.initialized = true; // Continue with defaults
    }
  }

  // Check if request is allowed
  async canMakeRequest(userId?: string): Promise<{ allowed: boolean; reason?: string }> {
    await this.initialize();

    // Check circuit breaker
    if (this.circuitBreakerTripped) {
      if (Date.now() < this.circuitBreakerResetTime) {
        const minutesRemaining = Math.ceil((this.circuitBreakerResetTime - Date.now()) / 60000);
        return {
          allowed: false,
          reason: `Circuit breaker active. AI calls paused for ${minutesRemaining} more minutes due to unusual cost spike.`,
        };
      } else {
        // Reset circuit breaker
        this.circuitBreakerTripped = false;
        await this.saveCircuitBreakerState();
      }
    }

    const stats = this.getStats(userId);

    // Check rate limits
    if (stats.requestsThisMinute >= this.config.maxRequestsPerMinute) {
      return { allowed: false, reason: 'Rate limit: Too many requests per minute. Please wait.' };
    }

    if (stats.requestsThisHour >= this.config.maxRequestsPerHour) {
      return { allowed: false, reason: 'Rate limit: Hourly request limit reached. Try again later.' };
    }

    if (stats.requestsToday >= this.config.maxRequestsPerDay) {
      return { allowed: false, reason: 'Rate limit: Daily request limit reached. Try again tomorrow.' };
    }

    // Check token limits
    if (stats.tokensToday >= this.config.maxTokensPerDay) {
      return { allowed: false, reason: 'Token limit: Daily token budget exhausted.' };
    }

    if (stats.tokensThisMonth >= this.config.maxTokensPerMonth) {
      return { allowed: false, reason: 'Token limit: Monthly token budget exhausted.' };
    }

    // Check cost limits
    if (stats.costTodayCents >= this.config.dailyBudgetCents) {
      return { allowed: false, reason: `Budget limit: Daily AI budget ($${(this.config.dailyBudgetCents / 100).toFixed(2)}) reached.` };
    }

    if (stats.costThisMonthCents >= this.config.monthlyBudgetCents) {
      return { allowed: false, reason: `Budget limit: Monthly AI budget ($${(this.config.monthlyBudgetCents / 100).toFixed(2)}) reached.` };
    }

    // Check per-user limits
    if (userId) {
      if (stats.userRequestsToday >= this.config.maxRequestsPerUserPerDay) {
        return { allowed: false, reason: 'Personal limit: Your daily AI request limit reached.' };
      }

      if (stats.userTokensToday >= this.config.maxTokensPerUserPerDay) {
        return { allowed: false, reason: 'Personal limit: Your daily token limit reached.' };
      }
    }

    // Check for budget warning
    const dailyBudgetPercent = (stats.costTodayCents / this.config.dailyBudgetCents) * 100;
    const monthlyBudgetPercent = (stats.costThisMonthCents / this.config.monthlyBudgetCents) * 100;

    if (dailyBudgetPercent >= this.config.alertThresholdPercent ||
        monthlyBudgetPercent >= this.config.alertThresholdPercent) {
      await this.addAlert({
        type: 'budget_warning',
        message: `AI budget at ${Math.max(dailyBudgetPercent, monthlyBudgetPercent).toFixed(0)}% of limit`,
      });
    }

    return { allowed: true };
  }

  // Record a completed request
  async recordUsage(record: Omit<AIUsageRecord, 'timestamp' | 'costCents'>): Promise<void> {
    await this.initialize();

    // Calculate cost
    const pricing = MODEL_PRICING[record.model] || MODEL_PRICING['gpt-4o-mini'];
    const costCents = Math.ceil(
      (record.inputTokens / 1000000) * pricing.input +
      (record.outputTokens / 1000000) * pricing.output
    );

    const fullRecord: AIUsageRecord = {
      ...record,
      timestamp: Date.now(),
      costCents,
    };

    this.usageRecords.push(fullRecord);

    // Check for cost spike (circuit breaker)
    await this.checkForCostSpike();

    // Save to storage
    await this.saveUsageRecords();

    console.log('[AIGuardrails] Recorded:', {
      model: record.model,
      tokens: record.inputTokens + record.outputTokens,
      costCents,
      success: record.success,
    });
  }

  // Get current stats
  getStats(userId?: string): AIUsageStats {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const requestsThisMinute = this.usageRecords.filter(r => r.timestamp > oneMinuteAgo).length;
    const requestsThisHour = this.usageRecords.filter(r => r.timestamp > oneHourAgo).length;
    const todayRecords = this.usageRecords.filter(r => r.timestamp > startOfDay);
    const monthRecords = this.usageRecords.filter(r => r.timestamp > startOfMonth);

    const requestsToday = todayRecords.length;
    const tokensToday = todayRecords.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
    const tokensThisMonth = monthRecords.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
    const costTodayCents = todayRecords.reduce((sum, r) => sum + r.costCents, 0);
    const costThisMonthCents = monthRecords.reduce((sum, r) => sum + r.costCents, 0);

    // Per-user stats
    const userTodayRecords = userId
      ? todayRecords.filter(r => r.userId === userId)
      : [];
    const userRequestsToday = userTodayRecords.length;
    const userTokensToday = userTodayRecords.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);

    return {
      requestsThisMinute,
      requestsThisHour,
      requestsToday,
      tokensToday,
      tokensThisMonth,
      costTodayCents,
      costThisMonthCents,
      userRequestsToday,
      userTokensToday,
      circuitBreakerTripped: this.circuitBreakerTripped,
      circuitBreakerResetTime: this.circuitBreakerTripped ? this.circuitBreakerResetTime : undefined,
      recentRequests: this.usageRecords.slice(-20).reverse(),
      alerts: this.alerts.filter(a => !a.acknowledged).slice(-10),
    };
  }

  // Get usage report for display
  getUsageReport(): {
    today: { requests: number; tokens: number; cost: string; budgetPercent: number };
    month: { requests: number; tokens: number; cost: string; budgetPercent: number };
    limits: { daily: string; monthly: string };
    status: 'ok' | 'warning' | 'critical' | 'blocked';
  } {
    const stats = this.getStats();

    const todayBudgetPercent = (stats.costTodayCents / this.config.dailyBudgetCents) * 100;
    const monthBudgetPercent = (stats.costThisMonthCents / this.config.monthlyBudgetCents) * 100;

    let status: 'ok' | 'warning' | 'critical' | 'blocked' = 'ok';
    if (stats.circuitBreakerTripped) {
      status = 'blocked';
    } else if (todayBudgetPercent >= 100 || monthBudgetPercent >= 100) {
      status = 'blocked';
    } else if (todayBudgetPercent >= 80 || monthBudgetPercent >= 80) {
      status = 'critical';
    } else if (todayBudgetPercent >= 50 || monthBudgetPercent >= 50) {
      status = 'warning';
    }

    return {
      today: {
        requests: stats.requestsToday,
        tokens: stats.tokensToday,
        cost: `$${(stats.costTodayCents / 100).toFixed(2)}`,
        budgetPercent: Math.round(todayBudgetPercent),
      },
      month: {
        requests: this.usageRecords.filter(r => r.timestamp > new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()).length,
        tokens: stats.tokensThisMonth,
        cost: `$${(stats.costThisMonthCents / 100).toFixed(2)}`,
        budgetPercent: Math.round(monthBudgetPercent),
      },
      limits: {
        daily: `$${(this.config.dailyBudgetCents / 100).toFixed(2)}`,
        monthly: `$${(this.config.monthlyBudgetCents / 100).toFixed(2)}`,
      },
      status,
    };
  }

  // Update configuration
  async updateConfig(newConfig: Partial<AIGuardrailsConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
  }

  // Get current config
  getConfig(): AIGuardrailsConfig {
    return { ...this.config };
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.saveAlerts();
    }
  }

  // Clear all alerts
  async clearAlerts(): Promise<void> {
    this.alerts = [];
    await this.saveAlerts();
  }

  // Reset daily counters (call at midnight)
  async resetDaily(): Promise<void> {
    // Records older than 7 days are already filtered on load
    // This is called to clear any cached state
    console.log('[AIGuardrails] Daily reset');
  }

  // Force reset circuit breaker (admin action)
  async resetCircuitBreaker(): Promise<void> {
    this.circuitBreakerTripped = false;
    this.circuitBreakerResetTime = 0;
    await this.saveCircuitBreakerState();
    console.log('[AIGuardrails] Circuit breaker manually reset');
  }

  // Private helpers

  private async checkForCostSpike(): Promise<void> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Get cost in the last hour
    const lastHourCost = this.usageRecords
      .filter(r => r.timestamp > oneHourAgo)
      .reduce((sum, r) => sum + r.costCents, 0);

    // Calculate average hourly cost over the last 7 days
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const totalCostLastWeek = this.usageRecords
      .filter(r => r.timestamp > sevenDaysAgo)
      .reduce((sum, r) => sum + r.costCents, 0);
    const avgHourlyCost = totalCostLastWeek / (7 * 24);

    // Trip circuit breaker if cost spike detected
    if (avgHourlyCost > 0 && lastHourCost > avgHourlyCost * this.config.costSpikeFactor) {
      this.circuitBreakerTripped = true;
      this.circuitBreakerResetTime = now + this.config.circuitBreakerCooldownMinutes * 60 * 1000;

      await this.saveCircuitBreakerState();
      await this.addAlert({
        type: 'circuit_breaker',
        message: `Circuit breaker tripped! Cost in last hour ($${(lastHourCost / 100).toFixed(2)}) is ${this.config.costSpikeFactor}x higher than average. AI calls paused for ${this.config.circuitBreakerCooldownMinutes} minutes.`,
      });

      console.warn('[AIGuardrails] CIRCUIT BREAKER TRIPPED:', {
        lastHourCost,
        avgHourlyCost,
        factor: lastHourCost / avgHourlyCost,
      });
    }
  }

  private async addAlert(alert: Omit<AIAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<void> {
    // Don't add duplicate alerts within 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const existingSimilar = this.alerts.find(
      a => a.type === alert.type && a.timestamp > oneHourAgo && !a.acknowledged
    );

    if (existingSimilar) return;

    this.alerts.push({
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
    });

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    await this.saveAlerts();
  }

  private async saveUsageRecords(): Promise<void> {
    try {
      // Keep only last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentRecords = this.usageRecords.filter(r => r.timestamp > sevenDaysAgo);
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_RECORDS, JSON.stringify(recentRecords));
    } catch (error) {
      console.error('[AIGuardrails] Failed to save usage records:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('[AIGuardrails] Failed to save alerts:', error);
    }
  }

  private async saveCircuitBreakerState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CIRCUIT_BREAKER, JSON.stringify({
        tripped: this.circuitBreakerTripped,
        resetTime: this.circuitBreakerResetTime,
      }));
    } catch (error) {
      console.error('[AIGuardrails] Failed to save circuit breaker state:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiGuardrails = new AIGuardrails();

// ============================================================================
// WRAPPER FUNCTION FOR API CALLS
// ============================================================================

export interface GuardedAICallOptions {
  model?: string;
  endpoint: string;
  userId?: string;
  estimatedInputTokens?: number;
}

export async function withAIGuardrails<T>(
  options: GuardedAICallOptions,
  apiCall: () => Promise<{ result: T; inputTokens: number; outputTokens: number }>
): Promise<T> {
  const { model = 'gpt-4o-mini', endpoint, userId, estimatedInputTokens = 0 } = options;

  // Check if allowed
  const { allowed, reason } = await aiGuardrails.canMakeRequest(userId);
  if (!allowed) {
    throw new Error(`AI request blocked: ${reason}`);
  }

  const startTime = Date.now();
  let success = false;
  let inputTokens = estimatedInputTokens;
  let outputTokens = 0;
  let errorMessage: string | undefined;

  try {
    const response = await apiCall();
    success = true;
    inputTokens = response.inputTokens;
    outputTokens = response.outputTokens;
    return response.result;
  } catch (error: any) {
    success = false;
    errorMessage = error.message;
    throw error;
  } finally {
    // Record usage regardless of success/failure
    await aiGuardrails.recordUsage({
      model,
      inputTokens,
      outputTokens,
      endpoint,
      userId,
      success,
      error: errorMessage,
    });
  }
}

// ============================================================================
// REACT HOOK FOR COMPONENTS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useAIGuardrails() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [report, setReport] = useState<ReturnType<typeof aiGuardrails.getUsageReport> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    await aiGuardrails.initialize();
    setStats(aiGuardrails.getStats());
    setReport(aiGuardrails.getUsageReport());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const canMakeRequest = useCallback(async (userId?: string) => {
    return aiGuardrails.canMakeRequest(userId);
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    await aiGuardrails.acknowledgeAlert(alertId);
    refresh();
  }, [refresh]);

  const resetCircuitBreaker = useCallback(async () => {
    await aiGuardrails.resetCircuitBreaker();
    refresh();
  }, [refresh]);

  const updateConfig = useCallback(async (config: Partial<AIGuardrailsConfig>) => {
    await aiGuardrails.updateConfig(config);
    refresh();
  }, [refresh]);

  return {
    stats,
    report,
    loading,
    refresh,
    canMakeRequest,
    acknowledgeAlert,
    resetCircuitBreaker,
    updateConfig,
    config: aiGuardrails.getConfig(),
  };
}
