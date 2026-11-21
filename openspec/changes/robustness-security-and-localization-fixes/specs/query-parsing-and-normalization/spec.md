# Spec Delta

## Purpose

Provides robust parsing, whitespace trimming, casing normalization, numeric clamping, and zero-byte language guarding across card query options and render calculations.

## ADDED Requirements

### Requirement: Comma-separated query parameters are trimmed
The system SHALL trim leading and trailing whitespace from every item when parsing comma-delimited list parameters such as show, hide, role, repo, and owner.

#### Scenario: Comma followed by space in show parameter
- **WHEN** user provides `show=reviews, prs_merged`
- **THEN** system parses both items without whitespace and renders merged pull request statistics

#### Scenario: Comma followed by space in role affiliations
- **WHEN** user provides `role=OWNER, COLLABORATOR`
- **THEN** system parses both affiliations without error and filters repositories accordingly

### Requirement: Numeric clamping rejects non-numeric unit strings
The system SHALL return the fallback minimum value when clamping values with non-numeric suffixes or invalid number formats.

#### Scenario: Clamping string with pixel suffix
- **WHEN** user supplies `100px` to a clamped numeric option with bounds 1 and 20
- **THEN** system returns the minimum boundary 1 instead of NaN

### Requirement: Rank calculation bounds check
The system SHALL bound rank levels to valid threshold tiers and provide a safe fallback tier if floating-point drift or invalid values occur.

#### Scenario: Floating point rounding exceeds threshold bounds
- **WHEN** calculated percentile yields a value exceeding maximum threshold due to rounding
- **THEN** system assigns rank level C without throwing an uncaught exception

### Requirement: Zero-byte repository language guarding
The system SHALL safely display language statistics without division-by-zero or NaN percentages when all counted repositories or languages have zero bytes.

#### Scenario: User repositories report zero language bytes
- **WHEN** total language byte count across selected repositories equals zero
- **THEN** system displays the empty state or zero percentages without rendering NaN attributes in the SVG
