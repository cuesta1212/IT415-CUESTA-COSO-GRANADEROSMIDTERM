import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/qr-payment.js';

const order = { requestId: '12345678-1234-4234-8234-123456789abc', items: [{ id: 'coffee', quantity: 1 }, { id: 'sandwich', quantity: 1 }] };
async function call(body, method = 'POST') {
  let result;
  const res = { setHeader() {}, end(value) { result = { status: this.statusCode, ...JSON.parse(value) }; } };
  await handler({ method, body }, res);
  return result;
}
test('API calculates product prices and returns a receipt without database configuration', async () => {
  const quote = await call({ action: 'quote', ...order, total: 1 });
  assert.equal(quote.status, 200); assert.equal(quote.order.total, 95);
  const confirmed = await call({ action: 'confirm', ...order, amountPaid: 95 });
  assert.equal(confirmed.status, 200); assert.equal(confirmed.transaction.total, 95);
  assert.equal(confirmed.transaction.amountPaid, 95); assert.equal(confirmed.transaction.change, 0);
  assert.equal(confirmed.transaction.items.length, 2);
  assert.equal((await call({ action: 'confirm', ...order, amountPaid: 95 })).transaction.reference, confirmed.transaction.reference);
});
test('API rejects invalid amounts and manipulated or malformed orders', async () => {
  for (const amountPaid of [0, 94, 100, 95.001, '95', null]) {
    assert.equal((await call({ action: 'confirm', ...order, amountPaid })).status, 400);
  }
  for (const items of [[], [{ id: 'unknown', quantity: 1 }], [{ id: 'coffee', quantity: -1 }], [{ id: 'coffee', quantity: 1.5 }], [{ id: 'coffee', quantity: 1 }, { id: 'coffee', quantity: 1 }]]) {
    assert.equal((await call({ action: 'quote', ...order, items })).status, 400);
  }
  assert.equal((await call('not-json')).status, 400);
  assert.equal((await call({ action: 'quote', ...order, requestId: 'bad-id' })).status, 400);
  assert.equal((await call({ action: 'quote', ...order }, 'GET')).status, 405);
});
