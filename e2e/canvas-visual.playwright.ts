import { expect, test } from '@playwright/test';

test.describe('Canvas visual rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas/demo.html');
    await page.waitForSelector('.canvas-viewport');
    await page.waitForTimeout(500);
  });

  test('canvas viewport is visible', async ({ page }) => {
    const viewport = page.locator('.canvas-viewport');
    await expect(viewport).toBeVisible();
  });

  test('all node types are rendered', async ({ page }) => {
    await expect(page.locator('.canvas-node-text')).toHaveCount(2);
    await expect(page.locator('.canvas-node-file')).toHaveCount(1);
    await expect(page.locator('.canvas-node-link')).toHaveCount(1);
    await expect(page.locator('.canvas-node-group')).toHaveCount(1);
  });

  test('edges are rendered', async ({ page }) => {
    const edges = page.locator('.canvas-edge');
    await expect(edges).toHaveCount(3);
  });

  test('toolbar controls are visible', async ({ page }) => {
    const toolbar = page.locator('.canvas-toolbar');
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.locator('> button');
    await expect(buttons).toHaveCount(6);
    await expect(page.locator('button[title="Toggle Grid Dots"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom In"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom Out"]')).toBeVisible();
    await expect(page.locator('button[title="Fit to View"]')).toBeVisible();
    await expect(page.locator('button[title="Reset Scale (1:1)"]')).toBeVisible();
    await expect(page.locator('button[title="Help & Info"]')).toBeVisible();
  });

  test('pan and zoom works', async ({ page }) => {
    const world = page.locator('.canvas-world');
    const initialTransform = await world.evaluate((el) => el.style.transform);

    const viewport = page.locator('.canvas-viewport');
    await viewport.hover();
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(200);

    const newTransform = await world.evaluate((el) => el.style.transform);
    expect(newTransform).not.toBe(initialTransform);
  });

  test('edges have proper SVG paths', async ({ page }) => {
    // Verify edges render as SVG g.canvas-edge containing path elements
    const edgeGroups = page.locator('g.canvas-edge');
    const count = await edgeGroups.count();
    expect(count).toBeGreaterThan(0);

    // Each edge group should contain a path with a valid d attribute
    for (let i = 0; i < Math.min(count, 3); i++) {
      const path = edgeGroups.nth(i).locator('path');
      await expect(path).toBeVisible();
      const d = await path.getAttribute('d');
      expect(d).toBeTruthy();
      expect(d!.startsWith('M')).toBe(true);
    }
  });

  test('fit to view via toolbar', async ({ page }) => {
    const toolbar = page.locator('.canvas-toolbar');
    const fitButton = toolbar.locator('button[title="Fit to View"]');
    await expect(fitButton).toBeVisible();
    await expect(fitButton).toBeEnabled();
  });
});
