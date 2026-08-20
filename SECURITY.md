# Security notes

This repository is a sanitized teaching version of an older prototype.

## Data that must stay out of Git

- Fitbit Client Secrets
- OAuth authorization codes
- Access and refresh tokens
- Browser Authorization headers
- Real names, email addresses, dates of birth, user IDs, physical measurements, or activity histories
- Hospital credentials, patient records, or FHIR server credentials

## Recommended design

Use a short-lived Authorization Code flow with PKCE when supported. If a Client Secret is required, exchange the authorization code on a protected backend and keep the secret in a secret manager or server environment variable. Do not place it in browser JavaScript.

Before publishing screenshots, check the address bar, bookmarks, account avatar, developer console, API response, form fields, and application settings for identifiers or credentials.

Any historical credential that has been embedded in code or a presentation should be revoked and replaced, even if it has expired.
