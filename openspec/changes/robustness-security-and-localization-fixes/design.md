# Design

## Context

Following an extensive exploration of `packages/core` and `apps/backend`, multiple edge-case bugs and security gaps were confirmed. See `proposal.md` for motivation. This design document establishes the concrete engineering mechanisms, architecture, and worst-case scenario defenses across four distinct functional areas: Query Parsing/SVG Robustness, Internationalization/Localization, Retryer Token Resilience, and Backend Security/Authorization.

## Goals / Non-Goals

**Goals:**
- Eliminate SQL injection vectors in backend PostgreSQL database operations.
- Block unauthorized Denial-of-Service and token exhaustion via unauthenticated cron endpoints.
- Prevent card rendering crashes (500 errors) across all 40+ locales when modern statistics are requested.
- Fix blacklist and whitelist casing bypasses, ensuring uniform identity normalization.
- Ensure PAT rotation remains active during GitHub REST API rate-limiting events (HTTP 403/429).
- Protect SVG output attributes from `NaN` corruption when invalid or unit-suffixed numeric parameters are supplied.
- Accelerate repository user statistics fetching through concurrent REST calls.

**Non-Goals:**
- Redesigning the card layouts or introducing new visual themes.
- Rewriting PostgreSQL database schema or changing table structures.
- Altering external public API contracts or query parameter names.

## Decisions

### 1. Database Interval Parameterization
- **Choice**: Use `$1::interval` bind parameterization in `database.js` (`deleteOldRequests` and `getRecentRequests`).
- **Rationale**: Direct string interpolation (`INTERVAL '${interval}'`) allows SQL syntax manipulation if environment variables or input parameters contain single quotes or malicious clauses. PostgreSQL's `$1::interval` safely binds the string as a typed interval literal without raw concatenation.
- **Alternatives Considered**: Regex-filtering interval strings (fragile, prone to bypasses) vs. multiplying integers (`NOW() - ($1 * INTERVAL '1 hour')`, which limits intervals to hours). Bind cast `$1::interval` is standard, safe, and flexible.

### 2. Cron Endpoint Authentication Guard
- **Choice**: Enforce an `Authorization: Bearer <CRON_SECRET>` check on `POST /api/repeat-recent`. If `CRON_SECRET` is configured in environment, incoming requests must supply a matching bearer token.
- **Rationale**: An unauthenticated POST endpoint can be triggered by external scrapers, generating thousands of requests that saturate server memory and exhaust API quotas.
- **Alternatives Considered**: IP whitelisting (unreliable across serverless edge providers like Vercel). Shared bearer secret via `CRON_SECRET` is the industry standard for Vercel Cron Jobs.

### 3. Internationalization Engine English Fallback
- **Choice**: In `I18n.ts`, resolve translations as:
  ```typescript
  const localized = translation[this.locale] || translation[FALLBACK_LOCALE];
  if (!localized) {
    throw new Error(`'${str}' translation string not found`);
  }
  ```
- **Rationale**: `translations.ts` contains dozens of languages where recently added stats (`statcard.all-time-contribs`, `repocard.prs-authored`, etc.) only exist in English (`en`) and Traditional Chinese (`zh-tw`). Without fallback, any French, Spanish, German, or Japanese user requesting these stats triggers an uncaught exception.
- **Alternatives Considered**: Duplicating English strings into all 40+ locales by hand (creates high maintenance debt and inaccurate translations). Engine-level fallback guarantees graceful degradation to English.

### 4. REST Rate Limit Detection in Retryer
- **Choice**: Update the Axios error handler in `retryer.ts`:
  ```typescript
  const status = e.response.status;
  const message = e.response.data?.message ?? "";
  const isRestRateLimited = status === 429 || (status === 403 && /rate limit/i.test(message));
  if (isRestRateLimited) {
    hasRateLimited = true;
    logger.log(`${currentPAT.name} Failed due to rate limiting`);
    continue; // Rotates to next PAT
  }
  ```
- **Rationale**: Unlike GraphQL (which returns HTTP 200 with `errors`), GitHub REST endpoints return HTTP 403 or 429. Currently, `retryer.ts` returns the 403 response immediately, abandoning the remaining pool of healthy tokens.
- **Alternatives Considered**: Handling retries individually in every fetcher (duplicates retry logic). Centralizing it in `retryer.ts` protects all current and future REST endpoints.

