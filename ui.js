import { renderPaymentUI } from './payment-ui.js';
import { products, getProduct } from './products.js';
import { addItem, increaseQuantity, decreaseQuantity, removeItem, getOrder, clearCart } from './cart.js';

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const productGrid = document.querySelector('#products');
const cart = document.querySelector('#cart');
const feedback = document.querySelector('#feedback');
const proceed = document.querySelector('#proceed');
let category = 'All';
let announcementTimer;
const presentation = {
  coffee: { category: 'Drinks', icon: '☕', color: 'coffee' },
  sandwich: { category: 'Food', icon: '🥪', color: 'sandwich' },
  'soft-drink': { category: 'Drinks', icon: '🥤', color: 'soft-drink' },
  cookies: { category: 'Snacks', icon: '🍪', color: 'cookies' },
  water: { category: 'Drinks', icon: '💧', color: 'bottled-water' },
  chocolate: { category: 'Snacks', icon: '🍫', color: 'chocolate' },
};

function announce(message) {
  clearTimeout(announcementTimer);
  feedback.textContent = '';
  announcementTimer = setTimeout(() => { feedback.textContent = message; }, 30);
}

function renderProducts(order) {
  productGrid.replaceChildren();
  for (const product of products.filter(item => category === 'All' || presentation[item.id].category === category)) {
    const visual = presentation[product.id];
    const quantity = order.items.find(item => item.id === product.id)?.quantity ?? 0;
    const button = document.createElement('button');
    button.className = `product-card ${quantity ? 'selected' : ''}`;
    button.dataset.id = product.id;
    button.setAttribute('aria-label', `Add ${product.name}, ${money.format(product.price)}${quantity ? `, ${quantity} in cart` : ''}`);
    button.innerHTML = `<span class="product-art ${visual.color}" aria-hidden="true">${visual.icon}</span>
      <span class="product-info"><strong>${product.name}</strong><span>${money.format(product.price)}</span></span>
      ${quantity ? `<span class="badge" aria-hidden="true">${quantity}</span>` : ''}`;
    productGrid.append(button);
  }
}

function renderCart(order) {
  cart.replaceChildren();
  if (!order.items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<span aria-hidden="true">🛍</span><h3>Your order is empty</h3><p>Tap a product to add it to your order.</p>';
    cart.append(empty);
  }
  for (const item of order.items) {
    const row = document.createElement('article');
    row.className = 'cart-item';
    row.innerHTML = `<div class="item-heading"><div><h3>${item.name}</h3><span>${money.format(item.price)} each</span></div>
      <button class="remove" data-action="remove" data-id="${item.id}" aria-label="Remove ${item.name}">Remove</button></div>
      <div class="item-bottom"><div class="quantity-controls">
      <button data-action="decrease" data-id="${item.id}" aria-label="Decrease ${item.name} quantity">−</button>
      <span aria-label="Quantity ${item.quantity}">${item.quantity}</span>
      <button class="increase" data-action="increase" data-id="${item.id}" aria-label="Increase ${item.name} quantity">+</button>
      </div><strong>${money.format(item.subtotal)}</strong></div>`;
    cart.append(row);
  }
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('#item-count').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  document.querySelector('#total').textContent = money.format(order.total);
  proceed.disabled = !order.items.length;
}

function render() {
  // Preserve keyboard focus when quantity controls or product cards are rebuilt.
  const active = document.activeElement;
  const focusId = active?.dataset.id;
  const focusAction = active?.dataset.action;
  const inCart = cart.contains(active);
  const order = getOrder();
  renderProducts(order);
  renderCart(order);
  if (focusId) {
    const scope = inCart ? cart : productGrid;
    const target = [...scope.querySelectorAll('button')].find(button => button.dataset.id === focusId && button.dataset.action === focusAction);
    if (target) target.focus();
    else if (inCart) (cart.querySelector('button') ?? productGrid.querySelector('button'))?.focus();
  }
}

