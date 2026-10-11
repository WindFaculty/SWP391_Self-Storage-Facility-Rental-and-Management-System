# Google Login audit and verification — 2026-10-11

## Update: Facebook removed

Facebook login has been removed by user request: button/SDK, frontend context/API methods, both backend login endpoints, verifier/request DTO and environment properties. The four Facebook-only unit tests were removed with the deleted feature; Google integration and password lifecycle tests remain. The identity table and forward-only migrations remain because Google uses them; no existing user data was deleted. File lists and results below describe the earlier Google integration audit and are historical.

Implementation and setup: [Google Login guide](../social-login.md).

## Source-backed audit and decisions

| Area | Existing implementation | Integration decision |
|---|---|---|
| Backend | Java 25 / Boot 4.1.1 modular monolith | Extend account/shared security packages |
| Database | MySQL 8.4, Flyway, Hibernate validate | Forward-only V009/V010; no existing users rewritten |
| Password login | AuthenticationManager, BCrypt, JWT | Preserve APIs/business logic; add browser cookie adapters |
| Access authorization | JWT filter reloads database user/status/role | Add cookie transport, retain bearer support and all role guards |
| Refresh | SHA-256 token hash, rotation, revocation | Reuse service; pessimistic locking prevents concurrent consumption |
| Google | Earlier GIS ID-token POST | Replace with Spring OAuth2 Client Code/OIDC + PKCE |
| OAuth state | None for earlier GIS token POST | Standard session authorization-request repository, nonce/state checks |
| Browser credentials | localStorage access/refresh | HttpOnly cookies, credentialed fetch, CSRF header |
| Routing | AuthProvider, ProtectedRoute, SessionProvider | Bootstrap /auth/me; redirect using server profile role |
| Linking | Provider-subject table, no email auto-link | Retain subject lookup and conflict refusal; safe concurrent registration |

Google SDK/manual ID-token decoder is no longer used. Spring Security validates OIDC identity and exchanges the authorization code server-side. No provider access/refresh tokens are persisted by the app. OAuth context/session is cleared at completion; no OAuth principal is used as application role authority.

## Files created or changed for authentication

Backend:

- `backend/pom.xml`: OAuth2 Client and security-test dependencies.
- `backend/.env.example`, `backend/src/main/resources/application.yml`, `application-staging.yml`: environment and cookie/logging configuration.
- `account/controller/AuthController.java`, `CookieAuthController.java`: legacy APIs and cookie adapters/config/CSRF.
- `account/dto/SocialLoginRequest.java`, `account/entity/SocialIdentity.java`, `account/repository/SocialIdentityRepository.java`: social identity model.
- `account/repository/RefreshTokenRepository.java`: refresh row locking.
- `account/service/AuthService.java`, `GoogleAccountService.java`, `SocialTokenVerifier.java`: existing JWT reuse, verified Google account resolution, retained Facebook verification.
- `shared/config/SecurityConfig.java`, `GoogleClientConfiguration.java`: standard Code/OIDC, PKCE, stateless API/temporary handshake, CORS/CSRF.
- `shared/security/AuthCookies.java`, `GoogleOAuthHandlers.java`, `JwtAuthenticationFilter.java`: cookie transport, safe callback outcomes, JWT cookie authentication.
- `db/migration/mysql/V009__social_identities.sql`, `V010__case_sensitive_provider_subject.sql`: identity unique/FK and case-sensitive subject.
- `backend/src/test/java/com/storage/account/GoogleLoginTests.java`, `SocialAuthServiceTests.java`, `backend/src/test/java/com/storage/StorageApplicationTests.java`: behavioral coverage and schema table-count update for the added identity table. Existing password lifecycle tests retained.

Frontend:

