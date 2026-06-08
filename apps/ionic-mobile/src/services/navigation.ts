import router from '../router';

/**
 * Centralized Navigation Service for Ionic Mobile.
 * Encapsulates routing logic and supports guards/pre-navigation checks.
 */
export class NavigationService {
  /**
   * Navigate to a named route with parameters
   */
  static async navigateTo(name: string, params: Record<string, any> = {}) {
    console.log(`Navigating to: ${name}`, params);
    return router.push({ name, params });
  }

  /**
   * Navigate back to the previous view
   */
  static goBack() {
    return router.back();
  }

  /**
   * Replace the current route (no back history)
   */
  static replace(name: string, params: Record<string, any> = {}) {
    return router.replace({ name, params });
  }

  /**
   * Utility to handle common protected navigation with checks
   */
  static async navigateToProtected(name: string, isAuth: boolean, requiresKyc: boolean = false) {
    if (!isAuth) {
      return this.navigateTo('Login');
    }
    
    if (requiresKyc) {
      // Logic for KYC check would go here
      console.warn('KYC required for this route');
    }

    return this.navigateTo(name);
  }
}
