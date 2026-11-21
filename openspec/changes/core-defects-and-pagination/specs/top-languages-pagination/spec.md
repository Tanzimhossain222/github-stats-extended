# Spec Delta

## Purpose

Provides paginated and activity-ordered repository traversal for language statistics, guaranteeing complete language visibility across large user portfolios and organization repositories.

## ADDED Requirements

### Requirement: Cursor-based repository pagination
The top languages fetcher SHALL paginate through a user's repositories using GraphQL cursor pagination up to a configurable maximum page limit.

#### Scenario: User has more than 100 repositories
- **GIVEN** a user with 150 repositories
- **WHEN** the top languages endpoint fetches the user's data with a page limit greater than 1
- **THEN** it executes consecutive paginated requests using `after: endCursor` until `hasNextPage` is false or the page limit is reached, aggregating repositories from all retrieved pages.

### Requirement: Deterministic push-recency repository ordering
The top languages query SHALL sort repositories by recent push activity using `orderBy: { field: PUSHED_AT, direction: DESC }`.

#### Scenario: User has repositories exceeding the fetch page ceiling
- **GIVEN** a user whose total repositories exceed the maximum fetched pages
- **WHEN** the GraphQL query retrieves repositories
- **THEN** it returns repositories in descending order of last pushed commit, ensuring active projects are evaluated before inactive projects.

### Requirement: Namespaced repository exclusion
The repository filtering logic SHALL match excluded repository identifiers against both bare repository names and owner-namespaced names.

#### Scenario: User excludes an organization repository by namespace
- **GIVEN** an exclusion parameter specifying `org-name/repo-name`
- **WHEN** the repository filter evaluates candidate repository nodes
- **THEN** it excludes nodes whose nameWithOwner matches `org-name/repo-name` as well as those matching bare `repo-name`.
