import { getProduct } from './products.js';
import { createTransaction, getCurrentTransaction } from './transactions.js';

let processing = false;
const failure = message => ({ success: false, message });

function validateOrder(order) {
  if (!order || !Array.isArray(order.items) || !order.items.length) throw new Error('Add a product before paying.');
  const ids = new Set();
  let total = 0;
  for (const item of order.items) {
    const product = getProduct(item.id);
    if (!product || ids.has(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
        item.price !== product.price || item.subtotal !== product.price * item.quantity) {
      throw new Error('Your order is invalid. Go back and review it before paying.');
    }
    ids.add(item.id);
    total += item.subtotal;
  }
  if (!Number.isFinite(total) || total <= 0 || total !== order.total) throw new Error('The order total is invalid. Review your order.');
  return { items: order.items.map(item => ({ ...item })), total };
}

async function pay(order, method, enteredAmount, simulated = false) {
  if (processing) return failure('A payment is already processing. Please wait.');
  if (getCurrentTransaction()) return failure('This order has already been paid. Start a new transaction.');
  processing = true;
  try {
    const snapshot = validateOrder(order);
    const amountPaid = method === 'Cash' ? enteredAmount : snapshot.total;
    if (!Number.isFinite(amountPaid) || amountPaid < 0 || !Number.isSafeInteger(Math.round(amountPaid * 100)) ||
        Math.abs(amountPaid * 100 - Math.round(amountPaid * 100)) > 0.000001) {
      return failure('Enter a valid cash amount with no more than two decimal places.');
    }
    if (amountPaid < snapshot.total) return failure('The amount paid is less than the amount due.');
    // Classroom simulation: no payment provider or card reader is contacted.
    if (simulated) await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, transaction: createTransaction(snapshot, method, amountPaid) };
  } catch (error) {
    return failure(error.message || 'Payment failed. Please try again.');
  } finally { processing = false; }
}

export function payCash(order, amountPaid) { return pay(order, 'Cash', amountPaid); }
export function payQR(order) { return pay(order, 'QR Payment (Simulated)', undefined, true); }
export function payCard(order) { return pay(order, 'Credit/Debit Card (Simulated)', undefined, true); }
