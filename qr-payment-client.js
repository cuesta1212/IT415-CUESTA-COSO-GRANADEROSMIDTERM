export async function requestQRPayment(action, order, amountPaid) {
  const response = await fetch('/api/qr-payment', {
    method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, requestId: order.requestId, items: order.items, ...(amountPaid === undefined ? {} : { amountPaid }) }),
    signal: AbortSignal.timeout(10000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('Payment API is unavailable. Open the deployed website or use npm start for local testing.'); }
  if (!response.ok || !result.success) throw new Error(result.message || 'Unable to complete payment. Please try again.');
  return result;
}
