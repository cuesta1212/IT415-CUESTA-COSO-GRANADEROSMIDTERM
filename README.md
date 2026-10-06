# PowePuff Store - Touchscreen POS

IT415 midterm project by the Cuesta, Coso, and Granaderos group. A campus-store kiosk built with large touch controls for selecting products, reviewing orders, and choosing a payment method.

## Current status

Working flow: **Order → Review → Payment → Success → Receipt**. Back from payment returns to review; Back from review returns to the editable cart.

Payment callbacks are connected to `payments.js` and `transactions.js`. Cash validates the entered amount and calculates change; QR and Card simulate payment. Success and receipt screens display the resulting transaction. This is a classroom POS simulation with no real payment gateway. The phone-side QR flow uses a stateless API to validate the amount and return its receipt.

## Setup and run

Requirements: a modern browser and Node.js 22 or newer for the mobile payment API. No npm dependencies or build step are required. Use `npm start` as described under Local testing below to run the complete system. The static-server options below support only the kiosk UI, not the phone payment API.

1. Clone the repository (or open your existing checkout):

   ```powershell
   git clone https://github.com/cuesta1212/IT415-CUESTA-COSO-GRANADEROSMIDTERM.git
   cd IT415-CUESTA-COSO-GRANADEROSMIDTERM
   ```

2. Run using either option:

   - **VS Code Live Server:** open the project folder, then right-click `index.html` and choose **Open with Live Server**. Open the URL it displays, usually `http://127.0.0.1:5500`.
   - **Python 3:** run the following from the project folder, then open `http://localhost:8000`:

     ```powershell
     python -m http.server 8000
     ```

     On Windows, `py -m http.server 8000` is an alternative if the Python launcher is installed. Stop the server with **Ctrl+C**.

Serve the project over HTTP instead of double-clicking `index.html`: browser ES module loading requires a server. If a port is already occupied, use another port such as `8001` and open that port's URL. Refresh the browser after changing files.

## Technology and storage choices

- **HTML5:** screen structure, accessible buttons, and order tables.
- **CSS3:** responsive layouts, large touch targets, focus indicators, and consistent kiosk styling.
- **Vanilla JavaScript ES modules:** separate catalog, cart, navigation, and payment rendering without a framework.
- **Philippine peso currency formatting:** `Intl.NumberFormat` displays numeric Philippine peso amounts consistently.
- **In-memory storage:** `cart.js` keeps product quantities in a private JavaScript `Map`. Products are defined in `products.js`. The cart persists between screens during the current page session, but refreshing or closing the page clears it.
- **No persistent storage:** the mobile QR API stores no records and uses no database, `localStorage`, or `sessionStorage`. Transaction history and receipts are not saved. Cart and transaction state are held only in the current page session.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Ordering, review, and payment containers |
| `styles.css` | Ordering and scoped payment interface styles |
| `products.js` | Six products, stable IDs, names, prices, and lookup |
| `cart.js` | Add, increase, decrease, remove, clear, and order snapshots |
| `ui.js` | Product rendering, cart updates, review, and screen navigation |
| `payment-ui.js` | Cash, QR, Card, processing feedback, success, and receipt rendering |
| `payments.js` / `transactions.js` | Payment validation, transaction creation, and reset |
| `qr-payment.js` / `vendor/qrcode.js` | Locally generated QR links |
| `mobile-payment.html` / `.css` / `.js` | Phone-side payment simulation |
| `kiosk.css`, `icons.js`, `assets/` | Additional kiosk styling, icons, and product artwork |

The UI receives payment behavior through callbacks supplied by `ui.js`. `payments.js` handles validation and `transactions.js` manages the current transaction and reset.

## Products

| Product | Price |
| --- | ---: |
| Coffee | ₱45.00 |
| Sandwich | ₱50.00 |
| Soft Drink | ₱35.00 |
| Cookies | ₱25.00 |
| Bottled Water | ₱20.00 |
| Chocolate | ₱25.00 |

## Module contracts

