# Google Login — SWP391

## Architecture audit

Backend is a modular monolith with Java 25, Spring Boot 4.1.1, Spring Security, JPA and MySQL 8.4/Flyway. PostgreSQL SQL under `sql/` is reference material, not the running database. The active frontend uses React 19/Vite/Tailwind, `AppRoutes`, `AuthProvider`, customer protected routes and workspace `SessionProvider`.

Before: AuthenticationManager/BCrypt email-password authentication; access JWT 30 minutes, refresh JWT 7 days, SHA-256 hashes stored in `refresh_tokens`, refresh rotation and revocation. Stateless API reads roles/status from database. Frontend stored bearer credentials in localStorage and logout only cleared local state. Earlier Google implementation posted GIS ID tokens, not backend Authorization Code Flow.

After: Spring Security OAuth2 Client handles Google Authorization Code/OIDC, including signature/issuer/audience/expiration and state/nonce, with PKCE. A temporary session holds the OAuth request, then is invalidated on success/failure. The callback issues the existing application's JWT infrastructure via HttpOnly cookies. Frontend restores authoritative profile/role from `/auth/me`, and refreshes cookie credentials when needed. Browser email/password and Facebook use cookie adapters; existing bearer APIs remain compatible. Google token POST is no longer a supported login path.

Browser cookies: host-only, API context path, SameSite=Lax, HttpOnly for access/refresh; Secure required in production. Unsafe cookie requests require CSRF. Frontend obtains CSRF token and sends `X-XSRF-TOKEN`, using `credentials: include`. Cross-origin deployment must use explicitly allowed CORS origins. Different-site frontend/API is unsupported by Lax cookies: use a same-site reverse proxy/API path rather than disabling CSRF.

## Google Cloud Console

1. Create/select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Open Google Auth Platform/OAuth consent screen; configure Branding, app name, support email, developer contacts and production domains when applicable.
3. Set Audience to External for users outside your organization, or Internal only for a suitable Workspace organization.
4. If the application is in Testing, configure the necessary test users.
5. Create an OAuth Client ID of type **Web application**. Required scopes: `openid`, `email`, `profile`.
6. This backend redirect flow does not use Google JavaScript/GIS, so Google Authorized JavaScript Origins are not required. Application CORS still needs the exact frontend origin.
7. Add an exact Authorized Redirect URI matching `GOOGLE_REDIRECT_URI`. With `run.ps1`: `http://localhost:8088/api/v1/login/oauth2/code/google`. With Docker compose default port: `http://localhost:8080/api/v1/login/oauth2/code/google`.
8. Configure Client ID/Secret only in backend environment. Never put the secret in `VITE_*`, Git, URLs or the frontend bundle.
9. Production uses the actual HTTPS callback URI; configure publishing/audience according to the Google dashboard.

