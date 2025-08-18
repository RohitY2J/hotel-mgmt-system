import { test, expect } from 'playwright/test';
import { testEnv } from '../env/environment';

test.describe('Room Component E2E Tests', () => {
  let jwtToken: string;

  test.beforeEach(async ({ page }) => {
    // Login to obtain JWT token
    await page.goto(`${testEnv.FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[formControlName="email"]', 'test@gmail.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify login success and extract JWT token from localStorage
    await page.waitForURL(`${testEnv.FRONTEND_URL}/admin/dashboard`, {timeout: 5000});
    jwtToken = await page.evaluate(() => localStorage.getItem('accessToken') || '');
    expect(jwtToken).toBeTruthy(); // Ensure token exists

    // Navigate to rooms page
    await page.goto(`${testEnv.FRONTEND_URL}/admin/rooms`, { waitUntil: 'networkidle' });
  });

  /**
   * the token is valid only for 1 minute
   * increase time span to check if this code works
   */
  test.skip('should create a list new rooms successfully', async ({ page }) => {
    // Define room data (roomNumber: 100 to 120, price, and status)
    const rooms = Array.from({ length: 21 }, (_, i) => ({
      roomNumber: (100 + i).toString(),
      pricePerDay: Math.floor(Math.random() * (1000 - 100 + 1) + 100).toString(),
      occupancyStatus: Math.floor(Math.random() * 3).toString(),
      maintainanceStatus: Math.floor(Math.random() * 2).toString()
    }));

    const checkIfRoomExists = async (room: {roomNumber: string}) => {
      const { token, roomNumber } = { token: jwtToken, roomNumber: room.roomNumber };
        const res = await fetch(`${testEnv.BACKEND_URL}/room/getRooms?pageSize=12&pageNo=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ roomNumber })
        });
        const data = await res.json();
        return  { status: res.status, count: Array.isArray(data) ? data.length : 0 };
    }

    // Measure page load time
    const startTime = performance.now();
    await page.goto(`${testEnv.FRONTEND_URL}/admin/rooms`, { waitUntil: 'networkidle' });
    const loadTime = performance.now() - startTime;
    console.log(`Rooms page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Fail if page load > 2 seconds

    // Iterate over rooms to create or verify
    for (const room of rooms) {
      const roomCheckResponse = await checkIfRoomExists(room);
      const roomExists = roomCheckResponse.status === 200 && roomCheckResponse.count === 1;
      
      if (roomExists) {
        
        let verifyResponse = await checkIfRoomExists(room);
        expect(verifyResponse.status).toBe(200);
        expect(verifyResponse.count).toBe(1);
        console.log(`Room ${room.roomNumber} already exists`);
      } else {
        // Click "Add Room" button to open form
        await page.click('button:has-text("Add Room")');

        // Verify modal is visible
        await expect(page.locator('form')).toBeVisible();

        // Fill form fields
        await page.fill('input[formControlName="roomNumber"]', room.roomNumber);
        await page.fill('input[formControlName="pricePerDay"]', room.pricePerDay);
        await page.selectOption('select[formControlName="occupancyStatus"]', room.occupancyStatus);
        await page.selectOption('select[formControlName="maintainanceStatus"]', room.maintainanceStatus);

        // Submit form
        await page.click('button:has-text("Save")');

        // Close modal
        //await page.click('button:has-text("Close")');
        await expect(page.locator('form')).not.toBeVisible();

        let verifyResponse = await checkIfRoomExists(room);
        expect(verifyResponse.status).toBe(200);
        expect(verifyResponse.count).toBe(1);

        // Verify new room appears in the list
        //await expect(page.getByText(`${room.roomNumber}`, { exact: true })).toBeVisible();
        console.log(`Room ${room.roomNumber} created successfully`);
      }
    }
  });

  test.skip('should update an existing room', async ({ page }) => {
    await page.goto(`${testEnv.FRONTEND_URL}/admin/rooms`, { waitUntil: 'networkidle' });
    await page.waitForURL(`${testEnv.FRONTEND_URL}/admin/rooms`);
    // Click "Update" button for the first room
    await page.locator('button:has-text("Update")').first().click();

    // Verify modal is visible
    await expect(page.locator('form')).toBeVisible();

    // Update pricePerDay (roomNumber is disabled during update)
    await page.fill('input[formControlName="pricePerDay"]', '150');
    await page.selectOption('select[formControlName="occupancyStatus"]', '1'); // Assuming '1' is Occupied
    await page.selectOption('select[formControlName="maintainanceStatus"]', '1'); // Assuming '1' is Under Maintenance

    // Submit form
    await page.click('button:has-text("Save")');

    // Wait for success notification
    //await page.waitForSelector('app-notification', { timeout: 5000 });
    //const notification = await page.textContent('app-notification');
    //expect(notification).toContain('Room Updated Successfully');

    // Verify updated room in the list
    await expect(page.getByText('100', {exact: true}).locator('..')).toContainText('Occupied');
    await expect(page.getByText('100', {exact: true}).locator('..')).toContainText('Under Maintenance');
  });

  // test('should show validation errors for invalid form submission', async ({ page }) => {
  //   // Click "Add Room" button to open form
  //   await page.click('button:has-text("Add Room")');

  //   // Submit form without filling fields
  //   await page.click('button:has-text("Save")');

  //   // Verify validation errors
  //   await expect(page.locator('text=Room Number is Required')).toBeVisible();
  //   await expect(page.locator('text=Please select occupancy status')).toBeVisible();
  //   await expect(page.locator('text=Please select Maintenance status')).toBeVisible();

  //   // Close modal
  //   await page.click('button:has-text("Close")');
  //   await expect(page.locator('.modal')).not.toBeVisible();
  // });

  // test('should filter rooms by room number', async ({ page }) => {
  //   // Fill filter input for room number
  //   await page.fill('input[formControlName="roomNumber"]', '101');

  //   // Click Apply button
  //   await page.click('button:has-text("Apply")');

  //   // Verify only room 101 is displayed
  //   await expect(page.locator('text=Room No. 101')).toBeVisible();
  //   await expect(page.locator('app-room-card').count()).toBe(1);
  // });

  // test('should clear filters and show all rooms', async ({ page }) => {
  //   // Apply a filter
  //   await page.fill('input[formControlName="roomNumber"]', '101');
  //   await page.click('button:has-text("Apply")');

  //   // Click Clear button
  //   await page.click('button:has-text("Clear")');

  //   // Verify filter inputs are cleared
  //   await expect(page.locator('input[formControlName="roomNumber"]')).toHaveValue('');
  //   await expect(page.locator('select[formControlName="occupancyStatus"]')).toHaveValue('');
  //   await expect(page.locator('select[formControlName="maintainanceStatus"]')).toHaveValue('');

  //   // Verify all rooms are displayed (assuming more than one room exists)
  //   await expect(page.locator('app-room-card').count()).toBeGreaterThan(1);
  // });

  // test('should navigate to next page using pagination', async ({ page }) => {
  //   // Assuming pagination component emits page change events
  //   await page.locator('app-pagination').locator('button:has-text("Next")').click();

  //   // Verify API call for page 2 with JWT token
  //   const apiResponse = await page.evaluate(async (token) => {
  //     const start = performance.now();
  //     const res = await fetch(`${testEnv.BACKEND_URL}/room/getRooms?pageSize=12&pageNo=2`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({ pagination: { page: 2, pageSize: 12 } })
  //     });
  //     const duration = performance.now() - start;
  //     return { status: res.status, duration };
  //   }, jwtToken);
  //   expect(apiResponse.status).toBe(200);
  //   expect(apiResponse.duration).toBeLessThan(500);

  //   // Verify page number updated (adjust selector based on your pagination component)
  //   await expect(page.locator('app-pagination')).toContainText('2');
  // });
});