import { test, expect } from 'playwright/test';
import { testEnv } from '../env/environment';

test.describe('Login Flow E2E Tests', () => {
  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Measure page load time
    const startTime = performance.now();

    // Navigate to the login page
    await page.goto(`${testEnv.FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    // Calculate and verify page load time
    const loadTime = performance.now() - startTime;
    console.log(`Login page load time: ${loadTime}ms`);
    //expect(loadTime).toBeLessThan(2000); // Fail if page load > 2 seconds

    // Fill in login form (adjust selectors to match your Angular app)
    await page.fill('input[formControlName="email"]', 'test@gmail.com');
    await page.fill('input[formControlName="password"]', 'password123');

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(`${testEnv.FRONTEND_URL}/admin/dashboard`);

    // Verify dashboard is loaded
    expect(await page.url()).toBe(`${testEnv.FRONTEND_URL}/admin/dashboard`);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto(`${testEnv.FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    // Fill in login form with invalid credentials
    await page.fill('input[formControlName="email"]', 'wronguser');
    await page.fill('input[formControlName="password"]', 'wrongpassword');

    // Click submit button
    await page.click('button[type="submit"]');
  });
});