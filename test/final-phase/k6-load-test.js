import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const summaryLatency = new Trend('latency_analytics_summary');
export const deptCompLatency = new Trend('latency_dept_comparison');
export const projPerfLatency = new Trend('latency_proj_performance');
export const expensesLatency = new Trend('latency_expenses_list');
export const budgetsLatency = new Trend('latency_budgets_list');

const BASE_URL = __ENV.TARGET_URL || 'http://127.0.0.1:4000/api/v1';

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'admin@finsight.com',
      password: 'admin123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginCheck = check(loginRes, {
    'login succeeded (201)': (r) => r.status === 201,
  });

  if (!loginCheck) {
    throw new Error(`Setup login failed with status ${loginRes.status}: ${loginRes.body}`);
  }

  const token = JSON.parse(loginRes.body).data.accessToken;
  return { token };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // 1. Analytics Global Summary
  const resSummary = http.get(`${BASE_URL}/analytics/summary`, { headers });
  summaryLatency.add(resSummary.timings.duration);
  const checkSummary = check(resSummary, {
    'summary status 200': (r) => r.status === 200,
  });
  errorRate.add(!checkSummary);

  // 2. Department Comparison
  const resDept = http.get(`${BASE_URL}/analytics/department-comparison`, { headers });
  deptCompLatency.add(resDept.timings.duration);
  const checkDept = check(resDept, {
    'dept comparison status 200': (r) => r.status === 200,
  });
  errorRate.add(!checkDept);

  // 3. Project Performance
  const resProj = http.get(`${BASE_URL}/analytics/project-performance`, { headers });
  projPerfLatency.add(resProj.timings.duration);
  const checkProj = check(resProj, {
    'proj performance status 200': (r) => r.status === 200,
  });
  errorRate.add(!checkProj);

  // 4. Expenses List & Filter (Model B: approved-only spend filter)
  const resExpenses = http.get(`${BASE_URL}/expenses?status=approved&page=1&limit=20`, { headers });
  expensesLatency.add(resExpenses.timings.duration);
  const checkExpenses = check(resExpenses, {
    'expenses filter status 200': (r) => r.status === 200,
  });
  errorRate.add(!checkExpenses);

  // 5. Budgets List & Allocation
  const resBudgets = http.get(`${BASE_URL}/budgets?page=1&limit=10`, { headers });
  budgetsLatency.add(resBudgets.timings.duration);
  const checkBudgets = check(resBudgets, {
    'budgets list status 200': (r) => r.status === 200,
  });
  errorRate.add(!checkBudgets);

  sleep(0.1);
}

