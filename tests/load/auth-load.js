import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const registerRate = new Rate('registration_success_rate');
const loginDuration = new Trend('login_duration_ms');
const refreshDuration = new Trend('refresh_duration_ms');
const registerDuration = new Trend('register_duration_ms');
const totalRequests = new Counter('total_auth_requests');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '3m', target: 500 },
    { duration: '3m', target: 1000 },
    { duration: '2m', target: 1000 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    login_duration_ms: ['p(95)<500'],
    register_duration_ms: ['p(95)<500'],
    refresh_duration_ms: ['p(95)<500'],
    registration_success_rate: ['rate>0.95'],
  },
  noConnectionReuse: true,
  userAgent: 'K6NexaPayLoadTest/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:4001';

const users = [];

export function setup() {
  registerRate.add(false);
  return { startTime: Date.now() };
}

function randomEmail() {
  return `loadtest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@nexapay.dev`;
}

function randomPassword() {
  return `Str0ng!${Math.random().toString(36).substring(2, 10)}`;
}

function registerUser(email, password) {
  const start = Date.now();
  const payload = JSON.stringify({
    email,
    password,
    firstName: 'Load',
    lastName: `Test${Math.floor(Math.random() * 10000)}`,
    phone: `+1${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { operation: 'register' },
  };

  const res = http.post(`${AUTH_URL}/auth/register`, payload, params);
  const duration = Date.now() - start;

  registerDuration.add(duration);
  totalRequests.add(1);

  const passed = check(res, {
    'register status is 201': (r) => r.status === 201,
    'register response time < 2000ms': (r) => r.timings.duration < 2000,
    'register has userId': (r) => {
      try {
        return JSON.parse(r.body).userId !== undefined;
      } catch {
        return false;
      }
    },
  });

  registerRate.add(passed);

  if (passed) {
    const body = JSON.parse(res.body);
    return { email, password, userId: body.userId, tokens: body.tokens };
  }
  return null;
}

function loginUser(email, password) {
  const start = Date.now();
  const payload = JSON.stringify({ email, password });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { operation: 'login' },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  const duration = Date.now() - start;

  loginDuration.add(duration);
  totalRequests.add(1);

  const passed = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login has access token': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (passed) {
    return JSON.parse(res.body);
  }
  return null;
}

function refreshToken(refreshToken) {
  const start = Date.now();
  const payload = JSON.stringify({ refreshToken });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { operation: 'refresh' },
  };

  const res = http.post(`${BASE_URL}/auth/refresh`, payload, params);
  const duration = Date.now() - start;

  refreshDuration.add(duration);
  totalRequests.add(1);

  check(res, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh response time < 500ms': (r) => r.timings.duration < 500,
    'refresh has new access token': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  return res.status === 200 ? JSON.parse(res.body) : null;
}

export default function (data) {
  const email = randomEmail();
  const password = randomPassword();

  group('Registration Flow', () => {
    const registered = registerUser(email, password);
    if (registered) {
      users.push({ email, password, userId: registered.userId });
    }
  });

  sleep(Math.random() * 2 + 1);

  group('Login Flow', () => {
    const loginResult = loginUser(email, password);
    if (loginResult) {
      group('Token Refresh Flow', () => {
        sleep(Math.random() * 1);
        refreshToken(loginResult.refreshToken);
      });
    }
  });

  sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
  console.log(`Test completed. Duration: ${Date.now() - data.startTime}ms`);
  console.log(`Total auth requests: ${totalRequests.name}`);
}
