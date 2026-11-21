# Spec Delta

## Purpose

Enforces database interval parameterization, authenticated cron endpoints, case-insensitive access control, and structured JSON error reporting across backend endpoints.

## ADDED Requirements

### Requirement: Parameterized interval deletion and query selection
The system SHALL use parameterized interval expressions rather than raw template literal string concatenation when querying or deleting request records.

#### Scenario: Deleting expired request records
- **WHEN** deleteOldRequests is invoked with interval string
- **THEN** system executes parameterized query passing the interval as a bind parameter `$1::interval`

### Requirement: Cron endpoint authentication
The system SHALL require a valid authorization bearer token matching the configured cron secret before executing repeat recent requests.

#### Scenario: Request without valid cron secret header
- **WHEN** unauthenticated client sends POST request to `/api/repeat-recent`
- **THEN** system rejects request with HTTP 401 Unauthorized

#### Scenario: Request with valid cron secret header
- **WHEN** authenticated cron job sends POST request with matching bearer token
- **THEN** system executes revalidation and returns HTTP 200 with JSON response

### Requirement: Case-insensitive access control and blacklist enforcement
The system SHALL normalize username casing when evaluating against configured blacklist and whitelist records.

#### Scenario: Blacklisted user provides mixed case username
- **WHEN** blacklisted username is submitted with uppercase characters
- **THEN** system identifies match and denies access with blacklisted error card

#### Scenario: Accessing wakatime endpoint with blacklisted username
- **WHEN** blacklisted username requests wakatime card
- **THEN** system enforces blacklist policy and blocks request

### Requirement: Accurate shields.io instance uptime status
The system SHALL report error status false when all health checks indicate the public instance is operational.

#### Scenario: Healthy instance status requested
- **WHEN** client queries shields uptime badge and PAT health check passes
- **THEN** response object sets message up, color brightgreen, and isError false

### Requirement: Structured JSON error responses on API endpoints
The system SHALL return valid JSON error payloads with appropriate HTTP error status codes when backend endpoints encounter errors.

#### Scenario: Error occurred in wakatime proxy endpoint
- **WHEN** upstream fetcher fails during wakatime proxy request
- **THEN** endpoint responds with HTTP 500 status code and valid JSON error object
