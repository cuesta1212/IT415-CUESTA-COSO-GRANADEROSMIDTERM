import { clearCart } from './cart.js';

let current = null;
let sequence = 0;
const copy = value => value ? { ...value, items: value.items.map(item => ({ ...item })) } : null;

export function getCurrentTransaction() { return copy(current); }

export function createTransaction(order, paymentMethod, amountPaid) {
  if (current) throw new Error('This order has already been paid. Start a new transaction.');
  const now = new Date();
  current = {
    reference: `PP-${now.toISOString().replace(/\D/g, '')}-${++sequence}`,
    date: now.toLocaleString('en-PH'),
    paymentMethod,
    items: order.items.map(item => ({ ...item })),
    total: order.total,
    amountPaid,
    change: Math.round((amountPaid - order.total) * 100) / 100,
  };
  return copy(current);
}

// Session-only state: receipts are not persisted across page reloads.
export function resetTransaction() {
  current = null;
  clearCart();
  return { success: true };
}
