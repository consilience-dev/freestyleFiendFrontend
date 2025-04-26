import { test, expect } from '@playwright/test';

// E2E: Verify beats gallery loads and displays beats

test.describe('BeatsGallery E2E', () => {
  test('should display a list of beats with images and audio', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Beats Gallery')).toBeVisible();
    // Wait for at least one beat card to render
    await expect(page.locator('img[alt]')).toHaveCountGreaterThan(0);
    // Check at least one audio element is present
    await expect(page.locator('audio')).toHaveCountGreaterThan(0);
    // Accessibility: images have alt text
    const images = await page.locator('img[alt]').all();
    for (const img of images) {
      expect(await img.getAttribute('alt')).not.toBe("");
    }
  });
});
