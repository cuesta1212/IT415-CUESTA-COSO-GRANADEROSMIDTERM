import { getProduct } from '../products.js';

// Stateless classroom demo: validate each request, return a receipt, store nothing.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST'); send(405, { success: false, message: 'Method not allowed.' }); return;
  }
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || !['quote', 'confirm'].includes(body.action) ||
        !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(body.requestId || '')) {
      throw new Error('Invalid payment link. Scan a new QR from the kiosk.');
    }
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 6) throw new Error('Invalid order.');
    const ids = new Set();
    const items = body.items.map(item => {
      const product = getProduct(item?.id);
      if (!product || ids.has(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 9999) throw new Error('Invalid order items.');
      ids.add(item.id);
      return { id: product.id, name: product.name, price: product.price, quantity: item.quantity, subtotal: product.price * item.quantity };
    });
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (body.action === 'quote') { send(200, { success: true, order: { items, total } }); return; }
    if (!Number.isFinite(body.amountPaid) || Math.abs(body.amountPaid * 100 - Math.round(body.amountPaid * 100)) > 0.000001 ||
        Math.round(body.amountPaid * 100) !== Math.round(total * 100)) {
      throw new Error(`Enter the exact amount due: ₱${total.toFixed(2)}.`);
    }
    send(200, { success: true, transaction: {
      reference: `PP-QR-${body.requestId}`, date: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Singapore' }),
      paymentMethod: 'QR Payment (Simulated)', items, total, amountPaid: body.amountPaid, change: 0,
    } });
  } catch (error) { send(400, { success: false, message: error instanceof SyntaxError ? 'Invalid request.' : error.message }); }
}
