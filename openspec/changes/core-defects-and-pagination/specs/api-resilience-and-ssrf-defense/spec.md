# Spec Delta

## Purpose

Hardens API endpoints against Server-Side Request Forgery (SSRF), Express response lifecycle crashes, and unauthorized token leakage.

## ADDED Requirements

### Requirement: WakaTime domain allowlisting and validation
The WakaTime statistics fetcher SHALL validate the `api_domain` parameter against an allowlist of permitted hosts or a strict hostname format, rejecting private and loopback IP addresses.

#### Scenario: Malicious or internal domain provided
- **GIVEN** an `api_domain` parameter containing a loopback address, IP address, or unauthorized host
- **WHEN** the WakaTime endpoint processes the request
- **THEN** it rejects the request with an invalid parameter error without dispatching outbound HTTP requests.

### Requirement: Idempotent Express error handling
All Express API handlers SHALL terminate handler execution immediately upon sending an error response.

#### Scenario: Database error during user deletion
- **GIVEN** an error occurring inside `deleteUser` in `apps/backend/api/delete-user.js`
- **WHEN** the catch block handles the error and sends an error response
- **THEN** it returns immediately and does not invoke subsequent response send calls.

### Requirement: Masked token access responses
The user access verification endpoint SHALL NOT return decrypted GitHub access tokens in public JSON responses.

#### Scenario: User metadata requested by client key
- **GIVEN** a request to `GET /api/user-access` with a valid `user_key`
- **WHEN** the response is formulated
- **THEN** it returns access status flags without exposing the raw GitHub Personal Access Token or OAuth access token.
