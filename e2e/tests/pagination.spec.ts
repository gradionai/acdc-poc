import { test, expect } from '@playwright/test';

// Creates `count` notes with unique titles and returns them.
async function seedNotes(page: import('@playwright/test').Page, count: number): Promise<string[]> {
  const titles: string[] = [];
  for (let i = 1; i <= count; i++) {
    const title = `Pagination note ${Date.now()}-${i}`;
    titles.push(title);
    const titleInput = page.getByLabel(/title/i);
    await titleInput.fill(title);
    await page.getByLabel(/body/i).fill(`body ${i}`);
    await page.getByRole('button', { name: /add note/i }).click();
    // Wait for form to reset (title cleared) — confirms the note was accepted
    // before proceeding. The note may land on page 2+ and not be visible in the
    // current list, so we cannot rely on the list containing the new title.
    await expect(titleInput).toHaveValue('');
  }
  return titles;
}

test('pagination: next/prev controls work across multiple pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

  // Seed 6 notes so we have 2 pages (pageSize = 5)
  const titles = await seedNotes(page, 6);

  // After creating 6 notes the UI resets to page 1.
  // The oldest 5 notes should appear on page 1, newest on page 2.
  // Check page 1: Previous disabled, Next enabled
  const prevBtn = page.getByRole('button', { name: /previous page/i });
  const nextBtn = page.getByRole('button', { name: /next page/i });

  await expect(prevBtn).toBeDisabled();
  await expect(nextBtn).toBeEnabled();

  // Verify a note from page 1 is visible and the 6th (last created) is not
  await expect(page.getByRole('list')).toContainText(titles[0]);
  await expect(page.getByRole('list')).not.toContainText(titles[5]);

  // Navigate forward to page 2
  await nextBtn.click();
  await expect(page.getByRole('list')).toContainText(titles[5]);
  await expect(page.getByRole('list')).not.toContainText(titles[0]);

  // On the last page: Next disabled, Previous enabled
  await expect(nextBtn).toBeDisabled();
  await expect(prevBtn).toBeEnabled();

  // Navigate back to page 1
  await prevBtn.click();
  await expect(page.getByRole('list')).toContainText(titles[0]);
  await expect(page.getByRole('list')).not.toContainText(titles[5]);

  await expect(prevBtn).toBeDisabled();
  await expect(nextBtn).toBeEnabled();

  // Clean up: delete all seeded notes
  for (const title of titles) {
    // Navigate to the page containing this note if needed
    let item = page.getByRole('listitem').filter({ hasText: title });
    if (!(await item.isVisible())) {
      // Try next page
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        item = page.getByRole('listitem').filter({ hasText: title });
      } else {
        // Try prev page
        await prevBtn.click();
        item = page.getByRole('listitem').filter({ hasText: title });
      }
    }
    if (await item.isVisible()) {
      await item.getByRole('button', { name: /delete/i }).click();
      await expect(item).toHaveCount(0);
    }
  }
});
