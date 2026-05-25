import { createRouter, createWebHashHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/pages/TabsLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/TabDashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'wallet',
        name: 'Wallet',
        component: () => import('@/pages/TabWallet.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'transfer',
        name: 'Transfer',
        component: () => import('@/pages/TabTransfer.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/TabProfile.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Login.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('nexapay_access_token')
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
