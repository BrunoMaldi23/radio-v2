import { expect, test } from '@playwright/test';

test.setTimeout(60000);

const publicRoutes = ['/', '/programas', '/exitos', '/ranking', '/noticias', '/comunidad', '/contacto'];
const adminRoutes = [
  '/admin',
  '/admin/contenido?category=Noticias',
  '/admin/contenido?category=Exitos%2090%2C2000',
  '/admin/ranking',
  '/admin/comunidad',
  '/admin/usuarios',
  '/admin/transmision',
];

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalOverflow, `${label} should not overflow horizontally`).toBe(false);
}

test.describe('Radio Hit public frontend', () => {
  test('loads the main public routes without horizontal overflow', async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveTitle(/Radio Hit 90 y 2000/i);
      await expect(page.locator('body')).toBeVisible();

      await expectNoHorizontalOverflow(page, route);
    }
  });

  test('keeps public routes responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expectNoHorizontalOverflow(page, `${route} mobile`);
    }
  });

  test('navigates from the header to programs', async ({ page }) => {
    await page.goto('/');
    const programsLink = page
      .getByRole('navigation', { name: /navegacion principal/i })
      .getByRole('link', { name: /programas/i });
    await expect(programsLink).toHaveAttribute('href', '/programas');
    await Promise.all([
      page.waitForURL(/\/programas$/, { timeout: 15000 }),
      programsLink.click(),
    ]);

    await expect(page).toHaveURL(/\/programas$/);
    await expect(page.getByRole('heading', { name: /programas/i })).toBeVisible();
  });

  test('keeps the tv layout fixed and centered after refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/tv', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--tv-main-height').trim().length > 0);

    const layout = await page.evaluate(() => {
      const stage = document.querySelector('.tv-live-stage')?.getBoundingClientRect();
      const audio = document.querySelector('[data-global-audio-player]')?.getBoundingClientRect();
      const player = document.querySelector('.video-player-shell')?.getBoundingClientRect();
      const chat = document.querySelector('.tv-chat-panel')?.getBoundingClientRect();

      return {
        hasScroll: document.documentElement.scrollHeight > window.innerHeight,
        hasFooter: Boolean(document.querySelector('footer')),
        centerDelta: stage ? Math.abs((stage.left + stage.width / 2) - window.innerWidth / 2) : Number.POSITIVE_INFINITY,
        gapBottom: stage && audio ? audio.top - stage.bottom : Number.NEGATIVE_INFINITY,
        sameHeight: player && chat ? Math.abs(player.height - chat.height) : Number.POSITIVE_INFINITY,
      };
    });

    expect(layout.hasScroll).toBe(false);
    expect(layout.hasFooter).toBe(false);
    expect(layout.centerDelta).toBeLessThanOrEqual(1);
    expect(layout.gapBottom).toBeGreaterThanOrEqual(0);
    expect(layout.sameHeight).toBeLessThanOrEqual(1);
  });

  test('keeps the tv mobile layout inside the visible player area', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tv', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--tv-main-height').trim().length > 0);

    const layout = await page.evaluate(() => {
      const stage = document.querySelector('.tv-live-stage')?.getBoundingClientRect();
      const audio = document.querySelector('[data-global-audio-player]')?.getBoundingClientRect();
      const chatForm = document.querySelector('.tv-chat-panel form')?.getBoundingClientRect();

      return {
        hasScroll: document.documentElement.scrollHeight > window.innerHeight + 2,
        stageFits: stage && audio ? stage.bottom <= audio.top + 1 : false,
        chatFormVisible: chatForm && audio ? chatForm.bottom <= audio.top + 1 : false,
      };
    });

    expect(layout.hasScroll).toBe(false);
    expect(layout.stageFits).toBe(true);
    expect(layout.chatFormVisible).toBe(true);
  });
});

test.describe('Radio Hit admin frontend', () => {
  test('protects admin routes without a session', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /iniciar sesion/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /entrar al panel/i })).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalOverflow(page, '/admin login');
  });

  test('loads protected admin sections after login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('tu@correo.cl').fill('admin@radiolabranza.cl');
    await page.getByPlaceholder('********').fill('Password123!');
    await page.getByRole('button', { name: /entrar al panel/i }).click();
    await expect(page.getByRole('heading', { name: /panel editorial/i })).toBeVisible();

    for (const route of adminRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toContainText(/Cerrar sesion/i, { timeout: 15000 });
      await expect(page.locator('body')).not.toContainText(/Iniciar sesion/i);
      await expectNoHorizontalOverflow(page, route);
    }
  });
});
