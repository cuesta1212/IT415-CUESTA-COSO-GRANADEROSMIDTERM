# IT415-CUESTA-COSO-GRANADEROSMIDTERM

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