- `frontend/.env.example`: remove unnecessary Google frontend client ID; secrets stay backend.
- `frontend/src/api/client.ts`, `client.test.ts`: credentialed cookies, CSRF, one refresh/retry, no sensitive storage.
- `frontend/src/features/auth/AuthProvider.tsx`, `AuthProvider.test.tsx`: authoritative profile restore, server logout, disabled/cache rejection.
- `features/auth/api/authApi.ts`, `auth-context.ts`: cookie adapters and social integration.
- `features/auth/components/SocialLogin.tsx`, `SocialLogin.test.tsx`, `features/auth/pages/AuthPage.tsx`, `AuthPage.test.tsx`: real backend navigation, enabled state, safe OAuth errors and no login controls while initial profile bootstrap is pending.
- `frontend/e2e/role-flows.spec.ts`, `live-backend.spec.ts`: preserve login validation and use real cookie authentication rather than injected token/role.

Deployment/documentation: `infra/docker/.env.example`, `infra/docker/docker-compose.yml`, `docs/social-login.md`, this report. Other pre-existing modified files were preserved.

## Verification scope

Google integration tests use mocked OIDC identity plus real MySQL/Testcontainers and actual Spring security filters for authorization redirect/state failures. They do not exchange a live Google authorization code or validate a real Google account's login.

Coverage: new/repeated login, unique identity, email conflict, disabled account, provider authority cannot elevate new user's role, database role preservation, unverified email, case-sensitive subjects, simultaneous first login, HttpOnly cookies without token URL, protected API/customer-admin denial, CSRF, refresh rotation/revocation, logout, missing/cancelled/mismatched OAuth callback, PKCE/nonce/state generation, and cookie password register/login lifecycle using real CSRF endpoint/header/cookie. Existing bearer/password and business suites remain enabled.

Frontend tests verify config/button state, credentialed fetch, CSRF, refreshed retry, expired session, restoration, no stored JWT, server logout and profile authority. Retried 403 remains 403 and does not accidentally clear a valid refreshed session.

Playwright smoke used the existing running frontend/backend. The backend process was still the old build and lacked the new Google configuration route. These nine smoke cases establish anonymous/guard/login-validation behavior; they do **not** establish new backend cookie or live Google behavior. The seed-dependent live-backend workspace suite is not counted as Google verification.

Frontend final verification: **93 tests PASS in 21 files, 0 FAIL**; `npm run build` (includes TypeScript checking) PASS; `npm run lint` exit 0 with existing unrelated React warnings. Nine Playwright smoke tests PASS with the scope limitation above. Existing bundle-size warning remains.

Backend definitive full Maven run: **91 tests PASS in 20 suites, 0 failures, 0 errors, 0 skipped**, exit 0. Includes **10 GoogleLoginTests** and existing email/password bearer lifecycle and business suites. MySQL 8.4 Docker/Testcontainers ran Flyway V001–V010 and Hibernate schema validation successfully. Results: `backend/target/surefire-reports`; full execution log: `backend/target/verified-all-tests.log` (generated and Git-ignored).

Commands executed using installed Maven 3.9.16 (wrapper invocation environment issue noted below): full `mvn test`, focused `mvn -Dtest=GoogleLoginTests test`; frontend `npm test`, `npm run build`, `npm run lint`; focused Playwright anonymous/role/login validation smoke. Intermediate failures were reproduced and fixed (CSRF path matcher, real-CSRF test fixture interference, schema table-count expectation for V009, retry error propagation). Final checks did not exclude failing tests.

## Remaining limits

- **Live Google OAuth: UNVERIFIED** until the user completes the account chooser/consent and the application callback is checked. Real Web client credentials are now present in a Git-ignored local `client_secret*.json`; `run.ps1` loads them without printing values. The server was restarted and the real Google account chooser was reached with the expected callback, state, nonce and PKCE S256. A completed successful callback has not yet been observed.
- Backend/frontend have been restarted with the local credentials. Existing user data was not reset.
- Account linking after password proof has no UI/API yet. Email conflict is safely rejected.
- No avatar persistence: current User schema has no avatar field.
- Logout revokes refresh and clears cookies; independently copied stateless access JWTs remain valid until existing TTL expires. Logout does not sign out Google.
- SameSite=Lax requires a same-site frontend/API deployment; use a reverse proxy for otherwise cross-site hosting.
- Development build has an existing large bundle warning; lint may report unrelated existing warnings.
- Maven wrapper invocation under the tool environment failed; verification used the installed Maven 3.9.16 executable with JDK 25 and Docker/MySQL. This did not skip tests.
