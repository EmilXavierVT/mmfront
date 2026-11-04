import assert from 'node:assert/strict';
import test from 'node:test';
import { findSpecialServingProduct, getServingDateTime, isSpecialServing } from './youthIsland.js';

test('special serving uses deployed DIVERSE SALG product 1019 regardless of product year', () => {
  const deployedProduct = { economicProductNumber: '1019', name: 'DIVERSE SALG', economicLastUpdated: '2022-06-13', economicAvailable: true };
  assert.equal(findSpecialServingProduct([deployedProduct]), deployedProduct);
  assert.equal(isSpecialServing({ productNumber: '1019' }), true);
  assert.equal(isSpecialServing({ productNumber: 'DIVERSE' }), true);
  assert.equal(isSpecialServing({ productNumber: '1092' }), false);
  assert.equal(findSpecialServingProduct([{ ...deployedProduct, economicAvailable: false }]), undefined);
});

test('explicit serving date is preserved across midnight, with legacy time-only fallback', () => {
  const booking = { eventDate: '2026-11-04', startDateTime: '2026-11-04T18:00:00' };
  assert.equal(getServingDateTime({ servingDateTime: '2026-11-05T08:30:00', servingTime: '08:30:00' }, booking), '2026-11-05T08:30:00');
  assert.equal(getServingDateTime({ servingTime: '19:15:00' }, booking), '2026-11-04T19:15:00');
  assert.equal(getServingDateTime({}, booking), '');
});
