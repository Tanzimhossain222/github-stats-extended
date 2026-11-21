# Design

## Context

See `proposal.md` for motivation. Currently:
- `fetchTopLanguages` executes a single GraphQL query for 100 repositories without an `orderBy` or pagination cursor, losing repositories whenever a portfolio exceeds 100 items.
- `encodeHTML` in `html.ts` uses a flawed negative lookahead `(?!#)` regex to avoid double-escaping entities, which inadvertently leaves `<` and `"` bare when followed by `#`.
- `fetchWakatimeStats` concatenates the user-supplied `api_domain` into an HTTPS URL without validation, allowing SSRF.
- `delete-user.js` sends an HTTP response in the catch block without returning, causing a secondary send call to crash the process with `ERR_HTTP_HEADERS_SENT`.

## Goals / Non-Goals

**Goals:**
- Provide reliable cursor-based GraphQL pagination for `top-languages` with configurable page limits (`FETCH_MULTI_PAGE_LANGS`) and `orderBy: { field: PUSHED_AT, direction: DESC }`.
- Make `encodeHTML` robust against tag breakouts and attribute injections by removing the problematic lookahead and encoding all targeted XML entities.
- Add strict domain validation to `fetchWakatimeStats` using an allowlist or valid FQDN regex that rejects private/loopback IP addresses.
- Fix Express error handling in `apps/backend/api/delete-user.js`.
- Optimize the repository edge accumulation algorithm in `fetchTopLanguages` from $O(N^2)$ to $O(N)$.

**Non-Goals:**
- Full frontend OAuth re-architecture (e.g. replacing Redux token storage with HttpOnly session cookies is tracked as a future dedicated security change; here we mask the token response).
- Re-architecting `fetchStats` 18-parameter signature (this is a separate refactor candidate).

## Decisions

### 1. Cursor Pagination Architecture for `top-languages`
- **Decision**: Mirror the cursor pagination pattern already used by `stats.ts` (`UserReposDocument`). Update `top-languages.graphql` to accept `$after: String` and query `pageInfo { hasNextPage, endCursor }` and `orderBy: { field: PUSHED_AT, direction: DESC }`.
- **Alternatives considered**:
  - *Keep single page and only add `orderBy: PUSHED_AT`*: Fails for users who have > 100 actively maintained repositories.
  - *Unbounded pagination (`while (hasNextPage)`)*: Risk of exceeding Vercel's 10-second serverless function timeout on large accounts.
- **Rationale**: Capping pagination via `FETCH_MULTI_PAGE_LANGS` (default: 3 pages = 300 repositories) strikes the ideal balance between completeness and latency safety.

### 2. Entity Encoding in `encodeHTML`
- **Decision**: Replace `str.replace(/[\u00A0-\u9999<>&"'](?!#)/gim, ...)` with a standard XML/HTML character mapping (`<`, `>`, `&`, `"`, `'`). If preservation of existing numeric entities is required, inspect for full `&#[0-9]+;` or `&#x[0-9a-fA-F]+;` syntax rather than a blanket negative lookahead on `#`.
- **Alternatives considered**:
  - *Leave lookahead and add exceptions*: Fragile; parser differentials in SVG renderers are difficult to protect against.
  - *Use an external HTML sanitizer*: Heavyweight dependency for an SVG generator that only needs text node and attribute escaping.
- **Rationale**: Standard character entity replacement is fast, zero-dependency, and completely closes the breakout vector.

### 3. WakaTime SSRF Defense
- **Decision**: Validate `api_domain` against a strict regex `/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` and reject private/internal IP ranges (IPv4 private subnets `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`). Default to `wakatime.com`.
- **Alternatives considered**:
  - *Hardcode `wakatime.com` only*: Breaks self-hosted Wakapi instances that users actively rely on.
  - *No validation*: Leaves the backend vulnerable to internal network scanning and cloud metadata theft.

### 4. Express Lifecycle in Error Handlers
- **Decision**: Ensure all error catch blocks in `apps/backend/api/` execute an explicit `return;` immediately after `res.send(...)`.

## Risks / Trade-offs

- **[Risk] GraphQL rate limit consumption with multi-page fetching** → **Mitigation**: Restrict default `FETCH_MULTI_PAGE_LANGS` to 3 pages (300 repositories) and preserve token rotation in `retryer.ts`.
- **[Risk] Slower top-languages card response times** → **Mitigation**: The ISR proxy and Vercel edge caching serve cached cards, so multi-page fetch latency is only incurred on cache misses/revalidation.
- **[Risk] Breaking changes to existing custom SVG templates** → **Mitigation**: Numeric entity encoding (`&#60;`, `&#34;`, etc.) is fully valid in XML and SVG and renders identically across all browsers and GitHub markdown renderers.
