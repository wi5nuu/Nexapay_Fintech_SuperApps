import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const successRate = new Rate('operation_success_rate');
const operationDuration = new Trend('operation_duration_ms');
const errorRate = new Rate('operation_error_rate');
const totalOperations = new Counter('total_operations');

export const options = {
  scenarios: {
    auth_load_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1000,
      stages: [
        { target: 50, duration: '2m' },
        { target: 200, duration: '3m' },
        { target: 500, duration: '3m' },
        { target: 500, duration: '2m' },
      ],
      exec: 'authScenario',
      tags: { scenario: 'auth' },
    },
    wallet_load_test: {
      executor: 'per-vu-iterations',
      vus: 300,
      iterations: 50,
      maxDuration: '10m',
      exec: 'walletScenario',
      startTime: '1m',
      tags: { scenario: 'wallet' },
    },
    payment_stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '3m', target: 1500 },
        { duration: '5m', target: 2000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'paymentScenario',
      startTime: '3m',
      tags: { scenario: 'payment' },
    },
    smoke_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      exec: 'smokeScenario',
      startTime: '0s',
      tags: { scenario: 'smoke' },
    },
    soak_test: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30m',
      exec: 'paymentScenario',
      startTime: '15m',
      tags: { scenario: 'soak' },
    },
    kyc_load_test: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 200,
      stages: [
        { target: 30, duration: '2m' },
        { target: 100, duration: '3m' },
        { target: 100, duration: '2m' },
      ],
      exec: 'kycScenario',
      startTime: '2m',
      tags: { scenario: 'kyc' },
    },
    notification_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      exec: 'notificationScenario',
      startTime: '8m',
      tags: { scenario: 'notification' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'avg<300'],
    http_req_failed: ['rate<0.02'],
    operation_duration_ms: ['p(95)<1000'],
    operation_success_rate: ['rate>0.95'],
  },
  noConnectionReuse: true,
  userAgent: 'K6NexaPayScenarios/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:4001';
const WALLET_URL = __ENV.WALLET_URL || 'http://localhost:4003';
const KYC_URL = __ENV.KYC_URL || 'http://localhost:4002';
const NOTIFICATION_URL = __ENV.NOTIFICATION_URL || 'http://localhost:4006';

const CUSTOM_METRICS = {
  auth: {
    loginLatency: new Trend('auth_login_latency'),
    registerLatency: new Trend('auth_register_latency'),
    successRate: new Rate('auth_success_rate'),
  },
  wallet: {
    balanceLatency: new Trend('wallet_balance_latency'),
    transferLatency: new Trend('wallet_transfer_latency'),
    successRate: new Rate('wallet_success_rate'),
  },
  payment: {
    processLatency: new Trend('payment_process_latency'),
    successRate: new Rate('payment_success_rate'),
    throughput: new Counter('payment_throughput'),
  },
  kyc: {
    submitLatency: new Trend('kyc_submit_latency'),
    statusLatency: new Trend('kyc_status_latency'),
    successRate: new Rate('kyc_success_rate'),
  },
};

function trackOperation(metricObj, operation, duration, success) {
  if (metricObj.latency) {
    metricObj.latency.add(duration);
  }
  if (metricObj.successRate) {
    metricObj.successRate.add(success);
  }
  operationDuration.add(duration);
  successRate.add(success);
  totalOperations.add(1);
}

export function authScenario() {
  const email = `scenario_${__VU}_${Date.now()}@nexapay.dev`;
  const password = 'TestLoad123!';

  group('Auth - Registration', () => {
    const start = Date.now();
    const res = http.post(`${AUTH_URL}/auth/register`, JSON.stringify({
      email, password, firstName: 'Scenario', lastName: `User${__VU}`,
    }), { headers: { 'Content-Type': 'application/json' }, tags: { scenario: 'auth', operation: 'register' } });

    trackOperation(CUSTOM_METRICS.auth, 'register', Date.now() - start, res.status === 201);
    check(res, { 'auth register ok': (r) => r.status === 201 });
  });

  sleep(1);

  group('Auth - Login', () => {
    const start = Date.now();
    const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email, password }),
      { headers: { 'Content-Type': 'application/json' }, tags: { scenario: 'auth', operation: 'login' } });

    trackOperation(CUSTOM_METRICS.auth, 'login', Date.now() - start, res.status === 200);
    check(res, { 'auth login ok': (r) => r.status === 200 });
  });
}

