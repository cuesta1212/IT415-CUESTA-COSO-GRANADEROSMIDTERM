import { requestQRPayment } from './qr-payment-client.js';

// Scanning another QR into an existing browser tab must load the new session.
window.addEventListener('hashchange', () => location.reload());

const params = new URLSearchParams(location.hash.slice(1));
let order;
try { order = JSON.parse(params.get('order')); } catch { /* Show invalid-link feedback below. */ }
const validLink = order && typeof order.requestId === 'string' && Array.isArray(order.items);
const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const form = document.querySelector('#mobile-payment-form');
const input = document.querySelector('#mobile-amount');
const feedback = document.querySelector('#mobile-feedback');
const retry = document.querySelector('#mobile-retry');
const confirm = form.querySelector('[type="submit"]');
let total;
let completed = false;
let busy = false;
function setBusy(value) {
  busy = value;
  form.setAttribute('aria-busy', String(value));
  for (const control of form.querySelectorAll('button, input')) control.disabled = value || completed;
}
function clearFeedback() {
  if (!completed) { feedback.textContent = ''; feedback.classList.remove('is-error'); input.removeAttribute('aria-invalid'); }
}
function showError(message) {
  feedback.textContent = message; feedback.classList.add('is-error');
  feedback.scrollIntoView({ block: 'center', behavior: 'auto' });
}
function showSuccess(transaction) {
  completed = true; setBusy(false); clearFeedback();
  feedback.textContent = ''; feedback.classList.remove('is-error'); retry.hidden = true;
  form.hidden = true; document.querySelector('.intro').hidden = true;
  document.querySelector('#mobile-success-amount').textContent = `${money.format(total)} · QR payment simulation`;
  const receipt = document.querySelector('#mobile-receipt');
  receipt.replaceChildren();
  const details = document.createElement('dl'); details.className = 'mobile-receipt-details';
  for (const [label, value] of [['Transaction', transaction.reference], ['Date', transaction.date], ['Method', transaction.paymentMethod], ['Total', money.format(transaction.total)], ['Amount paid', money.format(transaction.amountPaid)]]) {
    const term = document.createElement('dt'); term.textContent = label;
    const description = document.createElement('dd'); description.textContent = value;
    details.append(term, description);
  }
  const items = document.createElement('ul'); items.className = 'mobile-receipt-items';
  for (const item of transaction.items) {
    const row = document.createElement('li'); row.textContent = `${item.name} × ${item.quantity} — ${money.format(item.subtotal)}`;
    items.append(row);
  }
  receipt.append(details, items);
  document.querySelector('#mobile-success').hidden = false;
  document.querySelector('#mobile-success-title').focus();
  document.querySelector('#mobile-success').scrollIntoView({ block: 'center', behavior: 'auto' });
}
for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']) {
  const button = document.createElement('button'); button.type = 'button'; button.textContent = key;
  if (key === '⌫') button.setAttribute('aria-label', 'Delete last digit');
  if (key === '.') button.setAttribute('aria-label', 'Decimal point');
  button.addEventListener('click', () => {
    if (completed || busy) return;
    const value = input.value;
    if (key === '⌫') input.value = value.slice(0, -1);
    else if (key === '.') { if (!value.includes('.')) input.value = `${value || '0'}.`; }
    else if (!value.includes('.') || value.split('.')[1].length < 2) input.value = value === '0' ? key : value + key;
    clearFeedback();
  });
  document.querySelector('#mobile-keypad').append(button);
}
input.addEventListener('input', clearFeedback);
document.querySelector('#mobile-clear').addEventListener('click', () => { input.value = ''; clearFeedback(); });
document.querySelector('#mobile-exact').addEventListener('click', () => { if (Number.isFinite(total)) input.value = total.toFixed(2); clearFeedback(); });
async function load() {
  setBusy(true); retry.hidden = true;
  document.querySelector('#mobile-total').textContent = 'Loading…';
  clearFeedback();
  if (!validLink) {
    document.querySelector('#mobile-total').textContent = 'Invalid link';
    showError('This is an old or invalid payment link. Scan a new QR from the kiosk.');
    return;
  }
  try {
    const result = await requestQRPayment('quote', order);
    total = result.order.total;
    document.querySelector('#mobile-total').textContent = money.format(total);
    input.value = total.toFixed(2);
    setBusy(false);
  } catch (error) {
    document.querySelector('#mobile-total').textContent = 'Unavailable';
    showError(error.message);
    retry.hidden = [403, 410].includes(error.status);
  }
}
retry.addEventListener('click', load);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (completed || busy || !Number.isFinite(total)) return;
  const paid = Number(input.value.trim());
  if (!/^\d+(\.\d{1,2})?$/.test(input.value.trim()) || !Number.isFinite(paid) || Math.round(paid * 100) !== Math.round(total * 100)) {
    input.setAttribute('aria-invalid', 'true');
    showError(`Enter the exact amount due: ${money.format(total)}. Tap Exact amount to fill it automatically.`);
    return;
  }
  setBusy(true); clearFeedback(); confirm.textContent = 'Confirming…';
  try {
    const result = await requestQRPayment('confirm', order, paid);
    showSuccess(result.transaction);
  } catch (error) {
    showError(error.message);
    if (![403, 409, 410].includes(error.status)) setBusy(false);
  } finally { confirm.textContent = 'Confirm Payment'; }
});
load();
