/** Render a link-only demo QR. Phone confirmation does not alter kiosk state. */
export function renderPaymentQR(total) {
  const block = document.createElement('div');
  block.className = 'payment-qr payment-qr-scannable';
  const link = document.createElement('a');
  link.className = 'qr-payment-link';
  link.textContent = 'Open demo payment page';
  link.target = '_blank';
  link.rel = 'noopener';
  const note = document.createElement('p');
  note.className = 'payment-description qr-help';
  try {
    if (!Number.isFinite(total) || total <= 0) throw new Error('Review your order before generating a payment QR.');
    if (!['http:', 'https:'].includes(location.protocol)) throw new Error('Open the project through a web server to generate a QR.');
    const url = new URL('./mobile-payment.html', location.href);
    // The URL carries only the demo amount. It is not proof of payment.
    url.hash = new URLSearchParams({ total: String(total) }).toString();
    if (typeof window.qrcode !== 'function') throw new Error('QR generator could not load. Please refresh the page.');
    const qr = window.qrcode(0, 'M');
    qr.addData(url.href);
    qr.make();
    const graphic = document.createElement('div');
    graphic.className = 'payment-qr-image';
    graphic.setAttribute('role', 'img');
    graphic.setAttribute('aria-label', `Scan to open a demo payment for ${total.toFixed(2)} Philippine pesos`);
    graphic.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
    link.href = url.href;
    block.append(graphic, link);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    note.textContent = local
      ? 'Local preview: this QR points to localhost and will not open on your phone. Use your public Vercel production URL to scan from another device.'
      : 'Scan using your phone camera or QR scanner. Your phone needs internet access when this site is publicly hosted.';
  } catch (error) {
    note.textContent = error.message;
  }
  block.append(note);
  return block;
}
