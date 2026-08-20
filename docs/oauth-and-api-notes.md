# OAuth and Fitbit API notes

## Historical prototype

The original classroom prototype manually assembled an authorization URL, copied the returned authorization code, exchanged it for tokens in Postman, and then pasted an Access Token into JavaScript. That sequence was useful for learning the protocol, but storing credentials in front-end code or screenshots is unsafe.

## Safer flow

1. Register the Fitbit application and an exact redirect URI.
2. Redirect the user to the Fitbit authorization endpoint with the minimum required scopes.
3. Receive the authorization code at the redirect URI.
4. Exchange the code in a protected backend, or use PKCE where the platform supports it.
5. Store tokens using an appropriate server-side secret mechanism.
6. Call the Web API with `Authorization: Bearer <access_token>`.
7. Rotate or refresh tokens without exposing them to logs or screenshots.

The browser demo in this repository accepts an Access Token only at runtime. It does not save it to disk, `localStorage`, source code, or Git.

## API requests

```http
GET /1/user/-/profile.json HTTP/1.1
Host: api.fitbit.com
Authorization: Bearer <access_token>
```

```http
GET /1/user/-/activities/heart/date/2026-08-19/2026-08-20.json HTTP/1.1
Host: api.fitbit.com
Authorization: Bearer <access_token>
```

```http
GET /1/user/-/activities/list.json?beforeDate=2026-08-20&sort=desc&offset=0&limit=20 HTTP/1.1
Host: api.fitbit.com
Authorization: Bearer <access_token>
```

Use only the scopes needed by the application, and review the current Fitbit documentation before deployment because platform requirements can change.
