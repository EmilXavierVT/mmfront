import assert from 'node:assert/strict';
import test from 'node:test';
import { getCleaningInvoiceBatchNotice } from './cleaningInvoiceResult.js';

test('shows partial failures with the actual counts', () => {
  assert.deepEqual(getCleaningInvoiceBatchNotice({ succeeded: 1, failed: 2, skipped: 3 }, true), {
    type: 'error',
    message: '1 booked for email, 2 failed, 3 skipped.',
  });
});

test('shows an informational result when all invoices were skipped', () => {
  assert.deepEqual(getCleaningInvoiceBatchNotice({ succeeded: 0, failed: 0, skipped: 3 }, true), {
    type: 'info',
    message: '0 booked for email, 0 failed, 3 skipped.',
  });
});

test('reports successful drafts as drafts', () => {
  assert.deepEqual(getCleaningInvoiceBatchNotice({ succeeded: 2, failed: 0, skipped: 0 }, false), {
    type: 'success',
    message: '2 drafts created, 0 failed, 0 skipped.',
  });
});

test('does not assume success when the backend omits the outcome', () => {
  const notice = getCleaningInvoiceBatchNotice(undefined, true);
  assert.equal(notice.type, 'error');
  assert.match(notice.message, /Check e-conomic/);
});