### 5. Robust Parameter Normalization & Safe Clamping
- **Choice**:
  - Update `parseArray` to execute `.map((item) => item.trim()).filter(Boolean)`.
  - Update `clampValue` to parse using `Number(number)`; if `!Number.isFinite(parsed)`, return `min`.
  - In `calculateRank`, clamp input percentile to `[0, 1]` and fall back to tier `C` (`LEVELS[LEVELS.length - 1]`) if `findIndex` returns `-1`.
  - In `top-languages.ts` and `wakatime.ts`, guard against `totalLanguageSize === 0` by rendering empty/zero states without division by zero.
- **Rationale**: Prevents `NaN` from polluting SVG markup (`width="NaN"`, `<text>NaN%</text>`) and prevents uncaught 500 crashes from floating-point rounding.

### 6. Case-Insensitive Access Control
- **Choice**: In `access.js`, normalize usernames with `.toLowerCase().trim()` before checking `blacklist` and `whitelist`. Extend check to `type === "wakatime"`.
- **Rationale**: GitHub usernames are case-insensitive. Case-sensitive checks permit trivial blacklist evasion (`baduser` -> `BadUser`) and block legitimate whitelisted users whose casing differs.

## Risks / Trade-offs

- **[Risk] Cron tasks fail if CRON_SECRET is not configured**:
  → *Mitigation*: If `CRON_SECRET` is not set in environment (e.g. local development), warn in logs and permit execution, but enforce strictly in production when `CRON_SECRET` is present.
- **[Risk] Concurrency spikes on GitHub API when querying stats in parallel**:
  → *Mitigation*: `Promise.all` in `fetchRepoUserStats` runs at most 5 lightweight search count queries (`per_page=1`), well within GitHub's concurrency limits while slashing latency from ~2s to ~400ms.
- **[Risk] Fallback strings in localized cards display English**:
  → *Mitigation*: A localized card showing an English label for an un-translated stat is infinitely preferable to crashing the entire SVG render with an HTTP 500 error.

## Worst-Case Scenarios & Defenses

| # | Worst-Case Scenario | Impact Without Fix | Architectural Defense in This Change |
|---|---|---|---|
| 1 | Attacker or malicious env var injects SQL via interval | Arbitrary SQL execution or database corruption | Parameterized bind cast `$1::interval` in `database.js` |
| 2 | Malicious bot spams `POST /api/repeat-recent` | Severe DoS, CPU spike, exhaustion of all GitHub PAT quotas | Mandatory `CRON_SECRET` bearer token authentication |
| 3 | International user views card in Spanish with `show=prs_authored` | Card rendering throws 500 error, displaying broken image | Automatic fallback to `FALLBACK_LOCALE` (`en`) in `I18n.t()` |
| 4 | Banned user requests card using `&username=BadActor` | Blacklist completely bypassed; unapproved usage | Uniform `.toLowerCase().trim()` comparison in `access.js` |
| 5 | Single PAT hits REST rate limit during search query | Request immediately fails even with 9 healthy tokens available | Detection of 403/429 in `retryer` catch block with automatic PAT rotation |
| 6 | User supplies `&card_width=100px` | `clampValue` yields `NaN`; invalid SVG attributes break browsers | Strict `Number.isFinite` parsing in `clampValue` with `min` fallback |
| 7 | User has repositories with 0 code bytes or hides all languages | Division-by-zero produces `NaN%` and `<rect width="NaN">` | Explicit zero-size checks rendering empty/zero states |
| 8 | Floating-point precision drift causes percentile > 1.0 | `calculateRank` throws uncaught error `LEVELS[-1]` | Strict clamping `[0, 1]` and fallback to tier `C` |
| 9 | Upstream fetcher fails in backend JSON endpoint | HTTP 200 returned with raw text `"Something went wrong..."`, crashing client JSON parsers | HTTP 500 status code with structured `{ error, message }` JSON response |
| 10 | Public instance is operational | Shields.io badge displays red error badge due to `isError: true` | Dynamic `isError: !up` reflecting actual health |
