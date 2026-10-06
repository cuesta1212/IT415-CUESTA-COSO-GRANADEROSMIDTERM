# PowePuff Store - Touchscreen POS

IT415 midterm project by the Cuesta, Coso, and Granaderos group. A campus-store kiosk built with large touch controls for selecting products, reviewing orders, and choosing a payment method.

## Current status

Working flow: **Order → Review → Payment → Success → Receipt**. Back from payment returns to review; Back from review returns to the editable cart.

Payment callbacks are connected to `payments.js` and `transactions.js`. Cash validates the entered amount and calculates change; QR and Card simulate payment. Success and receipt screens display the resulting transaction. This is a classroom POS simulation, with no real payment gateway or backend.

## Setup and run

Requirements: a modern browser and a local HTTP server. No npm dependencies or build step are required.

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
- **No persistent storage yet:** no database, server API, `localStorage`, or `sessionStorage`. Transaction history and receipts are not saved. Cart and transaction state are held only in the current page session.

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

## Hosted QR payment demo

QR Payment generates a scannable QR that opens `mobile-payment.html` with
the current order amount. The phone page includes an amount-entry keypad,
exact-amount shortcut, validation, and demo confirmation. Existing kiosk
payment callbacks, receipt rendering, cash keypad, and products are preserved.

The mobile page is a simulation. It does not collect money or notify the
kiosk. After confirming on the phone, tap **Confirm Payment** on the kiosk
to complete its simulated transaction. Amounts in the link are editable and
must not be treated as trusted payment records. Receipts remain session-only.

### Deploy on Vercel

1. Commit and push these files to the repository.
2. Import the repository into Vercel and select the **Other** framework preset.
3. Use the repository root, no build command, and `.` as the output directory.
4. Deploy and open the public production URL, such as `https://your-project.vercel.app`.
5. Add products, proceed to QR Payment, and scan the QR using a phone.
6. Check the amount, try the keypad, and confirm the demo on both phone and kiosk.

The QR URL is derived from the page's current address, so no domain is
hardcoded. Both devices need internet access for a public deployment; they
do not need the same Wi-Fi. Use the stable production domain when sharing
codes. The payment page path must remain available. A localhost QR cannot
be opened from another device. For local testing, serve the project over HTTP
and open the mobile-page link in the same browser.

`vendor/qrcode.js` is the MIT-licensed QR Code Generator by Kazuhiko Arase
(https://github.com/kazuhikoarase/qrcode-generator). It is stored locally;
QR images and amount data are not sent to an external QR generation service.
