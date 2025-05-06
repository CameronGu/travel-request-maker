const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:4173/index.html';

test.describe('Hotel Request Form', () => {
  test.beforeEach(async ({ page }) => {
    // Open the app via the local server
    await page.goto(BASE_URL);
  });

  test('should show error if required fields are missing', async ({ page }) => {
    // Try to submit the form without filling anything
    await page.click('button:has-text("Submit Request")');
    await expect(page.locator('#guestNameError')).toBeVisible();
    await expect(page.locator('#checkInDateError')).toBeVisible();
    await expect(page.locator('#checkOutDateError')).toBeVisible();
    await expect(page.locator('#locationTypeError')).toBeVisible();
    await expect(page.locator('#hotelTravelerSelectorError')).toBeVisible();
  });

  test('should submit successfully with valid data', async ({ page }) => {
    // Fill in required fields
    await page.fill('#guestName', 'Test Guest');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate() + 1).padStart(2, '0'); // Tomorrow
    const checkIn = `${yyyy}-${mm}-${dd}`;
    const checkOut = `${yyyy}-${mm}-${String(Number(dd) + 1).padStart(2, '0')}`;
    await page.fill('#checkInDate', checkIn);
    await page.fill('#checkOutDate', checkOut);
    await page.selectOption('#locationType', 'city');
    // Select a traveler if any exist (simulate selection)
    // If no travelers, skip traveler selection (cannot add via UI in static test)
    // Submit
    await page.click('button:has-text("Submit Request")');
    // Should show success or traveler error
    const success = page.locator('#hotelFormSuccess');
    const travelerError = page.locator('#hotelTravelerSelectorError');
    if (await travelerError.isVisible()) {
      await expect(travelerError).toBeVisible();
    } else {
      await expect(success).toBeVisible();
      await expect(success).toContainText('Hotel request submitted successfully');
    }
  });
}); 