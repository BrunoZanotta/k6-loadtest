import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

const VUS = __ENV.VUS ? parseInt(__ENV.VUS, 10) : 500;
const DURATION = __ENV.DURATION || '5m';
const BASE_URL = __ENV.BASE_URL || 'https://test-api.k6.io/public/crocodiles';

export const options = {
  scenarios: {
    load: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '30s',
      tags: { scenario: 'load' },
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:list}': ['p(95)<500'],
    'http_req_duration{endpoint:item}': ['p(95)<500'],
  },
  summaryTrendStats: ['avg','med','min','max','p(90)','p(95)','p(99)'],
};

const endpointDuration = new Trend('endpoint_duration', true);
const errorRate = new Rate('error_rate');

export default function () {
  group('GET /public/crocodiles/', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { endpoint: 'list' } });
    const ok = check(res, {
      'status 200 (list)': (r) => r.status === 200,
      'json válido (list)': (r) => {
        try { return Array.isArray(r.json()); } catch(e) { return false; }
      },
    });
    errorRate.add(!ok);
    endpointDuration.add(res.timings.duration, { endpoint: 'list' });
  });

  group('GET /public/crocodiles/{id}/', () => {
    const id = 1 + Math.floor(Math.random() * 5);
    const res = http.get(`${BASE_URL}/${id}/`, { tags: { endpoint: 'item' } });
    const ok = check(res, {
      'status 200 (item)': (r) => r.status === 200,
      'json válido (item)': (r) => {
        try { return r.json('id') !== undefined; } catch(e) { return false; }
      },
    });
    errorRate.add(!ok);
    endpointDuration.add(res.timings.duration, { endpoint: 'item' });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/summary.html': htmlReport(data),
    'reports/summary.json': JSON.stringify(data, null, 2),
  };
}