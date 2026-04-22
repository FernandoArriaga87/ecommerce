import { test, expect } from "@playwright/test";

// Basic end-to-end coverage of the customer funnel. Two tests, deliberately
// scoped to what's honestly testable without mocking Supabase auth:
//
//   1. browse → PDP → add to cart → localStorage persistence
//      (fully real — needs at least one active product seeded in the DB)
//
//   2. /checkout/success rendering with a mocked /api/orders/:id response
//      (the "checkout mock" step: we simulate that Stripe already redirected
//      back to the success page with a real orderId, and verify the page
//      renders correctly against the documented response shape)
//
// The /checkout form itself sits behind auth (middleware.ts) + a Skydropx
// quote round-trip, so it's skipped here — cover it with a logged-in fixture
// later if needed.

test.describe("Golden path", () => {
  test("browse → PDP → add to cart → cart persists on reload", async ({ page }) => {
    await page.goto("/");

    // Home is up. The hero headline is split across lines, match the end.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/DEPORTIVA\./i);

    // First product card links to /producto/:id. Wait for the grid.
    const firstProductLink = page.locator('a[href^="/producto/"]').first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();

    await expect(page).toHaveURL(/\/producto\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Pick the first available size button (labels like S / M / L / XL).
    const sizeButton = page
      .locator("button:not([disabled])")
      .filter({ hasText: /^(XS|S|M|L|XL|XXL)$/ })
      .first();
    await sizeButton.click();

    // Click "AGREGAR AL CARRITO". addItem() auto-opens the cart drawer.
    await page.getByRole("button", { name: /AGREGAR AL CARRITO/i }).click();

    // The drawer's header is visible once open.
    await expect(page.getByRole("heading", { name: /Tu Carrito/i })).toBeVisible();
    await expect(page.getByText(/ARTÍCULO/i).first()).toBeVisible();

    // Close the drawer (ESC) and reload — cart is persisted to localStorage
    // under the deportivo-* key and should survive.
    await page.keyboard.press("Escape");
    await page.reload();

    // After reload, the navbar cart trigger shows a count badge. Clicking it
    // should open the drawer with the same item still there.
    await page.getByRole("button", { name: /Abrir carrito/i }).click();
    await expect(page.getByRole("heading", { name: /Tu Carrito/i })).toBeVisible();
    await expect(page.getByText(/1 ARTÍCULO/i)).toBeVisible();
  });

  test("/checkout/success renders a mocked order", async ({ page }) => {
    const mockOrderId = "test-order-e2e-123";

    // Intercept the success page's lookup. Response shape matches
    // src/app/api/orders/[id]/route.ts.
    await page.route(`**/api/orders/${mockOrderId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          order: {
            id: mockOrderId,
            orderNumber: "AS-TEST-001",
            status: "PAID",
            subtotal: "899.00",
            shipping: "150.00",
            total: "1049.00",
            createdAt: new Date().toISOString(),
            items: [
              {
                id: "item-1",
                quantity: 1,
                price: "899.00",
                variant: {
                  size: "M",
                  product: {
                    name: "Jersey de Prueba E2E",
                    // Local image to avoid next/image remotePatterns errors in tests.
                    images: ["/brazilshirt.webp"],
                  },
                },
              },
            ],
            user: { name: "Tester", email: "test@example.com" },
          },
        }),
      });
    });

    await page.goto(`/checkout/success?orderId=${mockOrderId}`);

    await expect(page.getByRole("heading", { name: /GRACIAS POR/i })).toBeVisible();
    await expect(page.getByText("AS-TEST-001")).toBeVisible();
    await expect(page.getByText("Jersey de Prueba E2E")).toBeVisible();
    await expect(page.getByText(/Pago Verificado/i)).toBeVisible();
  });
});
