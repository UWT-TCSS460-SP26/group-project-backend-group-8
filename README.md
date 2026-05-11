# TCSS 460 — Group 8 Backend API

Express + TypeScript REST API for the TCSS 460 group project. Serves TMDB
movie/TV proxy routes, user reviews and ratings persisted in Postgres, and
admin bug-report triage. Auth is RS256 JWTs issued by the shared **Auth²**
service.

---

## For partner front-end developers

This section answers what you need to start calling the deployed API. If
something is unclear or missing, file a bug report (see below) — the README
is part of the contract.

### 1. Deployed API URL

```
https://tcss460-team-8-api.onrender.com
```

Hosted on Render's free tier. First request after idle takes ~30s while the
container cold-starts; subsequent requests are fast.

### 2. Getting a token

Mint an access token at the course **Token Playground** with this group's
audience:

- Playground: <https://tcss-460-iam.onrender.com/playground>
- Issuer: `https://tcss-460-iam.onrender.com`
- **Audience: `group-8-api`** (required — the API rejects tokens with any
  other `aud` claim)
- Algorithm: RS256, verified against the issuer's JWKS

Pass the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

This API never mints tokens — token issuance is owned entirely by Auth².

### 3. Endpoint reference

Full OpenAPI spec, with request/response schemas and example payloads:

```
https://tcss460-team-8-api.onrender.com/api-docs
```

Raw JSON: `/openapi.json`. Spec changes ship in the same PR as code changes
— if the spec says something, the deployed API does that thing.

### 4. CORS allowlist

The deployed API echoes `Access-Control-Allow-Origin` only for origins on
the allowlist. The list is the `CORS_ALLOWED_ORIGINS` environment variable
(comma-separated, no spaces) on Render. Requests with no `Origin` header
(curl, server-to-server) are always permitted.

**Current allowlist:** configured per deployment — check Render env vars or
ping the team. Defaults for local dev: `http://localhost:3000`,
`http://localhost:5173`.

**To add your origin:** open a PR updating `.env.example` and request the
Render env var be updated. A production rollout is a single env-var change
— no code deploy required.

### 5. Filing bug reports

Submit a bug report against this API at **POST `/v1/issues`** (no auth
required). See `/api-docs` for the request schema.

A consumer-facing Bug Tracker FE ships in Sprint 5; until then, file via
the endpoint directly or open a GitHub issue on this repo.

### 6. Known limits & quirks

- **Render cold start:** first request after ~15min of idle takes 20–40s.
- **TMDB upstream:** routes under `/v1/movie/*` and `/v1/tv/*` proxy TMDB.
  TMDB rate-limits aggressive traffic. Errors from TMDB surface as `502`.
- **`/me` self-list routes** (`/v1/reviews/me`, `/v1/ratings/me`) derive
  the caller exclusively from the JWT `sub` claim. Any `userId` query
  parameter is ignored — do not rely on it as a filter.
- **`author` on every review/rating:** every review/rating response carries
  an `author` object `{ id, subjectId, displayName }`. When the original
  author has been deleted, `author` is `null`. Render the fallback locally.
- **PATCH semantics on `/v1/issues/:id`** (admin triage, Sprint 4): partial
  bodies are merged; unknown status strings return `400`.
- **Express 5 query coercion:** numeric query params are coerced via Zod
  (`page=2` works as a string from the URL); do not send arrays.

---

## Local development

### Quick start

```bash
npm install
cp .env.example .env
# Fill in TMDB_API_KEY, DATABASE_URL, AUTH_ISSUER, API_AUDIENCE
npm run db:setup    # one-time: migrate + generate + seed
npm run dev
```

Server runs at <http://localhost:3000>; docs at
<http://localhost:3000/api-docs>.

Requires Node 22 (`engines.node` in package.json).

### Scripts

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start dev server with auto-reload |
| `npm run build`        | Compile TypeScript to `dist/`     |
| `npm start`            | Run compiled output               |
| `npm test`             | Run Jest test suite               |
| `npm run lint`         | Run ESLint                        |
| `npm run format`       | Format code with Prettier         |
| `npm run prisma:migrate` | Run Prisma migrations           |
| `npm run prisma:seed`  | Seed development data             |
| `npm run prisma:studio` | Open Prisma Studio              |

### Environment variables

| Var                     | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `PORT`                  | HTTP port (default 3000)                                 |
| `DATABASE_URL`          | Postgres connection string (Supabase pooled)             |
| `TMDB_API_KEY`          | TMDB v3 API key for the proxy routes                     |
| `AUTH_ISSUER`           | Auth² issuer URL (`https://tcss-460-iam.onrender.com`)   |
| `API_AUDIENCE`          | Expected `aud` claim — must be `group-8-api`             |
| `CORS_ALLOWED_ORIGINS`  | Comma-separated allowlist of partner origins             |
