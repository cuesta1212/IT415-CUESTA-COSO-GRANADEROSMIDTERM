import { getProduct } from './products.js';

// Cart state is private. Callers receive independent order snapshots.
const quantities = new Map();

function requireProduct(id) {
  const product = getProduct(id);
  if (!product) throw new RangeError(`Unknown product: ${id}`);
  return product;
}

export function addItem(id) {
  requireProduct(id);
  const quantity = (quantities.get(id) ?? 0) + 1;
  if (!Number.isSafeInteger(quantity)) throw new RangeError('Quantity limit reached.');
  quantities.set(id, quantity);
  return getOrder();
}

export function increaseQuantity(id) {
  return addItem(id);
}

export function decreaseQuantity(id) {
  requireProduct(id);
  const quantity = quantities.get(id) ?? 0;
  if (quantity <= 1) quantities.delete(id);
  else quantities.set(id, quantity - 1);
  return getOrder();
}

export function removeItem(id) {
  requireProduct(id);
  quantities.delete(id);
  return getOrder();
}

export function clearCart() {
  quantities.clear();
  return getOrder();
}

// { items: [{ id, name, price, quantity, subtotal }], total }
// Prices, subtotals, and total are numeric Philippine peso amounts.
export function getOrder() {
  const items = Array.from(quantities, ([id, quantity]) => {
    const { name, price } = requireProduct(id);
    return { id, name, price, quantity, subtotal: price * quantity };
  });
  return { items, total: items.reduce((sum, item) => sum + item.subtotal, 0) };
}
