# IT415-CUESTA-COSO-GRANADEROSMIDTERM

## Mobile QR payment API — no database

QR Payment contains a link to `mobile-payment.html` with the demo order's product
IDs and quantities. The phone calls `/api/qr-payment` to load the current total.
When the user taps **Confirm Payment**, the API validates the amount and returns
a transaction reference, purchased items, and a receipt displayed on the phone.

No Redis database, database credentials, payment provider, or account setup is
required. The API is stateless and stores no payment records. No real money is
transferred. It does not notify the kiosk or track paid/cancelled/expired sessions.
Kiosk **Confirm Payment**, **View Receipt**, and **New Transaction** remain separate
and continue using the existing transaction functions. Cash and card flows and
product prices are unchanged.

The phone blocks repeated clicks during processing and after confirmation. Its
receipt lasts until the page is reloaded/closed. Repeated API requests are not
durably tracked; the same request ID returns the same reference, but this is not
a real payment gateway or proof of money received. Demo order items in QR links
can be edited; the API recalculates their prices from `products.js` on every request.

## Deploy the changes to Vercel

1. Commit and push the changes to your repository's `main` branch.
2. Deploy/redeploy the project in Vercel. Use **Other**, the repository root, no
   build command, and `.` as the output directory.
3. The `api/qr-payment.js` Node.js function must be included with the static UI.
4. Open your public production URL on the kiosk and generate a fresh QR.
5. Scan it on a phone, check the amount, and tap **Confirm Payment**.
6. The phone should show **Payment Confirmed** and the receipt. Complete the
   kiosk order using its own Confirm Payment button when needed.

Old session-token QR links no longer work; scan a fresh code after deploying.
Upstash variables are no longer used. Both devices need internet for a public
deployment and do not need the same Wi-Fi. URLs are generated from the current
website address. A localhost QR cannot open on a different device.

## Local testing

With Node.js 22 or newer:

```sh
npm start
```

Open `http://localhost:4179`. For phone testing, connect both devices to the same
Wi-Fi and open the network URL printed by the server on the kiosk. Windows
Firewall may need to allow Node. **VS Code Live Preview serves static files only;
it does not run this API.** Use the local server or Vercel for phone confirmation.

```sh
npm test
```

## API

`POST /api/qr-payment` accepts JSON:

```json
{
  "action": "quote",
  "requestId": "12345678-1234-4234-8234-123456789abc",
  "items": [{ "id": "coffee", "quantity": 1 }]
}
```

`quote` returns `{ success: true, order: { items, total } }`.
For confirmation, use `"action": "confirm"` and add `"amountPaid": 45`.
Confirmation returns `{ success: true, transaction }`; invalid requests return
`{ success: false, message }` with HTTP 400. Browser-supplied prices are ignored.

The MIT-licensed QR generator in `vendor/qrcode.js` is by Kazuhiko Arase:
https://github.com/kazuhikoarase/qrcode-generator. QR images are generated locally.