export function walletScenario() {
  const token = `wallet_token_${__VU}`;

  group('Wallet - Get Balance', () => {
    const start = Date.now();
    const res = http.get(`${WALLET_URL}/wallet/balance`,
      { headers: { Authorization: `Bearer ${token}` }, tags: { scenario: 'wallet', operation: 'balance' } });

    trackOperation(CUSTOM_METRICS.wallet, 'balance', Date.now() - start, res.status === 200);
    check(res, { 'wallet balance ok': (r) => r.status === 200 });
  });

  sleep(0.5);

  group('Wallet - Transfer', () => {
    const start = Date.now();
    const res = http.post(`${WALLET_URL}/wallet/transfer`, JSON.stringify({
      recipientId: `recipient_${__VU % 100}`, amount: 25.0, currency: 'USD',
    }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
      'Idempotency-Key': `wallet_${__VU}_${__ITER}` }, tags: { scenario: 'wallet', operation: 'transfer' } });

    trackOperation(CUSTOM_METRICS.wallet, 'transfer', Date.now() - start, res.status === 200);
    check(res, { 'wallet transfer ok': (r) => r.status === 200 });
  });
}

export function paymentScenario() {
  const token = `payment_token_${__VU}`;

  group('Payment - Process', () => {
    const start = Date.now();
    const res = http.post(`${WALLET_URL}/payment/process`, JSON.stringify({
      merchantId: `merchant_${__VU % 50}`, amount: Math.floor(Math.random() * 500) + 10,
      currency: 'USD', description: `Payment from VU ${__VU}`,
    }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
      'Idempotency-Key': `payment_${__VU}_${__ITER}` }, tags: { scenario: 'payment', operation: 'process' } });

    trackOperation(CUSTOM_METRICS.payment, 'process', Date.now() - start, res.status === 200);
    CUSTOM_METRICS.payment.throughput.add(1);
    check(res, { 'payment process ok': (r) => r.status === 200 });
  });

  sleep(0.2);
}

export function kycScenario() {
  const token = `kyc_token_${__VU}`;

  group('KYC - Submit', () => {
    const start = Date.now();
    const res = http.post(`${KYC_URL}/kyc/submit`, JSON.stringify({
      fullName: `Scenario User ${__VU}`, dateOfBirth: '1990-01-15',
      nationality: 'US', address: '123 Test St', city: 'TestCity',
      state: 'TS', zipCode: '12345', ssn: '123-45-6789',
    }), { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      tags: { scenario: 'kyc', operation: 'submit' } });

    trackOperation(CUSTOM_METRICS.kyc, 'submit', Date.now() - start, res.status === 201);
    check(res, { 'kyc submit ok': (r) => r.status === 201 });
  });

  sleep(0.5);

  group('KYC - Status', () => {
    const start = Date.now();
    const res = http.get(`${KYC_URL}/kyc/status`,
      { headers: { Authorization: `Bearer ${token}` }, tags: { scenario: 'kyc', operation: 'status' } });

    trackOperation(CUSTOM_METRICS.kyc, 'status', Date.now() - start, res.status === 200);
    check(res, { 'kyc status ok': (r) => r.status === 200 });
  });
}

export function notificationScenario() {
  group('Notification - Send', () => {
    const res = http.post(`${NOTIFICATION_URL}/notifications/send`, JSON.stringify({
      userId: `user_${__VU}`, type: 'email', template: 'test_template',
      channels: ['email'], data: { message: `Load test notification from VU ${__VU}` },
    }), { headers: { 'Content-Type': 'application/json' }, tags: { scenario: 'notification', operation: 'send' } });

    check(res, { 'notification send ok': (r) => r.status === 202 });
  });
}

export function smokeScenario() {
  group('Smoke - Health Check', () => {
    const endpoints = [
      `${BASE_URL}/health`, `${AUTH_URL}/health`, `${WALLET_URL}/health`,
      `${KYC_URL}/health`, `${NOTIFICATION_URL}/health`,
    ];
    endpoints.forEach((url) => {
      const res = http.get(url, { tags: { scenario: 'smoke', operation: 'health' } });
      check(res, { [`health ${url} ok`]: (r) => r.status === 200 });
    });
  });
}

export default function () {
  authScenario();
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      scenarios: Object.keys(data.metrics).reduce((acc, key) => {
        const metric = data.metrics[key];
        if (metric.type === 'rate') acc[`${key}_rate`] = metric.values.rate;
        if (metric.type === 'trend') {
          acc[`${key}_avg`] = metric.values.avg;
          acc[`${key}_p95`] = metric.values['p(95)'];
        }
        return acc;
      }, {}),
    }),
  };
}
