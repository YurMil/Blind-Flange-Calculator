import {expect, test} from '@playwright/test';

test.describe('Blind Flange Calculator smoke', () => {
  test('loads app.html, shows calculator, and enables export controls after calculation', async ({
    page,
  }) => {
    await page.goto('/app.html');

    await expect(page.getByRole('heading', {name: 'Blind Flange Calculator'})).toBeVisible();
    await expect(page.getByRole('radio', {name: 'Standard (DN)'})).toBeVisible();

    // Default inputs already produce a standard result; assert results / export surface.
    await expect(page.getByText('PN selection', {exact: true})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Export PDF'})).toBeEnabled({timeout: 15_000});
    await expect(page.getByRole('button', {name: 'Download DXF'})).toBeEnabled();
    await expect(page.getByRole('button', {name: 'Download STEP'})).toBeVisible();

    // Switch to custom mode to exercise a primary interaction path.
    await page.getByRole('radio', {name: 'Custom geometry'}).click();
    await expect(page.getByText('Flange outer diameter D')).toBeVisible();
  });
});
