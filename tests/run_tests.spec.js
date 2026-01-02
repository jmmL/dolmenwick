
const { test, expect } = require('@playwright/test');

test('Run generator.js unit tests', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => console.log(msg.text()));

  await page.goto('http://localhost:8000/tests/test_generator.html', { waitUntil: 'networkidle' });

  // Wait for the test results to appear
  await page.waitForSelector('#test-results .test-case');

  // Check for any failures
  const failedTests = await page.locator('.fail').count();
  expect(failedTests).toBe(0);

  // Optional: Log all test results
  const testResults = await page.locator('#test-results').innerText();
  console.log('--- TEST RESULTS ---');
  console.log(testResults);
});
