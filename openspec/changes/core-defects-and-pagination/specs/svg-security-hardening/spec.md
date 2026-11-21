# Spec Delta

## Purpose

Enforces strict, unconditional XML and SVG character encoding to prevent cross-site scripting (XSS) and attribute injection attacks in generated SVG cards.

## ADDED Requirements

### Requirement: Unconditional special character entity encoding
The HTML/XML encoding utility SHALL encode `<` as `&#60;`, `>` as `&#62;`, `&` as `&#38;`, `"` as `&#34;`, and `'` as `&#39;` unconditionally, regardless of subsequent characters.

#### Scenario: Input contains opening tag followed by hash
- **GIVEN** an untrusted user input string containing `<#script>alert(1)</#script>`
- **WHEN** the string is processed by `encodeHTML`
- **THEN** the `<` character is replaced with `&#60;`, preventing tag rendering in the SVG DOM.

#### Scenario: Input contains quotes followed by hash
- **GIVEN** an untrusted title parameter containing `"#' onfocus="alert(1)`
- **WHEN** the string is processed by `encodeHTML` and injected into an XML attribute
- **THEN** all double and single quotes are encoded to their respective numeric XML entities, preventing attribute breakout.
