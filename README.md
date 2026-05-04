# TCSS 460 — Group Project Backend

Express + TypeScript API for the TCSS 460 group project.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server (auto-reloads on changes)
npm run dev
```

The server starts at [http://localhost:3000](http://localhost:3000).

API documentation is at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Scripts

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start dev server with auto-reload |
| `npm run build`        | Compile TypeScript to `dist/`     |
| `npm start`            | Run compiled output               |
| `npm test`             | Run tests                         |
| `npm run lint`         | Run ESLint                        |
| `npm run format`       | Format code with Prettier         |
| `npm run format:check` | Check formatting                  |

## Deployed URL

https://tcss460-team-8-api.onrender.com/

## Authentication

Tokens are issued by the shared **auth-squared** service — this API never mints
tokens. Every authenticated request must carry an `Authorization: Bearer <token>`
header. Tokens are verified against the issuer's JWKS (RS256), with the audience
claim required to match this group's audience name.

| Setting   | Value             |
| --------- | ----------------- |
| Issuer    | `AUTH_ISSUER` env |
| Audience  | `group-8-api`     |
| Algorithm | RS256             |

To get a token for the deployed API, use the TCSS 460 Token Playground, pick
the `group-8-api` audience, sign in, and copy the access token.

### Role gating

Roles arrive on the token as PascalCase strings: `User`, `Moderator`, `Admin`,
`SuperAdmin`, `Owner`. The middleware exposes both an exact-match gate
(`requireRole('Admin')`) and a hierarchy gate
(`requireRoleAtLeast('Admin')` — accepts Admin, SuperAdmin, Owner). Use the
hierarchy form for "any privileged user" gates and the exact form for narrow
cases.

### Test stub

In `NODE_ENV=test`, JWKS verification is replaced by a stub that reads an
`X-Test-User: {"sub":"...","role":"Admin","email":"..."}` header and attaches
the parsed payload to `request.user`. The real middleware is exercised
end-to-end through the deployed API, not via the unit suite.
