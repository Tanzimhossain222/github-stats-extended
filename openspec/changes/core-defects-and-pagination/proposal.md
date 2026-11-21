# Proposal

## Why

The current implementation of GitHub Stats Extended suffers from critical operational and security defects:
1. `top-languages` hardcodes a single unpaginated GraphQL query limited to 100 repositories without an `orderBy` clause, silently dropping repositories (such as Kotlin repos) whenever a user has over 100 repositories or includes collaborator roles.
2. `encodeHTML` contains a negative lookahead `(?!#)` regex flaw that fails to escape `<` and `"` when followed by `#`, exposing SVG cards to attribute breakout and injection.
3. Auxiliary endpoints contain severe vulnerabilities and bugs: unvalidated `api_domain` parameter in WakaTime fetcher leading to Server-Side Request Forgery (SSRF), state-modifying GET endpoints for user deletion, Express double-send crashes, and raw PAT token leakage to the frontend.

Resolving these issues in a structured, sequential manner establishes a reliable foundation for creating targeted upstream pull requests.

## What Changes

- **Top Languages Pagination & Ordering**:
  - Add cursor pagination (`after: $after`, `pageInfo { hasNextPage, endCursor }`) to `top-languages.graphql` and `fetchTopLanguages`.
  - Add explicit `orderBy: { field: PUSHED_AT, direction: DESC }` to prioritize active repositories.
  - Implement configurable page limits (e.g., `FETCH_MULTI_PAGE_LANGS`) to guard against serverless timeouts.
  - Replace the $O(N^2)$ edge-reducing loop with direct, efficient language aggregation.
  - Fix `exclude_repo` matching for namespaced repositories (`owner/repo`).
- **Security & SVG Hardening**:
  - Fix `encodeHTML` to reliably encode all XML/HTML special characters (`<`, `>`, `&`, `"`, `'`) regardless of subsequent `#` characters.
  - Add strict domain validation and allowlisting to `api_domain` in `fetchWakatimeStats` to eliminate SSRF.
  - Convert destructive user management actions (`delete-user`, `downgrade`) from HTTP GET to POST/DELETE with CSRF protection.
  - Prevent raw GitHub access tokens from being returned to the client browser in `GET /api/user-access`.
- **Backend Error Handling & Observability**:
  - Add missing `return` statements in Express error handling blocks (`delete-user.js`) to prevent `ERR_HTTP_HEADERS_SENT` crashes.
  - Fix token error classification in `retryer.ts` so `Bad credentials` or revoked tokens do not falsely report as rate-limit exhaustion.
  - Normalize base URLs in `repeatRequests.js` to prevent double-scheme (`https://https://`) malformed URLs.

## Capabilities

### New Capabilities
- `top-languages-pagination`: Paginated repository fetching and push-recency ordering for language statistics to ensure complete, deterministic language data across large portfolios.
- `svg-security-hardening`: Robust XML/SVG entity encoding and sanitization to eliminate script and attribute injection across custom titles, descriptions, and labels.
- `api-resilience-and-ssrf-defense`: Strict URL/domain validation on external API proxies and safe Express endpoint lifecycle handling.

### Modified Capabilities
<!-- None: Greenfield OpenSpec capability tracking -->

## Impact

- `packages/core/src/graphql/queries/top-languages.graphql`: Schema query updated with pagination variables and `orderBy`.
- `packages/core/src/fetchers/top-languages.ts`: Multi-page loop and linear accumulator logic.
- `packages/core/src/common/html.ts`: Security fix in entity encoder.
- `packages/core/src/fetchers/wakatime.ts`: Input sanitization and domain allowlisting.
- `packages/core/src/common/retryer.ts`: Improved error distinction.
- `apps/backend/`: Router and API endpoints hardened against double-send, CSRF, and token leakage.
- Unit and contract tests across core and backend packages updated and verified.
