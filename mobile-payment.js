const params = new URLSearchParams(location.hash.slice(1));
const total = Number(params.get('total'));
const validOrder = params.has('total') && Number.isFinite(total) && total > 0 &&
  Number.isSafeInteger(Math.round(total * 100)) && Math.abs(total * 100 - Math.round(total * 100)) < 0.000001;
const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const form = document.querySelector('#mobile-payment-form');
const input = document.querySelector('#mobile-amount');
const feedback = document.querySelector('#mobile-feedback');
let completed = false;

document.querySelector('#mobile-total').textContent = validOrder ? money.format(total) : 'Invalid order';
function clearFeedback() { if (!completed) feedback.textContent = ''; }
input.addEventListener('input', clearFeedback);
for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = key;
  if (key === '⌫') button.setAttribute('aria-label', 'Delete last digit');
  if (key === '.') button.setAttribute('aria-label', 'Decimal point');
  button.addEventListener('click', () => {
    if (completed) return;
    const value = input.value;
    if (key === '⌫') input.value = value.slice(0, -1);
    else if (key === '.') { if (!value.includes('.')) input.value = `${value || '0'}.`; }
    else if (!value.includes('.') || value.split('.')[1].length < 2) input.value = value === '0' ? key : value + key;
    clearFeedback();
  });
  document.querySelector('#mobile-keypad').append(button);
}
document.querySelector('#mobile-clear').addEventListener('click', () => { input.value = ''; clearFeedback(); });
document.querySelector('#mobile-exact').addEventListener('click', () => { if (validOrder) input.value = total.toFixed(2); clearFeedback(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  if (completed || !validOrder) return;
  const paid = Number(input.value.trim());
  if (!/^\d+(\.\d{1,2})?$/.test(input.value.trim()) || !Number.isFinite(paid) || !Number.isSafeInteger(Math.round(paid * 100))) {
    feedback.textContent = 'Enter a valid amount with up to two decimal places.';
    return;
  }
  if (Math.round(paid * 100) !== Math.round(total * 100)) {
    feedback.textContent = `Enter the exact amount due: ${money.format(total)}.`;
    return;
  }
  completed = true;
  feedback.textContent = `Demo payment of ${money.format(total)} confirmed! Return to the kiosk and tap Confirm Payment.`;
  for (const control of form.querySelectorAll('button, input')) control.disabled = true;
});
if (!validOrder) {
  feedback.textContent = 'This payment link has no valid amount. Scan a new QR from the kiosk.';
  for (const control of form.querySelectorAll('button, input')) control.disabled = true;
}
