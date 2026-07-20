import { test, expect } from '../fixtures'

test.describe('Root route bootstrap', () => {
  test('navigating to / redirects to PromptOps dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/#\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible({ timeout: 45000 })
  })

  test('explicit navigation is not overridden by bootstrap redirect', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Immediately navigate to a non-root route; bootstrap logic must not replace it back.
    await page.goto('/#/image/text2image')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/#\/image\/text2image/)
    await expect(page.locator('[data-testid="workspace"][data-mode="image-text2image"]').first()).toBeVisible({ timeout: 45000 })
  })
})
