import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const topUpSuccessRate = new Rate('topup_success_rate');
const transferSuccessRate = new Rate('transfer_success_rate');
const topUpDuration = new Trend('topup_duration_ms');
const transferDuration = new Trend('transfer_duration_ms');
const idempotencyHitRate = new Rate('idempotency_hit_rate');
const totalWalletRequests = new Counter('total_wallet_requests');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '3m', target: 300 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 500 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.02'],
    topup_duration_ms: ['p(95)<1000'],
    transfer_duration_ms: ['p(95)<1000'],
    topup_success_rate: ['rate>0.95'],
    transfer_success_rate: ['rate>0.95'],
    idempotency_hit_rate: ['rate>0.90'],
  },
  noConnectionReuse: true,
  userAgent: 'K6NexaPayWalletLoad/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const WALLET_URL = __ENV.WALLET_URL || 'http://localhost:4003';

const TEST_TOKEN = __ENV.TEST_ACCESS_TOKEN || '';
const TEST_USER_ID = __ENV.TEST_USER_ID || '';

function getHeaders(token, idempotencyKey) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || TEST_TOKEN}`,
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return headers;
}

function generateIdempotencyKey() {
  return `wallet-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function randomAmount(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getWalletBalance(token) {
  const params = {
    headers: getHeaders(token),
    tags: { operation: 'get_balance' },
  };

  const res = http.get(`${WALLET_URL}/wallet/balance`, params);
  totalWalletRequests.add(1);

  check(res, {
    'get balance status is 200': (r) => r.status === 200,
    'get balance has amount': (r) => {
      try {
        return JSON.parse(r.body).balance !== undefined;
      } catch {
        return false;
      }
    },
  });

  return res.status === 200 ? JSON.parse(res.body) : null;
}

function topUpWallet(token) {
  const amount = randomAmount(10, 500);
  const idempotencyKey = generateIdempotencyKey();
  const start = Date.now();

  const payload = JSON.stringify({
    amount,
    currency: 'USD',
    paymentMethod: 'credit_card',
    paymentDetails: {
      cardNumber: 'TEST-CARD-4111',
      expiry: 'TEST-12/28',
      cvv: 'TEST-123',
    },
  });

  const params = {
    headers: getHeaders(token, idempotencyKey),
    tags: { operation: 'topup' },
  };

  const res = http.post(`${WALLET_URL}/wallet/topup`, payload, params);
  const duration = Date.now() - start;

  topUpDuration.add(duration);
  totalWalletRequests.add(1);

  const passed = check(res, {
    'topup status is 200': (r) => r.status === 200,
    'topup response time < 1000ms': (r) => r.timings.duration < 1000,
    'topup has transactionId': (r) => {
      try {
        return JSON.parse(r.body).transactionId !== undefined;
      } catch {
        return false;
      }
    },
  });

  topUpSuccessRate.add(passed);

  return { passed, idempotencyKey, amount };
}

function testIdempotency(token, idempotencyKey, payload) {
  const params = {
    headers: getHeaders(token, idempotencyKey),
    tags: { operation: 'idempotency' },
  };

  const res = http.post(`${WALLET_URL}/wallet/topup`, payload, params);
  totalWalletRequests.add(1);

  const isDuplicateHandled = res.status === 200 || res.status === 409;
  idempotencyHitRate.add(isDuplicateHandled);

  check(res, {
    'idempotent request handled': (r) => r.status === 200 || r.status === 409,
    'idempotent response has original transaction': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.transactionId !== undefined || body.originalTransactionId !== undefined;
      } catch {
        return false;
      }
    },
  });
}

function transferFunds(token) {
  const amount = randomAmount(5, 100);
  const idempotencyKey = generateIdempotencyKey();
  const start = Date.now();

  const payload = JSON.stringify({
    recipientId: `recipient_${Math.floor(Math.random() * 1000)}`,
    amount,
    currency: 'USD',
    note: `Load test transfer ${Date.now()}`,
  });

  const params = {
    headers: getHeaders(token, idempotencyKey),
    tags: { operation: 'transfer' },
  };

  const res = http.post(`${WALLET_URL}/wallet/transfer`, payload, params);
  const duration = Date.now() - start;

  transferDuration.add(duration);
  totalWalletRequests.add(1);

  const passed = check(res, {
    'transfer status is 200': (r) => r.status === 200,
    'transfer response time < 1000ms': (r) => r.timings.duration < 1000,
    'transfer has transactionId': (r) => {
      try {
        return JSON.parse(r.body).transactionId !== undefined;
      } catch {
        return false;
      }
    },
  });

  transferSuccessRate.add(passed);

  return { passed, idempotencyKey, amount };
}

export default function () {
  const token = `test_token_${__VU}_${Date.now()}`;

  group('Get Wallet Balance', () => {
    getWalletBalance(token);
  });

  sleep(Math.random() * 2 + 1);

  group('Top Up Wallet', () => {
    const topup = topUpWallet(token);
    if (topup.passed) {
      sleep(0.5);
      group('Idempotency Test', () => {
        testIdempotency(token, topup.idempotencyKey, {
          amount: topup.amount,
          currency: 'USD',
          paymentMethod: 'credit_card',
          paymentDetails: {
            cardNumber: 'TEST-CARD-4111',
            expiry: 'TEST-12/28',
            cvv: 'TEST-123',
          },
        });
      });
    }
  });

  sleep(Math.random() * 2 + 1);

  group('Transfer Funds', () => {
    transferFunds(token);
  });

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      metrics: {
        topup_success_rate: data.metrics.topup_success_rate,
        transfer_success_rate: data.metrics.transfer_success_rate,
        idempotency_hit_rate: data.metrics.idempotency_hit_rate,
        topup_duration_p95: data.metrics.topup_duration_ms.p(95),
        transfer_duration_p95: data.metrics.transfer_duration_ms.p(95),
      },
    }),
  };
}
