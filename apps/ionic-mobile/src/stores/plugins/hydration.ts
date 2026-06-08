import type { PiniaPluginContext } from 'pinia';

/**
 * Custom Pinia plugin to handle store hydration and persistence.
 * This simulates saving to Secure Storage for enterprise security.
 */
export function hydrationPlugin({ store }: PiniaPluginContext) {
  // Load state from local storage on store creation
  const storedState = localStorage.getItem(`nexapay_store_${store.$id}`);
  if (storedState) {
    try {
      store.$patch(JSON.parse(storedState));
    } catch (e) {
      console.error(`Failed to hydrate store: ${store.$id}`, e);
    }
  }

  // Subscribe to store changes to persist state
  store.$subscribe((_mutation, state) => {
    try {
      localStorage.setItem(`nexapay_store_${store.$id}`, JSON.stringify(state));
    } catch (e) {
      console.error(`Failed to persist store: ${store.$id}`, e);
    }
  });
}
