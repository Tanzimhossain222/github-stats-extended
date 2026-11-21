# Tasks

## 1. Security & Entity Encoding Fix (PR 1 Candidate)

- [x] 1.1 Update `encodeHTML` in `packages/core/src/common/html.ts` to remove the faulty `(?!#)` negative lookahead and unconditionally encode XML/HTML special characters (`<`, `>`, `&`, `"`, `'`).
- [x] 1.2 Add unit test cases in `packages/core/tests/html.test.ts` and `packages/core/tests/xss.test.js` for payloads containing `<#script>`, `"# onfocus=`, and single-quote breakouts.
- [x] 1.3 Verify existing card rendering tests with `pnpm --filter @stats-organization/github-readme-stats-core test`.

## 2. WakaTime SSRF Defense (PR 2 Candidate)

- [x] 2.1 Add domain sanitization in `packages/core/src/fetchers/wakatime.ts` that validates `api_domain` against a valid FQDN pattern and rejects private, loopback, and link-local IP addresses (`127.0.0.1`, `169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`).
- [x] 2.2 Add unit tests in `packages/core/tests/fetchWakatime.test.ts` verifying that invalid or private domains are rejected with `CustomError`.
- [x] 2.3 Verify test suite passes with `pnpm test`.

## 3. Top Languages GraphQL Pagination & Recency Ordering (PR 3 Candidate)

- [x] 3.1 Update `packages/core/src/graphql/queries/top-languages.graphql` to accept `$after: String`, add `orderBy: { field: PUSHED_AT, direction: DESC }`, add `pageInfo { hasNextPage, endCursor }`, and add `nameWithOwner`.
- [x] 3.2 Regenerate GraphQL TypeScript artifacts via `pnpm generate-graphql-types` and verify with `pnpm check-graphql-types`.
- [x] 3.3 Add `FETCH_MULTI_PAGE_LANGS` config option to `packages/core/src/common/config.ts` (defaulting to 3 pages).
- [x] 3.4 Refactor `fetchTopLanguages` in `packages/core/src/fetchers/top-languages.ts` to implement cursor pagination while `hasNextPage && pageCount < maxPages`.
- [x] 3.5 Replace the $O(N^2)$ `edges.concat(acc)` array allocation pattern in `fetchTopLanguages` with a direct linear iteration loop.
- [x] 3.6 Update repository exclusion logic in `fetchTopLanguages` to match both bare `node.name` and namespaced `nameWithOwner`.
- [x] 3.7 Add tests in `packages/core/tests/fetchTopLanguages.test.ts` simulating multi-page GraphQL responses and validating that languages from subsequent pages are accumulated without loss.
- [x] 3.8 Update documentation in `apps/frontend/src/content/docs/docs/cards/top-languages.md` to accurately reflect the paginated limit and ordering behavior.

## 4. Backend Resilience & Error Handling Fixes (PR 4 Candidate)

- [x] 4.1 Fix Express error handling in `apps/backend/api/delete-user.js` by adding an explicit `return` in the `catch` block to prevent double-send `ERR_HTTP_HEADERS_SENT` exceptions.
- [x] 4.2 Fix token error classification in `packages/core/src/common/retryer.ts` so that authentication rejections (`Bad credentials`) throw an authentication-specific error rather than generic rate-limiting downtime.
- [x] 4.3 Normalize URL joining in `apps/backend/src/repeatRequests.js` to strip leading/trailing slashes and duplicate protocol schemes.
- [x] 4.4 Run backend test suite via `pnpm --filter ./apps/backend test` and verify passing status.

## 5. End-to-End Verification & Upstream Preparation

- [ ] 5.1 Run root linting, type-checking, and full test suite (`pnpm lint`, `pnpm typecheck`, `pnpm test`).
- [ ] 5.2 Validate that all four proposed changes can be isolated into atomic git branches for clean upstream pull requests.
