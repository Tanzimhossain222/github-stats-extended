# Tasks

## 1. Query Parameter Parsing, Clamping & Math Robustness

- [x] 1.1 Update `parseArray` in `packages/core/src/common/ops.ts` to trim whitespace around comma-delimited items and verify with unit tests in `packages/core/tests/ops.test.ts`
- [x] 1.2 Harden `clampValue` in `packages/core/src/common/ops.ts` to parse using `Number` and return `min` on invalid/unit strings (e.g. `"100px"`) and verify with unit tests
- [x] 1.3 Update `calculateRank` in `packages/core/src/calculateRank.ts` to clamp percentiles to `[0, 1]` and fall back to tier `C` if out-of-bounds, verifying with unit tests in `packages/core/tests/calculateRank.test.ts`
- [x] 1.4 Guard against division by zero and `NaN%` in `packages/core/src/cards/top-languages.ts` and `packages/core/src/cards/wakatime.ts` when language size is 0 bytes, verifying with tests
- [x] 1.5 Update `safePattern` in `packages/core/src/api/index.js` and `packages/core/src/api/pin.js` to permit spaces in comma-separated list parameters and verify card endpoints succeed

## 2. Internationalization Engine English Fallback

- [x] 2.1 Update `I18n.prototype.t` in `packages/core/src/common/I18n.ts` to fall back to `FALLBACK_LOCALE` (`en`) when a localized translation key is missing, verifying with unit tests in `packages/core/tests/I18n.test.ts`
- [x] 2.2 Populate missing translation keys in `packages/core/src/translations.ts` for modern stats (`statcard.all-time-contribs`, `repocard.prs-authored`, etc.) and verify no locale crashes

## 3. Token Resilience & REST API Rate-Limit Rotation

- [x] 3.1 Enhance `retryer.ts` catch block to detect GitHub REST rate limits (HTTP 403 with `rate limit` message or HTTP 429) and rotate to the next PAT, verifying with unit tests in `packages/core/tests/retryer.test.ts`
- [x] 3.2 Parallelize sequential search requests in `packages/core/src/fetchers/stats.ts` (`fetchRepoUserStats`) using `Promise.all` and verify with fetcher tests

## 4. Backend Security, Cron Authentication & API Hardening

- [x] 4.1 Parameterize SQL interval queries in `apps/backend/src/common/database.js` (`deleteOldRequests`, `getRecentRequests`) using `$1::interval` and verify with database tests in `apps/backend/tests/database.test.js`
- [x] 4.2 Enforce `CRON_SECRET` authorization bearer token verification on `POST /api/repeat-recent` in `apps/backend/api/repeat-recent.js` and verify unauthorized requests receive HTTP 401
- [x] 4.3 Normalize username casing (`.toLowerCase().trim()`) for blacklist and whitelist in `apps/backend/src/common/access.js` and enforce on `/api/wakatime`, verifying with tests
- [x] 4.4 Fix hardcoded `isError: true` in `shieldsUptimeBadge` (`apps/backend/api/status/up.js`) to dynamically reflect `!up` and verify with tests in `apps/backend/tests/status.up.test.js`
- [x] 4.5 Standardize backend error responses in `wakatime-proxy.js`, `pat-info.js`, `authenticate.js` to return proper HTTP error status codes and structured JSON bodies

## 5. End-to-End System Integration & Full Verification

- [x] 5.1 Run full typecheck (`pnpm typecheck`) across the monorepo and verify 0 type errors
- [x] 5.2 Run workspace linter (`pnpm lint`) and ensure clean code formatting across all packages and apps
- [x] 5.3 Run full test suite (`pnpm test`) across all packages and apps, ensuring all unit and integration tests pass
