/**
 * Centralized Analytics Service for NexaPay.
 * Abstracts various analytics providers (e.g., Firebase, Mixpanel).
 */
export class AnalyticsService {
  /**
   * Track a generic event with properties
   */
  static logEvent(eventName: string, properties: Record<string, any> = {}) {
    // In production, this would call Firebase Analytics, Mixpanel, etc.
    console.log(`[Analytics] Event: ${eventName}`, properties);
    
    // Example: Performance monitoring simulation
    if (properties.duration) {
      console.log(`[Analytics] Performance | ${eventName} took ${properties.duration}ms`);
    }
  }

  /**
   * Specifically track user login success
   */
  static logLogin(method: string = 'email') {
    this.logEvent('login', { method, timestamp: new Date().toISOString() });
  }

  /**
   * Track financial transactions
   */
  static logTransaction(type: string, amount: number, currency: string) {
    this.logEvent('transaction_complete', {
      type,
      amount,
      currency,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track screen views
   */
  static logScreenView(screenName: string) {
    this.logEvent('screen_view', { screen_name: screenName });
  }

  /**
   * Set user properties for personalized analytics
   */
  static setUserProperties(userId: string, properties: Record<string, any> = {}) {
    console.log(`[Analytics] User: ${userId}`, properties);
  }
}