const filters = document.querySelector('.filters');
for (const name of ['All', 'Drinks', 'Food', 'Snacks']) {
  const button = document.createElement('button');
  button.textContent = name;
  button.setAttribute('aria-pressed', String(name === category));
  button.addEventListener('click', () => {
    category = name;
    for (const filter of filters.children) filter.setAttribute('aria-pressed', String(filter === button));
    renderProducts(getOrder());
  });
  filters.append(button);
}

productGrid.addEventListener('click', event => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  try {
    addItem(button.dataset.id);
    render();
    announce(`Product added — ${getProduct(button.dataset.id).name}.`);
  } catch (error) { announce(error.message); }
});

cart.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { id, action } = button.dataset;
  const name = getProduct(id).name;
  try {
    if (action === 'increase') increaseQuantity(id);
    if (action === 'decrease') decreaseQuantity(id);
    if (action === 'remove') removeItem(id);
    render();
    const remaining = getOrder().items.find(item => item.id === id);
    announce(remaining ? `${name} quantity updated to ${remaining.quantity}.` : `Product removed — ${name}.`);
  } catch (error) { announce(error.message); }
});

const selectionScreen = document.querySelector('#selection-screen');
const reviewScreen = document.querySelector('#review-screen');
const continuePayment = document.querySelector('#continue-payment');
const paymentScreen = document.querySelector('#payment-screen');
let disposePayment;

function returnToSelection(reset = false) {
  disposePayment?.();
  disposePayment = undefined;
  if (reset) clearCart();
  reviewScreen.hidden = true;
  if (reset) document.querySelector('#review-items').replaceChildren();
  paymentScreen.replaceChildren();
  paymentScreen.hidden = true;
  selectionScreen.hidden = false;
  feedback.hidden = false;
  document.querySelector('.stage').textContent = '1 Order';
  document.title = 'Campus Store | Order';
  render();
  (reset ? productGrid.querySelector('button') : proceed)?.focus();
  window.scrollTo(0, 0);
  announce(reset ? 'New transaction started — previous order cleared.' : 'Back to order. Your cart has been preserved.');
}

function paymentUnavailable() {
  return { success: false, message: 'Payment processing is not connected yet. Your order has not been paid.' };
}

continuePayment.addEventListener('click', () => {
  const order = getOrder();
  if (!order.items.length) return;
  clearTimeout(announcementTimer);
  feedback.textContent = '';
  feedback.hidden = true;
  selectionScreen.hidden = true;
  reviewScreen.hidden = true;
  paymentScreen.hidden = false;
  document.querySelector('.stage').textContent = '3 Payment';
  document.title = 'Campus Store | Payment';
  disposePayment = renderPaymentUI(paymentScreen, order, {
    // Replace these unavailable callbacks when Renelyn's modules are ready.
    onCashPay: paymentUnavailable,
    onQRConfirm: paymentUnavailable,
    onCardPay: paymentUnavailable,
    onBack: () => showReview(),
    onNewTransaction: () => returnToSelection(true),
  });
  window.scrollTo(0, 0);
});

function showReview() {
  const order = getOrder();
  if (!order.items.length) { returnToSelection(); return; }
  disposePayment?.();
  disposePayment = undefined;
  paymentScreen.replaceChildren();
  paymentScreen.hidden = true;
  selectionScreen.hidden = true;
  reviewScreen.hidden = false;
  feedback.hidden = false;
  const rows = document.querySelector('#review-items');
  rows.replaceChildren();
  for (const item of order.items) {
    const row = document.createElement('tr');
    for (const value of [item.name, item.quantity, money.format(item.price), money.format(item.subtotal)]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    rows.append(row);
  }
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('#review-count').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  document.querySelector('#review-total').textContent = money.format(order.total);
  continuePayment.disabled = !order.items.length;
  document.querySelector('.stage').textContent = '2 Review';
  document.title = 'Campus Store | Review';
  document.querySelector('#review-title').focus();
  window.scrollTo(0, 0);
  announce('Review your order. Tap Back to edit your cart.');
}

proceed.addEventListener('click', showReview);
document.querySelector('#review-back').addEventListener('click', () => returnToSelection());
render();
