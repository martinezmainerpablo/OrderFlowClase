import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const registerSuccess = new Counter('register_success');
const registerFailed = new Counter('register_failed');
const registerRate = new Rate('register_success_rate');
const registerDuration = new Trend('register_duration');

// Configuration - can be overridden via environment variables
const BASE_URL = __ENV.BASE_URL || 'https://localhost:7049';
const ENDPOINT = __ENV.ENDPOINT || '/api/v1/auth/register';

// Test options
export const options = {
    // Load test stages - aggressive ramp up from 10 to 100 users over 2 minutes
    stages: [
        { duration: '10s', target: 10 },   // Start with 10 users
        { duration: '30s', target: 30 },   // Ramp to 30 users
        { duration: '30s', target: 60 },   // Ramp to 60 users
        { duration: '30s', target: 100 },  // Ramp to 100 users
        { duration: '20s', target: 100 },  // Stay at 100 users
        { duration: '20s', target: 0 },    // Ramp down to 0 users
    ],
    // Thresholds
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
        register_success_rate: ['rate>0.9'], // 90% success rate
    },
    // For local HTTPS with self-signed certificates
    insecureSkipTLSVerify: true,
};

// Generate unique email for each request
function generateUniqueEmail() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const vuId = __VU; // Virtual user ID
    const iteration = __ITER; // Iteration number
    return `test_${vuId}_${iteration}_${timestamp}_${randomId}@test.com`;
}

export default function () {
    const url = `${BASE_URL}${ENDPOINT}`;
    
    const payload = JSON.stringify({
        email: generateUniqueEmail(),
        password: 'Test12345.'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const startTime = Date.now();
    const response = http.post(url, payload, params);
    const duration = Date.now() - startTime;

    // Record custom metrics
    registerDuration.add(duration);

    // Check response
    const success = check(response, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    if (success) {
        registerSuccess.add(1);
        registerRate.add(1);
    } else {
        registerFailed.add(1);
        registerRate.add(0);
        console.log(`Failed request - Status: ${response.status}, Body: ${response.body}`);
    }

    // Wait between requests (think time)
    sleep(1);
}

// Setup function - runs once before the test
export function setup() {
    console.log(`Starting load test against: ${BASE_URL}${ENDPOINT}`);
    console.log('Test configuration:');
    console.log('- Method: POST');
    console.log('- Generating unique emails for each request');
}

// Teardown function - runs once after the test
export function teardown(data) {
    console.log('Load test completed!');
}
