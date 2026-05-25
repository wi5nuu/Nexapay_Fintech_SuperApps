import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const paymentSuccessRate = new Rate('payment_success_rate');
const concurrentUsers = new Gauge('concurrent_users');
const paymentDuration = new Trend('payment_duration_ms');
const errorRate = new Rate('payment_error_rate');
const totalPaymentRequests = new Counter('total_payment_requests');
const throughput = new Counter('requests_per_second');

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '3m', target: 500 },
    { duration: '3m', target: 1000 },
    { duration: '3m', target: 2000 },
    { duration: '5m', target: 2000 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'avg<500'],
    http_req_failed: ['rate<0.03'],
    payment_duration_ms: ['p(95)<1000'],
    payment_success_rate: ['rate>0.95'],
    payment_error_rate: ['rate<0.05'],
  },
  noConnectionReuse: true,
  discardResponseBodies: false,
  userAgent: 'K6NexaPayStressTest/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const WALLET_URL = __ENV.WALLET_URL || 'http://localhost:4003';

const PAYMENT_TYPES = ['topup', 'transfer', 'payment', 'withdrawal'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES'];

function randomPaymentType() {
  return PAYMENT_TYPES[Math.floor(Math.random() * PAYMENT_TYPES.length)];
}

function randomCurrency() {
  return CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
}

function randomAmount() {
  const amounts = [10, 25, 50, 100, 200, 500, 1000];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function generateIdempotencyKey() {
  return `stress-${__VU}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function simulatePayment(token, paymentType) {
  const idempotencyKey = generateIdempotencyKey();
  const amount = randomAmount();
  const currency = randomCurrency();
  const start = Date.now();

  let endpoint, payload;

  switch (paymentType) {
    case 'topup':
      endpoint = `${WALLET_URL}/wallet/topup`;
      payload = JSON.stringify({
        amount,
        currency,
        paymentMethod: 'credit_card',
        paymentDetails: {
          cardNumber: 'TEST-CARD-4111',
          expiry: 'TEST-12/28',
          cvv: 'TEST-123',
          cardholderName: 'Stress Test',
        },
      });
      break;

    case 'transfer':
      endpoint = `${WALLET_URL}/wallet/transfer`;
      payload = JSON.stringify({
        recipientId: `recipient_${Math.floor(Math.random() * 5000)}`,
        amount,
        currency,
        note: `Stress test transfer ${Date.now()}`,
      });
      break;

    case 'payment':
      endpoint = `${WALLET_URL}/payment/process`;
      payload = JSON.stringify({
        merchantId: `merchant_${Math.floor(Math.random() * 500)}`,
        amount,
        currency,
        description: `Stress test payment for order ${Date.now()}`,
        metadata: {
          source: 'k6-stress-test',
          vu: __VU,
          iter: __ITER,
        },
      });
      break;

    case 'withdrawal':
      endpoint = `${WALLET_URL}/wallet/withdraw`;
      payload = JSON.stringify({
        amount,
        currency,
        bankAccount: {
          accountNumber: `TEST-ACCOUNT-PL67`,
          swiftCode: 'BANKPLPW',
          accountHolder: `Stress Test User ${__VU}`,
        },
      });
      break;
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer test_stress_token_${__VU}`,
      'Idempotency-Key': idempotencyKey,
      'X-Request-ID': idempotencyKey,
    },
    tags: { payment_type: paymentType, vu: __VU.toString() },
  };

  const res = http.post(endpoint, payload, params);
  const duration = Date.now() - start;

  paymentDuration.add(duration);
  totalPaymentRequests.add(1);
  throughput.add(1);

  const isSuccess = res.status >= 200 && res.status < 300;
  paymentSuccessRate.add(isSuccess);
  errorRate.add(!isSuccess);
  concurrentUsers.add(__VU);

  check(res, {
    'payment response received': (r) => r.status !== 0,
    'payment status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'payment response time < 2000ms': (r) => r.timings.duration < 2000,
    'payment has transaction reference': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.transactionId !== undefined || body.reference !== undefined;
      } catch {
        return false;
      }
    },
  });

  return {
    type: paymentType,
    amount,
    currency,
    duration,
    success: isSuccess,
    status: res.status,
  };
}

export default function () {
  concurrentUsers.add(__VU);

  group('Payment Processing', () => {
    const paymentType = randomPaymentType();

    for (let i = 0; i < 3; i++) {
      simulatePayment(__VU.toString(), paymentType);
      sleep(Math.random() * 0.5 + 0.1);
    }
  });

  sleep(Math.random() * 2 + 0.5);
}

export function teardown() {
  console.log(`Total payment requests: ${totalPaymentRequests.name}`);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      summary: {
        total_requests: data.metrics.total_payment_requests?.values?.count || 0,
        avg_duration_ms: data.metrics.payment_duration_ms?.values?.avg?.toFixed(2) || 0,
        p95_duration_ms: data.metrics.payment_duration_ms?.values?.['p(95)']?.toFixed(2) || 0,
        success_rate: data.metrics.payment_success_rate?.values?.rate?.toFixed(4) || 0,
        error_rate: data.metrics.payment_error_rate?.values?.rate?.toFixed(4) || 0,
        max_concurrent: data.metrics.concurrent_users?.values?.value || 0,
      },
    }),
  };
}
