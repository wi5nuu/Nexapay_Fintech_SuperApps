import { defineAsyncComponent, markRaw } from 'vue';

export interface DashboardWidget {
  id: string;
  name: string;
  component: any;
  order: number;
  permissions?: string[];
}

/**
 * Registry for dynamic dashboard widgets.
 * Supports lazy loading and permission-based visibility.
 */
class WidgetRegistry {
  private widgets = new Map<string, DashboardWidget>();

  register(widget: DashboardWidget) {
    this.widgets.set(widget.id, {
      ...widget,
      component: markRaw(widget.component)
    });
  }

  getWidgets(userPermissions: string[] = []): DashboardWidget[] {
    return Array.from(this.widgets.values())
      .filter(w => !w.permissions || w.permissions.every(p => userPermissions.includes(p)))
      .sort((a, b) => a.order - b.order);
  }
}

export const widgetRegistry = new WidgetRegistry();

// Default Widget Registrations
widgetRegistry.register({
  id: 'wallet-card',
  name: 'Main Wallet',
  component: defineAsyncComponent(() => import('../components/IonWalletCard.vue')),
  order: 1
});

// Example of a future investment widget
/*
widgetRegistry.register({
  id: 'investment-summary',
  name: 'Investments',
  component: defineAsyncComponent(() => import('../components/InvestmentWidget.vue')),
  order: 2,
  permissions: ['investments:read']
});
*/
