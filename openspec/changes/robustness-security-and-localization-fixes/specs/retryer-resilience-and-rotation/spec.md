# Spec Delta

## Purpose

Provides resilient GitHub token rotation on REST API rate limits and concurrent request dispatching for user repository statistics.

## ADDED Requirements

### Requirement: Automatic PAT rotation on REST rate-limiting
The system SHALL detect HTTP 403 and HTTP 429 rate limit responses from the GitHub REST API and rotate to the next available token in the configured token pool.

#### Scenario: First PAT encounters REST rate limit
- **WHEN** GitHub REST search API returns HTTP 403 with rate limit exceeded message for token 1
- **THEN** retryer logs rate limit failure, rotates to token 2, and retries the request successfully

#### Scenario: All PAT tokens exhausted
- **WHEN** all configured PAT tokens return rate limit errors
- **THEN** system throws a rate limit downtime CustomError indicating all tokens are exhausted

### Requirement: Concurrent execution of repository user stat queries
The system SHALL execute independent REST search count requests in parallel rather than serially.

#### Scenario: Multiple search stats requested
- **WHEN** user requests multiple repository user stats simultaneously
- **THEN** system queries all requested search counters concurrently and aggregates the results
