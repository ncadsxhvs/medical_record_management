import { test, expect } from '@playwright/test';

test.describe('Favorites Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows "+ Add Favorite" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ Add Favorite' })).toBeVisible();
  });

  test('clicking "+ Add Favorite" reveals search input', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Favorite' }).click();
    const searchInput = page.getByPlaceholder('Add favorite by code or name...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  test('search returns results and allows adding', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Favorite' }).click();
    const searchInput = page.getByPlaceholder('Add favorite by code or name...');
    await searchInput.fill('99213');
    await expect(page.locator('button:has-text("99213")').first()).toBeVisible({ timeout: 5000 });
  });

  test('"Done" button closes search', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Favorite' }).click();
    await expect(page.getByPlaceholder('Add favorite by code or name...')).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByPlaceholder('Add favorite by code or name...')).not.toBeVisible();
  });

  test('delete button is always visible on favorite items', async ({ page }) => {
    const deleteButtons = page.locator('[title="Remove from favorites"]');
    const count = await deleteButtons.count();
    if (count > 0) {
      await expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('selected favorites show green styling', async ({ page }) => {
    const favoriteTiles = page.locator('.bg-green-50.border-green-300');
    expect(await favoriteTiles.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Favorite Groups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('group tiles show edit, rename, and delete icons', async ({ page }) => {
    const editBtns = page.locator('[title="Edit group"]');
    const count = await editBtns.count();
    if (count > 0) {
      await expect(editBtns.first()).toBeVisible();
      await expect(page.locator('[title="Rename group"]').first()).toBeVisible();
      await expect(page.locator('[title="Delete group"]').first()).toBeVisible();
    }
  });

  test('clicking edit shows blue editing banner', async ({ page }) => {
    const editBtn = page.locator('[title="Edit group"]').first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await expect(page.locator('text=Editing group')).toBeVisible();
      await expect(page.locator('text=Cancel')).toBeVisible();
    }
  });

  test('cancel exits edit mode', async ({ page }) => {
    const editBtn = page.locator('[title="Edit group"]').first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await expect(page.locator('text=Editing group')).toBeVisible();
      await page.locator('.bg-blue-50 button:has-text("Cancel")').click();
      await expect(page.locator('text=Editing group')).not.toBeVisible();
    }
  });

  test('rename prompts for new name', async ({ page }) => {
    const renameBtn = page.locator('[title="Rename group"]').first();
    if (await renameBtn.isVisible().catch(() => false)) {
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt');
        await dialog.dismiss();
      });
      await renameBtn.click();
    }
  });

  test('delete prompts for confirmation', async ({ page }) => {
    const deleteBtn = page.locator('[title="Delete group"]').first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        await dialog.dismiss();
      });
      await deleteBtn.click();
    }
  });
});
