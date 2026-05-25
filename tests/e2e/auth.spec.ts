import { test, expect } from '@playwright/test'

// Serial mode: tests depend on each other (sign-up must run before login tests)
test.describe.configure({ mode: 'serial' })

// Use a unique email per test run to avoid conflicts
const testEmail = `test+${Date.now()}@example.com`
const testPassword = 'password123'

test.describe('Unauthenticated redirects', () => {
  test('redirects /dashboard to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /admin to /login when not logged in', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows login page at /login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  })

  test('shows signup page at /signup', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
  })
})

test.describe('Sign up flow', () => {
  test('signs up and lands on dashboard', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText(testEmail)).toBeVisible()
  })

  test('shows error for already registered email', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('alert')).toContainText('already exists', { timeout: 10000 })
  })
})

test.describe('Login flow', () => {
  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText('Invalid email or password', { timeout: 10000 })
  })

  test('logs in and lands on dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('authenticated user is redirected away from /login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Now visit /login again — should redirect to /dashboard
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Admin route protection', () => {
  test('blocks regular user from /admin', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Attempt to navigate to /admin
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Logout flow', () => {
  test('logs out and redirects to /login', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // Confirm session is gone
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
