const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
import { iconMarkup } from './icons.js';
const mounts = new WeakMap();
const amount = value => typeof value === 'number' && Number.isFinite(value) ? money.format(value) : '—';
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function button(text, className, action) {
  const element = node('button', text, className);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}
function mount(container, title) {
  mounts.get(container)?.();
  let active = true;
  const dispose = () => { active = false; };
  mounts.set(container, dispose);
  const panel = node('section', undefined, 'payment-panel');
  const heading = node('h1', title);
  heading.tabIndex = -1;
  const feedback = node('p', '', 'payment-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  panel.append(heading);
  container.replaceChildren(panel);
  heading.focus();
  return { panel, feedback, dispose, active: () => active };
}
function details(transaction) {
  const list = node('dl', undefined, 'payment-details');
  for (const [label, value] of [
    ['Transaction No.', transaction.reference ?? '—'],
    ['Date', transaction.date ?? '—'],
    ['Payment method', transaction.paymentMethod ?? '—'],
    ['Total', amount(transaction.total)],
    ['Amount paid', amount(transaction.amountPaid)],
    ['Change', amount(transaction.change)],
  ]) list.append(node('dt', label), node('dd', value));
  return list;
}

/**
 * UI only. Payment callbacks return { success: false, message } or
 * { success: true, transaction }. onCashPay receives a number (NaN for blank).
 * Transaction: { reference, date, paymentMethod, items, total, amountPaid, change }.
 * Optional onNewTransaction performs the caller's reset/navigation, never this module.
 * Returns a disposer; call it before removing the container during pending work.
 */
export function renderPaymentUI(container, order, {
  onBack, onCashPay, onQRConfirm, onCardPay, onNewTransaction,
} = {}) {
  const view = mount(container, 'How would you like to pay?');
  const { panel, feedback } = view;
  let busy = false;
  let completed = false;
  let cashValue = '';
  const due = node('div', undefined, 'total payment-due');
  due.append(node('span', 'Amount due'), node('strong', amount(order.total)));
  const methods = node('div', undefined, 'payment-methods');
  methods.setAttribute('role', 'group');
  methods.setAttribute('aria-label', 'Payment methods');
  const content = node('div', undefined, 'payment-content');
  const back = button('← Back', 'back', () => runNavigation(onBack));
  panel.append(due, methods, content, feedback, back);

  function setBusy(value) {
    busy = value;
    panel.setAttribute('aria-busy', String(value));
    for (const control of panel.querySelectorAll('button, input')) control.disabled = value;
  }
  async function runNavigation(callback) {
    if (busy || completed || !view.active()) return;
    setBusy(true);
    try {
      if (typeof callback !== 'function') throw new Error('Back navigation is not connected.');
      await callback();
    } catch (error) {
      if (view.active()) feedback.textContent = error?.message || 'Unable to go back.';
    } finally { if (view.active()) setBusy(false); }
  }
  async function pay(callback, ...args) {
    if (busy || completed || !view.active()) return;
    setBusy(true);
    feedback.textContent = 'Processing payment… Please wait.';
    try {
      if (typeof callback !== 'function') throw new Error('This payment method is not connected.');
      const result = await callback(...args);
      if (!view.active()) return;
      if (result?.success === false) {
        feedback.textContent = result.message || 'Payment was not completed. Please try again.';
      } else if (result?.success === true && result.transaction && typeof result.transaction === 'object') {
        completed = true;
        showSuccess(result.transaction);
      } else {
        feedback.textContent = 'The payment callback returned an invalid result.';
      }
    } catch (error) {
      if (view.active()) feedback.textContent = error?.message || 'Payment failed. Please try again.';
    } finally { if (view.active() && !completed) setBusy(false); }
  }
  function showSuccess(transaction) {
    panel.setAttribute('aria-busy', 'false');
    const heading = node('h1', 'Payment Successful');
    heading.tabIndex = -1;
    panel.replaceChildren(heading, details(transaction), button('View Receipt', 'proceed', () => {
      renderReceiptUI(container, transaction, { onNewTransaction });
    }));
    heading.focus();
  }
  function switchMethod(method) {
    if (busy || completed || !view.active()) return;
    feedback.textContent = '';
    content.replaceChildren(node('h2', method));
    for (const control of methods.children) control.setAttribute('aria-pressed', String(control.textContent === method));
    if (method === 'Cash') {
      const label = node('label', 'Amount paid', 'payment-label');
      const input = node('input', undefined, 'payment-input');
      input.type = 'text'; input.inputMode = 'decimal'; input.autocomplete = 'off';
      input.placeholder = '0.00';
      input.value = cashValue;
      label.append(input);
      const preview = node('p', '', 'payment-change');
      function updatePreview() {
        cashValue = input.value;
        const paid = input.value.trim() === '' ? NaN : Number(input.value);
        preview.textContent = `Change preview: ${Number.isFinite(paid) ? amount(Math.max(0, Math.round((paid - order.total) * 100) / 100)) : '—'}`;
      }
      input.addEventListener('input', updatePreview);
      updatePreview();
      const layout = node('div', undefined, 'cash-layout');
      const fields = node('div', undefined, 'cash-fields');
      const quick = node('div', undefined, 'cash-quick');
      quick.setAttribute('role', 'group'); quick.setAttribute('aria-label', 'Quick cash amounts');
      for (const [text, value] of [['Exact amount', order.total], ['₱100', 100], ['₱200', 200], ['₱500', 500]]) {
        quick.append(button(text, 'cash-quick-button', () => { input.value = String(value); updatePreview(); }));
      }
      preview.setAttribute('aria-live', 'polite');
      fields.append(node('p', 'Tap the keypad to enter the cash received.', 'payment-description'), label, quick, preview);
      const keypad = node('div', undefined, 'cash-keypad');
      keypad.setAttribute('role', 'group'); keypad.setAttribute('aria-label', 'Cash amount keypad');
      for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']) {
        const control = button(key, 'cash-key', () => {
          const value = input.value;
          if (key === '⌫') input.value = value.slice(0, -1);
          else if (key === '.') { if (!value.includes('.')) input.value = `${value || '0'}.`; }
          else if (!value.includes('.') || value.split('.')[1].length < 2) input.value = value === '0' ? key : value + key;
          updatePreview();
        });
        if (key === '⌫') control.setAttribute('aria-label', 'Delete last digit');
        if (key === '.') control.setAttribute('aria-label', 'Decimal point');
        keypad.append(control);
      }
      keypad.append(button('Clear amount', 'cash-clear', () => { input.value = ''; updatePreview(); }));
      layout.append(fields, keypad);
      content.append(layout, node('p', 'Check the cash received before tapping Pay Now.', 'stage-note'),
        button('Pay Now', 'proceed', () => pay(onCashPay, input.value.trim() === '' ? NaN : Number(input.value))));
    } else if (method === 'QR Payment') {
      content.append(node('div', 'QR CODE PLACEHOLDER — not scannable', 'payment-qr'),
        node('p', `Amount due: ${amount(order.total)}`),
        node('p', 'Simulation only: no scan or money transfer is required. Tap Confirm Payment to simulate a successful payment.', 'payment-description'),
        button('Confirm Payment', 'proceed', () => pay(onQRConfirm)));
    } else {
      content.append(node('p', `Amount due: ${amount(order.total)}`),
        node('p', 'Tap, insert, or swipe at a connected terminal. In this simulation, tap Process Payment; no card details or real charge are required.', 'payment-description'),
        button('Process Payment', 'proceed', () => pay(onCardPay)));
    }
  }
  for (const method of ['Cash', 'QR Payment', 'Credit/Debit Card']) {
    const choice = button(method, 'back', () => switchMethod(method));
    const symbol = node('span', undefined, 'payment-method-icon');
    symbol.innerHTML = iconMarkup(method); choice.prepend(symbol); methods.append(choice);
  }
  switchMethod('Cash');
  return view.dispose;
}

