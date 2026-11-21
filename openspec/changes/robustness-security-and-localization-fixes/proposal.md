# Proposal

## Why

Following the resolution of core pagination and encoding defects, a deep structural and security audit revealed multiple critical edge cases and failure modes across `packages/core` and `apps/backend`. These include SQL injection risks via unparameterized interval interpolation, unauthenticated cron endpoints exposing the backend to denial-of-service, card-rendering crashes for international users due to missing translation fallbacks in `I18n`, case-sensitive blacklist evasion, and broken PAT token rotation on REST API rate limits. Addressing these issues now hardens the system against worst-case scenarios and ensures enterprise-grade reliability and security.

## What Changes

- **Core Query Parsing & Math Robustness**:
  - Update `parseArray` to trim whitespace around comma-separated values so `&show=reviews, prs_merged` and `&role=OWNER, COLLABORATOR` parse cleanly.
  - Update `clampValue` to parse numeric values safely without producing `NaN` on unit strings (e.g. `"100px"`).
  - Update `calculateRank` to clamp rank bounds and fall back safely to level `C` if floating-point drift or out-of-bounds index occurs, preventing uncaught 500 errors.
  - Guard against division-by-zero and `NaN%` in `top-languages` and `wakatime` when repositories contain 0 language bytes or when hiding all languages.
  - Update `safePattern` in `api/index.js` and `api/pin.js` to accept spaces in comma-separated lists (`repo1, repo2`).

- **Internationalization Engine Resilience**:
  - Update `I18n.t(key)` in `packages/core/src/common/I18n.ts` to fall back to `FALLBACK_LOCALE` (`"en"`) if the requested locale translation is missing for that specific key, eliminating card-rendering crashes across all 40+ supported locales when modern stats are requested.
  - Add missing translation keys across `translations.ts` where definitions are currently absent.

- **Token Resilience & REST API Rate-Limit Rotation**:
  - Enhance `retryer.ts` catch block to detect GitHub REST rate limits (HTTP 403 with `rate limit` message or HTTP 429), log rotation, and continue cycling through the remaining PAT tokens rather than aborting prematurely.
  - Execute independent REST search requests concurrently in `fetchRepoUserStats` using `Promise.all` to reduce card latency by up to 75%.

- **Backend Security & Authorization**:
  - Parameterize SQL queries in `apps/backend/src/common/database.js` (`deleteOldRequests`, `getRecentRequests`) using `$1::interval` to eliminate SQL injection vulnerabilities.
  - Protect `POST /api/repeat-recent` with a mandatory `CRON_SECRET` bearer token header check, blocking unauthorized mass-revalidation attacks.
  - Enforce case-insensitive and trimmed comparison for `blacklist` and `whitelist` in `apps/backend/src/common/access.js`, and extend blacklist filtering to the `/api/wakatime` route.
  - Fix hardcoded `isError: true` in `shieldsUptimeBadge` (`apps/backend/api/status/up.js`) to accurately reflect instance health.
  - Standardize error responses across backend endpoints (`wakatime-proxy.js`, `pat-info.js`, `authenticate.js`, `delete-user.js`) to return appropriate HTTP error status codes (400/401/404/500) and structured JSON bodies.

## Capabilities

### New Capabilities
- `query-parsing-and-normalization`: Robust parsing, trimming, safe numeric clamping, rank calculation bounding, and zero-byte language guarding across cards and fetchers.
- `internationalization-engine`: Resilient translation engine with automatic fallback to English (`FALLBACK_LOCALE`) on missing localized keys.
- `retryer-resilience-and-rotation`: GitHub REST rate-limit detection with automatic PAT pool rotation and concurrent REST querying.
- `backend-security-and-authorization`: Parameterized database operations, cron endpoint authentication, case-insensitive access control, and structured JSON error responses.

### Modified Capabilities
<!-- None: No existing specs synced in openspec/specs yet. -->

## Impact

- **Packages Affected**:
  - `packages/core`: `src/common/ops.ts`, `src/common/I18n.ts`, `src/common/retryer.ts`, `src/calculateRank.ts`, `src/cards/top-languages.ts`, `src/cards/wakatime.ts`, `src/cards/stats.ts`, `src/api/index.js`, `src/fetchers/stats.ts`, `src/translations.ts`.
  - `apps/backend`: `src/common/database.js`, `src/common/access.js`, `api/repeat-recent.js`, `api/status/up.js`, `api/status/pat-info.js`, `api/wakatime-proxy.js`, `api/authenticate.js`, `api/delete-user.js`, `api/user-access.js`.
- **Breaking Changes**: None. All changes maintain backward compatibility while fixing severe vulnerabilities, crashes, and edge cases.
- **Worst-Case Scenarios Addressed**:
  1. *Malicious SQL Injection*: Attacker or misconfigured environment injecting SQL statements through unparameterized interval interpolation.
  2. *Unauthenticated Denial-of-Service*: Automated botnets calling `POST /api/repeat-recent` to trigger thousands of backend and GitHub API requests.
  3. *Global International Card 500 Crash*: Non-English GitHub users requesting localized cards with modern stats (`prs_authored`, `all_time_contribs`) experiencing complete card failures.
  4. *Access Control Evasion*: Blacklisted bad actors bypassing bans simply by sending capitalized usernames (`&username=BadActor`).
  5. *Token Rotation Deadlock*: Single REST rate-limited PAT aborting the entire request while 9 healthy PATs remain idle in the pool.
  6. *Malformed SVG Attribute Generation*: Strings with units (`"100px"`) resulting in `width="NaN"` or `viewBox="0 0 NaN NaN"`.
