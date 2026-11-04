import assert from 'node:assert/strict';
import test from 'node:test';
import { buildYouthOrderSheet, youthOrderFilename } from './youthIslandOrder.js';

const form = {
  customerName: 'Eksempel v/ Søren', startDateTime: '2026-08-31T18:00', endDateTime: '2026-09-02T13:00',
  orderDate: '2026-04-08', location: 'Raket', spectraReservationNumber: '25646', allergies: 'Afventer',
  notes: 'Medbring kaffe', snackTrayCount: '2',
  items: [
    { guestCount: '15', servingDateTime: '2026-09-02T08:30', productName: 'Morgenmad', menu: 'Morgenmad', room: 'Raket' },
    { guestCount: '15', servingDateTime: '2026-08-31T19:30', productName: 'Den lille middag', menu: 'Den lille middag', room: 'Raket' },
    { guestCount: '15', servingDateTime: '2026-09-01T11:30', productName: 'Frokost smørrebrød', room: 'Raket' },
  ],
};

test('reference-style order sheet groups servings chronologically and counts people once', () => {
  const sheet = buildYouthOrderSheet(form, { firstName: 'Anne', lastName: 'Øster', email: 'test@example.test' });
  assert.equal(sheet.title, 'BESTILLINGSFORMULAR:');
  assert.equal(sheet.rows.find(([label]) => label === 'Antal')[1], '15');
  assert.equal(sheet.rows.find(([label]) => label === 'Dato')[1], '31.08-02.09.2026');
  assert.equal(sheet.rows.find(([label]) => label === 'Forplejning')[1], '31.08\n19:30 Den lille middag\n\n01.09\n11:30 Frokost smørrebrød\n\n02.09\n08:30 Morgenmad');
  assert.equal(sheet.orderDate, '08.04.2026');
  assert.equal(sheet.orderedBy, 'Anne Øster');
  assert.equal(sheet.rows.find(([label]) => label === 'Andet')[1], 'Medbring kaffe');
});

test('different line quantities, room, menu, and special prices remain on the order sheet', () => {
  const sheet = buildYouthOrderSheet({ ...form, items: [form.items[0], {
    guestCount: '12', servingDateTime: '2026-09-01T18:00', productNumber: '1019', productName: 'Særlig middag',
    menu: 'Vegansk menu', room: 'Artilleri', unitPriceOverride: '87.50',
  }] }, { name: 'Original bestiller' });
  assert.equal(sheet.rows.find(([label]) => label === 'Antal')[1], '12-15 (pr. servering)');
  const text = sheet.rows.find(([label]) => label === 'Forplejning')[1];
  for (const value of ['Særlig middag', 'Vegansk menu', 'Artilleri', '12 personer', '87,50 kr.']) assert.ok(text.includes(value));
  assert.equal(sheet.orderedBy, 'Original bestiller');
});

test('cross-year events show both years and exports use a PDF filename', () => {
  const sheet = buildYouthOrderSheet({ ...form, startDateTime: '2026-12-31T18:00', endDateTime: '2027-01-02T10:00' }, {});
  assert.equal(sheet.rows.find(([label]) => label === 'Dato')[1], '31.12.2026-02.01.2027');
  assert.equal(youthOrderFilename(form), '2026-08-31-eksempel-v-soren.pdf');
});
