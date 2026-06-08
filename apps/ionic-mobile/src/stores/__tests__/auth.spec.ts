import { describe, it, expect } from 'vitest';
import { useAuthStore } from '../auth';
import { setActivePinia, createPinia } from 'pinia';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize correctly', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
  });
});
