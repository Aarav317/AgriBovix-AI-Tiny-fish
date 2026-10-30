# Architecture

## Request flow

```text
Browser: React + React Router
  → Vite /api proxy (same origin)
  → FastAPI origin guard / session dependency
  → workspace route + task validation
  → image validation / metadata-stripping re-encode
  → dedicated configured model HTTP adapter
  → Pydantic response and evidence-format checks
  → SQLite transaction (user + workspace)
  → structured result UI
```

Image selection and preview stay in the browser until Analyze is selected. The UI never invents a result. No model configuration means an explicit 503; no database write occurs. A configured URL is a configuration flag, not proof of service health or model validity.

## Frontend boundaries

- `App.tsx` owns real routes; each workspace gets its own layout instance, preventing retained upload/chat state from crossing workspaces.
- `WorkspaceLayout` owns navigation and service status. A shared layout provides consistency; `workspaceConfig` supplies subject-specific actions, imagery, terminology, instructions and guides.
- `UploadPanel` owns a selected File, object URL lifecycle, drag/drop, client validation and analysis requests. Files are not persisted across route navigation.
- `ReportPanel` renders predictions separately from educational guidance, model uncertainty and external sources. It exports the actual saved JSON.
- `HistoryPage` reads only authenticated server records, supports 20-report pages, searches the current page and deletes an owned report with an explicit in-page confirmation.
- `AssistantPage` keeps a scoped in-memory conversation and sends the latest 19 messages. It does not simulate assistant responses or persist chat transcripts.
- `AuthProvider` obtains the current session and stores only the public user profile in memory. Secrets and session tokens are never stored in localStorage.
- Login destinations are allowlisted, preventing an external return URL.

## Backend boundaries

- `app/config.py`: environment loading; paths and provider configuration.
- `app/database/store.py`: connection lifecycle, transactions, schema and indexes.
- `app/routes/auth.py`: registration/login/logout/me and a bounded process-local auth limiter.
- `app/services/auth.py`: salted scrypt hashes, constant-time verification, opaque tokens stored as SHA-256 hashes, session expiry.
- `app/routes/workspaces.py`: separately scoped scan, assistant and history endpoints.
- `app/validators/images.py`: types, 8 MB content limit, decoding, 20 MP limit, still-image constraint, EXIF orientation, JPEG conversion capped at 2048 × 2048.
- `app/models/schemas.py`: bounded request and provider response contracts; confidence is optional and constrained to [0,1].
- `app/services/providers.py`: private HTTP calls, 60-second timeout, no redirects, structured errors and conservative livestock medication rejection.
- `app.py`: ASGI app, startup DB initialization, origin guard, headers and safe validation messages.
- `run.py`: uniquely named entrypoint loader, avoiding the `app.py`/`app/` import-name collision.

## Database

`users(id, name, email UNIQUE, password_hash, created_at)`

`sessions(token_hash PRIMARY KEY, user_id REFERENCES users, expires_at)`

`scans(id, user_id REFERENCES users, workspace CHECK, filename, result_json, created_at)`

The original client filename is a display label only, never a filesystem path. Image bytes are not stored. Every history read/delete includes both user ID and workspace. SQLite statements use parameters. Session expiry is checked on every authenticated request.

SQLite is appropriate for this local initial version. For PostgreSQL, replace `store.py` with a repository layer using a driver/ORM and migrations, convert schema types/placeholder syntax and update the small number of route queries. Authentication and model contracts can remain stable. Migration is not implemented or claimed to be automatic.

## Evidence and operational boundaries

Guides are explicitly educational. AI results are labeled predictions; a source URL does not confirm a diagnosis. Crop treatment text requires sources in the response. Livestock treatment-option arrays are rejected, and a conservative keyword guard rejects certain medication/dose content. These checks cannot prove medical safety, source reliability, relevance or model accuracy. The configured service must implement retrieval from curated sources, task support, uncertainty handling and professional review. No public-internet browsing or fabricated retrieval occurs in the backend.

Origin validation and SameSite cookies reduce cross-site request risk. Public hosting needs HTTPS/secure cookies, trusted proxy/body limits, durable distributed rate limits, incident logging, backup/retention operations and professional legal/security/model review. The API intentionally does not expose user administration or database-download endpoints.
