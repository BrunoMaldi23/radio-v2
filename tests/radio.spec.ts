import { test, expect } from '@playwright/test';

test('Validar carga inicial y navegación de Radio Labranza', async ({ page }) => {
  // 1. Entrar a la página web
  await page.goto('https://radio-labranza-fm.vercel.app/');

  // 2. Comprobar que el título de la pestaña sea correcto
  await expect(page).toHaveTitle(/Radio Labranza FM/i);

  // 3. Esperar un momento para asegurar que cargue la interfaz
  await page.waitForLoadState('networkidle');

  // 4. Buscar el botón de Play y hacerle clic (ajusta el texto si es diferente)
  // Nota: Si el botón tiene un texto como "Play", "Escuchar" o un icono, Playwright lo buscará.
  const botonPlay = page.getByRole('button').first(); // Selecciona el primer botón por defecto
  await botonPlay.click();

  // 5. Simular navegación haciendo clic en un enlace que contenga "Programas"
  // Esto buscará un menú o botón que diga "Programas" y le hará clic
  await page.click('text=Programas');

  // 6. Verificar que la URL cambió correctamente a la sección de programas
  await expect(page).toHaveURL(/.*programas/);
});