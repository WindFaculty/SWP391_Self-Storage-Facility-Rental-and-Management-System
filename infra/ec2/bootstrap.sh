#!/usr/bin/env bash
set -Eeuo pipefail

PUBLIC_IPV4="${1:?public IPv4 address is required}"
API_HOST="$(printf '%s' "$PUBLIC_IPV4" | tr '.' '-')".sslip.io
REPO_DIR="/opt/storage/repo"
ENV_FILE="$REPO_DIR/infra/ec2/.env.staging"

install -d -m 0755 "$(dirname "$ENV_FILE")"
install -d -m 0755 /usr/local/lib/docker/cli-plugins
BUILDX_VERSION="$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])')"
curl -fsSL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod 0755 /usr/local/lib/docker/cli-plugins/docker-buildx
umask 077
MYSQL_ROOT_PASSWORD="$(openssl rand -hex 24)"
MYSQL_APP_PASSWORD="$(openssl rand -hex 24)"
JWT_SECRET="$(openssl rand -hex 32)"

cat > "$ENV_FILE" <<EOF
API_HOST=$API_HOST
MYSQL_DATABASE=storage_staging
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_APP_USER=storage
MYSQL_APP_PASSWORD=$MYSQL_APP_PASSWORD
JWT_SECRET=$JWT_SECRET
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=None
CORS_ALLOWED_ORIGINS=https://swp391-frontend.pages.dev
VNPAY_TMN_CODE=local-dev-tmn-code
VNPAY_HASH_SECRET=local-dev-hash-secret-change-me
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://$API_HOST/api/v1/payments/vnpay/return
VNPAY_FRONTEND_RETURN_URL=https://swp391-frontend.pages.dev/payment/result
EOF
chmod 0600 "$ENV_FILE"

cd "$REPO_DIR"
docker compose --env-file "$ENV_FILE" -f infra/ec2/docker-compose.staging.yml up -d --build

printf 'STAGING_API_HOST=%s\n' "$API_HOST"