References: [Google Web Server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [Spring Security OAuth2 Login](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html), [Spring CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).

## Local setup

Set environment variables in PowerShell before starting the server. Replace placeholders with real values; backend `.env` files are documentation and are not automatically loaded by Spring Boot.

```powershell
$env:GOOGLE_LOGIN_ENABLED = 'true'
$env:GOOGLE_CLIENT_ID = '<your-client-id.apps.googleusercontent.com>'
$env:GOOGLE_CLIENT_SECRET = '<your-client-secret>'
$env:GOOGLE_REDIRECT_URI = 'http://localhost:8088/api/v1/login/oauth2/code/google'
$env:GOOGLE_FRONTEND_URL = 'http://localhost:5173'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
$env:AUTH_COOKIE_SECURE = 'false' # local HTTP only
.\run.ps1
```

Google is disabled by default (`GOOGLE_LOGIN_ENABLED=false`) so the server runs without credentials. The button reads enabled state from backend. No `VITE_GOOGLE_CLIENT_ID` is needed. Empty `VITE_API_BASE_URL` uses Vite `/api/v1` proxy to backend 8088; an absolute URL must include `/api/v1` exactly once. Keep hostname consistent; do not mix localhost and 127.0.0.1 within a cookie session.

Alternatively, save the downloaded Google **Web application** credential JSON as `client_secret*.json` at the repository root. Git ignores these files. `run.ps1` loads exactly one local file into the child-process environment, checks the registered 8088 callback and enables Google login unless explicitly configured otherwise. Existing environment credentials take precedence. The secret is never printed or copied into frontend/Git. Keep only one matching JSON file; multiple files are rejected to avoid choosing the wrong client.

Stop the existing server with Ctrl+C in its terminal, then restart frontend/backend to load Java changes, environment and migrations. Do not start another server on occupied ports. Docker configuration examples are in `infra/docker/.env.example`; compose forwards the OAuth variables to backend, with redirect port 8080 by default.

Production: strong separate JWT_SECRET, HTTPS, AUTH_COOKIE_SECURE=true, Secure session cookies and same-site HTTPS frontend/API. Restrict access/query logging on the OAuth callback: authorization codes arrive in the query by protocol. Do not enable HTTP/token body debug logging.

## Routes

All routes have `/api/v1` prefix:

| Method/path | Purpose |
|---|---|
| GET `/auth/google/config` | Enabled flag, no secrets |
| GET `/oauth2/authorization/google` | Browser authorization navigation |
| GET `/login/oauth2/code/google` | Spring Security callback |
| GET `/auth/me` | Authoritative user/role |
| GET `/auth/cookie/csrf` | CSRF token for browser |
| POST `/auth/cookie/login` | Email/password login, HttpOnly JWT |
| POST `/auth/cookie/register` | Customer registration, HttpOnly JWT |
| POST `/auth/cookie/social/facebook` | Existing Facebook verification, cookie response |
| POST `/auth/cookie/refresh` | Rotate refresh cookie, return user |
| POST `/auth/cookie/logout` | Revoke refresh and clear cookies |

Callbacks redirect only to configured GOOGLE_FRONTEND_URL, which must be an allowed CORS origin, plus `/auth`. They accept no arbitrary redirect destination. URL contains only `oauth=success` or a finite error code (`email_conflict`, `account_disabled`, `authentication_failed`), never application JWTs or Google tokens.

## Account rules and migrations

V009 creates `social_identities` with provider + subject unique constraint and user FK. V010 makes subjects case-sensitive using binary collation; applied migrations are not rewritten. Registration races rollback the failed insert and retry identity resolution in a fresh transaction. Existing email cannot be linked automatically.

New Google users are always CUSTOMER/ACTIVE. Google `sub` is the stable key; linked users keep their ID and existing role even if provider email changes. Only verified emails are accepted, disabled accounts are rejected before JWT issuance. Schema has no avatar field, so avatar is not persisted. A random unknown password is BCrypt-hashed for the non-null password column.

Email conflict: ask the user to sign in with the original method. Account-linking UI after authenticated proof is not implemented. Logout revokes application refresh credentials and clears browser cookies/state; it does not log out Google. A previously copied stateless access JWT remains valid until its expiration; the application has no access-token blacklist.

## Manual verification with real credentials

1. Open `/auth`, click Continue with Google. Authorization must include state, nonce, code_challenge, never Client Secret.
2. A new Google user becomes CUSTOMER, reaches the proper customer route, can use protected customer APIs and cannot access staff/admin APIs.
3. Reload preserves auth via `/auth/me`; no JWT appears in localStorage or callback URL. Cookies are HttpOnly and Secure in production.
4. Logout then sign in repeatedly with the same Google account: same user/identity. Concurrent first logins must not produce duplicate users.
5. Email already registered without Google identity produces conflict and no account link.
6. DISABLED accounts cannot sign in/refresh/access protected APIs.
7. Cancel consent or submit wrong/missing state: safe login error, no new credential.
8. Existing email/password registration/login/logout/reload and role guards still work.
9. Unsafe cookie API without valid CSRF returns 403; consumed/revoked refresh cannot be reused.
10. Expired access refreshes once and retries; expired refresh returns to login.

Automated mock OIDC checks and live Google verification are distinct. Without actual Google credentials, live Google OAuth remains **UNVERIFIED**. Test results are recorded in `docs/api/google-login-verification.md`.
