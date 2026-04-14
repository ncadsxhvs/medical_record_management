import { test as setup } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET env var is required for Playwright auth setup');
  }

  // Create a JWT token matching what Auth.js produces
  const token = await encode({
    token: {
      name: 'Test User',
      email: 'playwright@test.com',
      sub: 'playwright-test-user',
      id: 'playwright-test-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    },
    secret,
    salt: 'authjs.session-token',
  });

  // Navigate to the app to set the cookie on the right domain
  await page.goto('/sign-in');

  // Set the session cookie
  await page.context().addCookies([
    {
      name: 'authjs.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
  ]);

  // Verify auth works by navigating to main page
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Save auth state
  await page.context().storageState({ path: authFile });
});