/** Render only the supplied transaction; onNewTransaction owns reset/navigation. */
export function renderReceiptUI(container, transaction, { onNewTransaction } = {}) {
  const view = mount(container, 'Your receipt');
  const { panel, feedback } = view;
  const wrap = node('div', undefined, 'payment-table-wrap');
  const table = node('table', undefined, 'payment-table');
  table.append(node('caption', 'Purchased items', 'payment-visually-hidden'));
  const head = node('thead'); const header = node('tr');
  for (const label of ['Product', 'Quantity', 'Unit price', 'Subtotal']) {
    const cell = node('th', label); cell.scope = 'col'; header.append(cell);
  }
  head.append(header); table.append(head);
  const body = node('tbody');
  for (const item of transaction.items ?? []) {
    const row = node('tr');
    for (const value of [item.name, item.quantity, amount(item.price), amount(item.subtotal)]) row.append(node('td', value));
    body.append(row);
  }
  table.append(body); wrap.append(table);
  let busy = false;
  let finished = false;
  const reset = button('New Transaction', 'proceed', async () => {
    if (busy || finished || !view.active()) return;
    busy = true; reset.disabled = true; panel.setAttribute('aria-busy', 'true');
    feedback.textContent = 'Starting a new transaction…';
    try {
      if (typeof onNewTransaction !== 'function') throw new Error('New Transaction is not connected.');
      const result = await onNewTransaction();
      if (!view.active()) return;
      if (result?.success === false) throw new Error(result.message || 'Unable to start a new transaction.');
      finished = true;
      feedback.textContent = 'New transaction started.';
    } catch (error) {
      if (view.active()) feedback.textContent = error?.message || 'Unable to start a new transaction.';
    } finally {
      if (view.active()) { busy = false; reset.disabled = finished; panel.setAttribute('aria-busy', 'false'); }
    }
  });
  panel.append(details(transaction), wrap, node('p', 'Thank you for your purchase!'), reset, feedback);
  return view.dispose;
}

