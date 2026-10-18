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

`run.ps1` supplies local return URLs for `http://localhost:8088` and `http://localhost:5173`. The local merchant code and secret in the example configuration are placeholders; payment URL creation returns `503` until real merchant credentials are configured.

## IPN endpoint

Register the public backend URL `https://<api-host>/api/v1/payments/vnpay/ipn` as the merchant IPN URL in VNPay. It must be reachable by VNPay over HTTPS. A local backend needs a public HTTPS tunnel for sandbox IPN callbacks; the browser return URL can still use the local backend because it is opened by the customer's browser.

The return endpoint does not settle payments. It only verifies the browser-return signature and sends the customer to the result page. Do not mark an invoice paid from browser query parameters; settlement is performed after a valid IPN.
