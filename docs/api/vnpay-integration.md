# VNPay integration setup

The payment flow is server initiated and uses the VNPay IPN callback as the source of truth:

1. The authenticated customer asks the backend for a payment URL. The backend creates a pending payment attempt and signs the VNPay URL.
2. The browser redirects to VNPay, then VNPay returns the browser to the backend return endpoint.
3. The backend verifies the return signature and redirects to the configured frontend result page with the transaction reference.
4. VNPay calls the backend IPN endpoint. The backend verifies the signature and amount, then updates the payment attempt, invoice, and rental. The result page reads that server-side status.

## Configuration

Set these environment variables using the credentials issued for your VNPay environment:

| Variable | Purpose |
| --- | --- |
| `VNPAY_TMN_CODE` | VNPay merchant terminal code (8 alphanumeric characters) |
| `VNPAY_HASH_SECRET` | Merchant signing secret; keep it on the backend only |
| `VNPAY_PAY_URL` | Sandbox: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | Backend browser-return endpoint, including `/api/v1/payments/vnpay/return` |
| `VNPAY_FRONTEND_RETURN_URL` | Frontend result route, normally `https://<frontend-host>/payment/result` |
| `VNPAY_CONFIRM_ON_RETURN` | Local Sandbox fallback only; default `true` in the local profile, `false` elsewhere |

`run.ps1` supplies local return URLs for `http://localhost:8088` and `http://localhost:5173`. It loads credentials from the process environment first, then from these files in the repository's `key` directory when the corresponding environment variable is absent:

- `key/Vnpay_tmn_code.key`: the 8-character terminal code issued by VNPay.
- `key/Vnpay_secret.key`: the signing secret issued for that same terminal.

Each file contains only its value. Both are covered by the existing `*.key` Git ignore rule. The launcher never prints the signing secret and restores its original environment when it stops. `backend/.env.example` documents the variables; Spring Boot does not automatically load that example file.

Start from the project root with `powershell -ExecutionPolicy Bypass -File .\run.ps1`. Restart the running backend after changing credentials; editing a file does not update an existing Java process. Missing credentials leave URL creation unavailable (`503`); malformed configured values stop the launcher with a configuration error.

## IPN endpoint

Register the public backend URL `https://<api-host>/api/v1/payments/vnpay/ipn` as the merchant IPN URL in VNPay. It must be reachable by VNPay over HTTPS. A local backend needs a public HTTPS tunnel for sandbox IPN callbacks; the browser return URL can still use the local backend because it is opened by the customer's browser.

With `VNPAY_CONFIRM_ON_RETURN=false`, the return endpoint verifies the signature and redirects; settlement waits for IPN. Keep that setting for staging/production.

The **local profile** defaults `VNPAY_CONFIRM_ON_RETURN=true` for Sandbox development without a public IPN callback. A verified return is passed through `VnPayIpnService`, which checks the merchant, signature, transaction reference, stored amount, and pending status before recording the result. This fallback requires the browser to return to the backend. It does not prove delivery of a server-to-server IPN; use a public HTTPS IPN and disable the fallback when validating that integration. The frontend always reads payment status from the authenticated backend API.

## Official references and Sandbox check

- [VNPay PAY integration](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html): API 2.1.0, sorted URL-encoded parameters, HMAC-SHA512, VND amount multiplied by 100, and GMT+7 timestamps. The current `VnPayService` implements these rules.
- [Official demo and test cards](https://sandbox.vnpayment.vn/apis/vnpay-demo/#link-demo): the standalone demo uses VNPay's own order. Use the project's invoice checkout to verify updates in this database.

For a successful Sandbox checkout, choose **NCB** and use the published test card `9704198526191432198`, cardholder `NGUYEN VAN A`, issue date `07/15`, and test OTP `123456`. These are public Sandbox fixtures, not a real bank card. Enter them only on the VNPay Sandbox payment page.

1. Start the application, sign in as a local customer, and create a current payable reservation/invoice.
2. From `/billing`, choose **Thanh toán qua VNPay**. The URL request should return `200`, then open `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`.
3. Complete the NCB test flow, then follow the return to `http://localhost:8088/api/v1/payments/vnpay/return` and `/payment/result`.
4. Verify the backend attempt becomes `SUCCESS`, the invoice becomes `PAID`, and a payable reservation becomes `RESERVED`. A successful gateway page alone does not establish these database updates.
5. For a failure case, the official demo lists NCB card `9704195798459170488` (insufficient funds). A failed attempt must leave the invoice unpaid. With a public IPN configured, repeat the test with return confirmation disabled and verify duplicate IPNs do not apply payment twice.

Checkout rejects an invoice that is no longer `PENDING`. An initial rental invoice also requires a `PENDING_PAYMENT` hold whose deadline has not elapsed. Its VNPay expiry is capped at that deadline, so opening checkout again does not extend the reservation. Renewal invoices retain their own payment flow.

See [the local Sandbox verification on 14 November 2026](vnpay-verification-2026-11-14.md) for the observed transaction and checks.
