import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Per-endpoint latency tracking
const apiSuccessRate  = new Rate('api_success_rate');
const apiErrors       = new Counter('api_errors_total');
const latencyHealth   = new Trend('latency_health_ms');
const latencyRegister = new Trend('latency_register_ms');
const latencyLogin    = new Trend('latency_login_ms');
const latencyProfile  = new Trend('latency_profile_ms');
const latencyRooms    = new Trend('latency_rooms_ms');

export const options = {
  scenarios: {
    // Scenario 1: Steady read traffic (health + rooms)
    read_traffic: {
      executor: 'constant-arrival-rate',
      rate:     50,           // 50 requests/sec
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'readOnly',
      tags: { scenario: 'reads' },
    },
    // Scenario 2: Auth flow (register + login + profile)
    auth_flow: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 5  },
        { duration: '30s', target: 20 },
        { duration: '10s', target: 0  },
      ],
      exec: 'authFlow',
      tags: { scenario: 'auth' },
    },
    // Scenario 3: Spike on auth endpoints
    auth_spike: {
      executor: 'ramping-vus',
      startTime: '50s',
      stages: [
        { duration: '5s',  target: 50 },
        { duration: '15s', target: 50 },
        { duration: '5s',  target: 0  },
      ],
      exec: 'authFlow',
      tags: { scenario: 'spike' },
    },
  },
  thresholds: {
    'api_success_rate':    ['rate>0.88'],
    'latency_health_ms':   ['p(95)<50',  'p(99)<100'],
    'latency_login_ms':    ['p(95)<3000', 'p(99)<3500'],
    'latency_register_ms': ['p(95)<3500'],
    'latency_profile_ms':  ['p(95)<200'],
    'latency_rooms_ms':    ['p(95)<400'],
    'http_req_failed':     ['rate<0.15'],
  },
};

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/^ws/, 'http');

// ── Read-only scenario ──────────────────────────────────────────────
export function readOnly() {
  group('Health Check', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v2/health`);
    latencyHealth.add(Date.now() - start);

    const ok = check(res, {
      'health 200':    (r) => r.status === 200,
      'status is ok':  (r) => r.json('status') === 'ok',
    });
    apiSuccessRate.add(ok ? 1 : 0);
    if (!ok) apiErrors.add(1);
  });

  sleep(0.2);

  group('List Rooms', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v2/rooms`);
    latencyRooms.add(Date.now() - start);

    const ok = check(res, {
      'rooms 200': (r) => r.status === 200,
    });
    apiSuccessRate.add(ok ? 1 : 0);
    if (!ok) apiErrors.add(1);
  });

  sleep(0.3);
}

// ── Auth flow scenario ──────────────────────────────────────────────
export function authFlow() {
  const user = {
    username: `load_${__VU}_${__ITER}`,
    email:    `load_${__VU}_${__ITER}@test.com`,
    password: 'Test123!@#',
  };
  const headers = { 'Content-Type': 'application/json' };
  let token = '';

  group('Register', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v2/auth/register`,
      JSON.stringify(user),
      { headers }
    );
    latencyRegister.add(Date.now() - start);

    const ok = check(res, {
      'register 200 or 409': (r) => r.status === 200 || r.status === 409,
    });
    apiSuccessRate.add(ok ? 1 : 0);
    if (!ok) apiErrors.add(1);
    if (res.status === 200) token = res.json('token') || '';
  });

  sleep(0.3);

  group('Login', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v2/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers }
    );
    latencyLogin.add(Date.now() - start);

    const ok = check(res, {
      'login 200':          (r) => r.status === 200,
      'login returns token': (r) => !!r.json('token'),
    });
    apiSuccessRate.add(ok ? 1 : 0);
    if (!ok) apiErrors.add(1);
    if (res.status === 200) token = res.json('token') || token;
  });

  sleep(0.3);

  if (!token) return;

  group('Get Profile', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v2/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    latencyProfile.add(Date.now() - start);

    const ok = check(res, {
      'profile 200':          (r) => r.status === 200,
      'profile has username':  (r) => !!r.json('username'),
    });
    apiSuccessRate.add(ok ? 1 : 0);
    if (!ok) apiErrors.add(1);
  });

  sleep(0.3);

  group('Update Profile', () => {
    const res = http.put(
      `${BASE_URL}/api/v2/user/profile`,
      JSON.stringify({ username: `updated_${__VU}` }),
      { headers: { ...headers, Authorization: `Bearer ${token}` } }
    );
    const ok = check(res, {
      'update profile 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
    apiSuccessRate.add(ok ? 1 : 0);
    if (!ok) apiErrors.add(1);
  });

  sleep(0.5);
}