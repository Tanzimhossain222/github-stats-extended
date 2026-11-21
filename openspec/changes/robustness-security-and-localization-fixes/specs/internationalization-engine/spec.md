# Spec Delta

## Purpose

Ensures consistent translation resolution and graceful English fallback when localized strings are not yet translated for supported card locales.

## ADDED Requirements

### Requirement: Automatic English fallback on missing localized keys
The system SHALL fall back to the English translation when a requested translation key is missing in the chosen locale rather than throwing an uncaught error.

#### Scenario: Requesting localized card with stat missing in that locale
- **WHEN** user requests card in French locale with modern stat `prs_authored` which only exists in English
- **THEN** system renders the English string `PRs Created` successfully with status 200 without throwing an error

### Requirement: Missing key error when key does not exist in any locale
The system SHALL throw an descriptive error only when a requested translation key is absent from all translations including English.

#### Scenario: Non-existent translation key requested
- **WHEN** an unmapped translation key is evaluated by the translation engine
- **THEN** system throws an error indicating the translation key was not found
