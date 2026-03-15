// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Snake game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/snake/index.html');
  });

  test('start screen is visible on load', async ({ page }) => {
    const startScreen = page.locator('#startScreen.show');
    await expect(startScreen).toBeVisible();
    await expect(page.getByRole('button', { name: /게임 시작|Start Game/ })).toBeVisible();
  });

  test('start() via JS hides popup and starts game', async ({ page }) => {
    const startScreen = page.locator('#startScreen');
    await expect(startScreen).toHaveClass(/show/);

    await page.waitForFunction(
      () => window.snakeGame != null || window.snakeGameError != null,
      { timeout: 8000 }
    );
    const err = await page.evaluate(() => window.snakeGameError);
    expect(err, 'Game init should not throw: ' + (err || '')).toBeFalsy();

    const result = await page.evaluate(() => {
      const hasGame = !!window.snakeGame;
      const startScreenEl = document.getElementById('startScreen');
      const hasShowBefore = startScreenEl && startScreenEl.classList.contains('show');
      if (window.snakeGame) window.snakeGame.start();
      const hasShowAfter = startScreenEl && startScreenEl.classList.contains('show');
      return { hasGame, hasShowBefore, hasShowAfter, state: window.snakeGame && window.snakeGame.state };
    });
    expect(result.hasGame, 'window.snakeGame should exist').toBe(true);
    expect(result.hasShowBefore, 'startScreen should have show before start()').toBe(true);
    expect(result.hasShowAfter, 'startScreen should not have show after start()').toBe(false);

    await expect(startScreen).not.toHaveClass(/show/);
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });

  test('clicking start button hides popup and starts game', async ({ page }) => {
    await page.waitForFunction(() => window.snakeGame != null, { timeout: 5000 });

    const startScreen = page.locator('#startScreen');
    const startBtn = page.getByRole('button', { name: /게임 시작|Start Game/ });

    await expect(startScreen).toHaveClass(/show/);
    await startBtn.click({ force: true });

    // Start screen should be hidden (no .show class)
    await expect(startScreen).not.toHaveClass(/show/, { timeout: 3000 });

    // Game canvas should be visible and game state should be playing (snake moving)
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // Wait a bit for game to run (snake moves every ~120ms)
    await page.waitForTimeout(300);

    // Score area should still be visible; start overlay should not cover it
    await expect(page.locator('.score-board')).toBeVisible();
  });

  test('game over screen appears when snake hits wall', async ({ page }) => {
    await page.waitForFunction(() => window.snakeGame != null, { timeout: 5000 });
    const startBtn = page.getByRole('button', { name: /게임 시작|Start Game/ });
    await startBtn.click();

    // Wait for start screen to disappear
    await expect(page.locator('#startScreen')).not.toHaveClass(/show/);

    // Move snake left repeatedly so it hits the wall quickly
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(50);
      const gameOver = page.locator('#gameOverScreen.show');
      if (await gameOver.isVisible()) break;
    }

    await expect(page.locator('#gameOverScreen')).toHaveClass(/show/);
  });
});