`cart.js` exports `addItem(productId)`, `increaseQuantity(productId)`, `decreaseQuantity(productId)`, `removeItem(productId)`, `clearCart()`, and `getOrder()`.

```js
// getOrder() returns an independent snapshot:
{
  items: [{ id, name, price, quantity, subtotal }],
  total
}
```

Quantities cannot become negative. Decreasing an item from one removes it. Subtotals and total are calculated automatically.

`payment-ui.js` exports:

```js
renderPaymentUI(container, order, {
  onBack,
  onCashPay,
  onQRConfirm,
  onCardPay,
  onNewTransaction
});

renderReceiptUI(container, transaction, { onNewTransaction });
```

Cash passes a numeric entered amount (`NaN` for blank input). QR and Card invoke their callbacks without arguments. Payment callbacks may return a result directly or through a Promise:

```js
{ success: false, message }
// or
{ success: true, transaction }
```

A transaction supplies `reference`, a display-ready `date`, `paymentMethod`, `items`, `total`, `amountPaid`, and `change`. Item fields match the order snapshot. All amounts are numeric pesos. Payment validation, reference generation, and reset behavior belong to the supplied callbacks. The renderer disables controls while processing and displays callback errors. Both rendering exports return a disposer to ignore pending results when leaving the screen.

## Manual testing

1. Start with an empty cart: total is ₱0.00 and Review Order is disabled.
2. Add two Coffees, one Sandwich, and one Soft Drink: four items total ₱175.00.
3. Increase/decrease quantities and remove items; verify subtotals and totals update. Decrease quantity one to confirm removal.
4. Open Review Order; check product names, quantities, unit prices, subtotals, and total.
5. Tap Back, edit the cart, and reopen review; verify the edits are reflected.
6. Continue to Payment. Switch between Cash, QR Payment, and Credit/Debit Card. Enter a cash amount to inspect the change preview.
7. Test insufficient and exact cash payments, then QR and Card simulations. Confirm payment success and receipt amounts match the reviewed order.
8. Back from payment returns to review with the order preserved.
9. Check the interface at a narrow/mobile viewport and using keyboard navigation.
10. Refresh the page and verify the in-memory cart resets.

Also test insufficient cash, exact payment, returned errors, rapid repeated clicks, success details, receipt consistency, and New Transaction clearing the previous order.

## Group contributions

| Member | GitHub account | Contributions / assigned branches |
| --- | --- | --- |
| Renelyn Cuesta | [cuesta1212](https://github.com/cuesta1212) | Payment and transaction logic (`feature/payments-and-transactions`); product/UI photos (`feature/add-ui-photos`). |
| Josie Lizette Coso | [li-lo-li](https://github.com/li-lo-li) | Navigation and interface design (`feature/CosoNavigationDesign`). |
| Evon Granaderos | [EvonLG](https://github.com/EvonLG) | Product selection, cart, and order review (`feature/ui-and-ordering`); payment interface and callback integration (`feature/payment-ui`). |

Assignments are supplied by the group.

## Mobile QR payment API — no database

QR Payment contains a link to `mobile-payment.html` with the demo order's product
IDs and quantities. The phone calls `/api/qr-payment` to load the current total.
When the user taps **Confirm Payment**, the API validates the amount and returns
a transaction reference, purchased items, and a receipt displayed on the phone.

No Redis database, database credentials, payment provider, or account setup is
required. The API is stateless and stores no payment records. No real money is
transferred. It does not notify the kiosk or track paid/cancelled/expired sessions.
The kiosk QR screen contains only the QR and scanning instructions, with no
Confirm Payment button or Open payment page link. QR confirmation and its receipt
are completed on the phone. Cash/card kiosk receipts and New Transaction continue
using the existing transaction functions. Product prices are unchanged.

After payment, customers can leave a five-star rating and optional comment on the
phone, or on cash/card kiosk receipts. Reviews are saved in this device's browser
localStorage (up to 20 reviews), not sent to an API or a public database.

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
6. The phone should show **Payment Confirmed**, its receipt, and a customer-review form.

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
