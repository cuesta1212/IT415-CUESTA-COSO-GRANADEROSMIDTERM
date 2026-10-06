/** The QR carries demo order items; the phone API calculates the actual total. */
export function renderPaymentQR(order) {
  const block = document.createElement('div'); block.className = 'payment-qr payment-qr-scannable';
  const note = document.createElement('p'); note.className = 'payment-description qr-help';
  try {
    if (!['http:', 'https:'].includes(location.protocol)) throw new Error('Open the project through a web server to generate a QR.');
    if (typeof window.qrcode !== 'function') throw new Error('QR generator could not load. Please refresh the page.');
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const requestId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    const data = { requestId, items: order.items.map(({ id, quantity }) => ({ id, quantity })) };
    const url = new URL('./mobile-payment.html', location.href);
    url.hash = new URLSearchParams({ order: JSON.stringify(data) }).toString();
    const qr = window.qrcode(0, 'M'); qr.addData(url.href); qr.make();
    const graphic = document.createElement('div'); graphic.className = 'payment-qr-image';
    graphic.setAttribute('role', 'img'); graphic.setAttribute('aria-label', 'Scan to open the phone payment page');
    graphic.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
    const link = document.createElement('a'); link.className = 'qr-payment-link';
    link.textContent = 'Open payment page'; link.href = url.href; link.target = '_blank'; link.rel = 'noopener';
    block.append(graphic, link);
    note.textContent = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
      ? 'This local address cannot be opened on a phone. Open the kiosk through your public Vercel URL or a same-Wi-Fi network address.'
      : 'Scan using your phone camera. Confirm Payment on the phone creates a demo receipt on that device.';
  } catch (error) { note.textContent = error.message; }
  block.append(note); return block;
}
