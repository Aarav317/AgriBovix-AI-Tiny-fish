# AgriBovix AI

**Smarter Farming. Healthier Livestock. Better Tomorrow.**

A complete local React/TypeScript + FastAPI + SQLite application, designed around the supplied agricultural website references. AgriVision and PashuVision have separate route trees, content, scans, guides, assistants, and private report histories. The supplied logo is included unchanged.

## What works

- Responsive homepage with local farm, crop and cattle photos, local typography, real navigation and workspace selection.
- Persistent English, Hindi and Kannada interface language selection; new Gemini analysis and assistant responses follow the selected language. Previously saved report text stays in the language in which it was generated, and external source text remains in its publisher's language.
- Separate AgriVision and PashuVision dashboards, scan pages, history pages, guides, assistant interfaces and account settings.
- JPG/PNG/WebP selection, drag/drop, preview, replacement and removal; frontend and backend file checks.
- Account registration, sign-in and sign-out with scrypt password hashes, opaque HttpOnly cookie sessions, origin checks and sign-in throttling.
- Login returns to the selected workspace or supported workspace page.
- Backend API integration and SQLite reports scoped to the authenticated user **and** workspace; report export and deletion.
- Source-linked educational crop and animal-care guides, available without a model.
- Gemini image analysis followed by two focused TinyFish web searches and page retrieval; real search snippets, fetched text, source links, and research status are shown separately from visual observations.
- Separate HTTP adapters for private image models and assistants. Responses are validated before display or persistence.
- Honest loading, offline, invalid-file, empty-history and model-unavailable states.

Configure `GEMINI_API_KEY` and `TINYFISH_API_KEY` in the server-side project-root `.env` to enable Gemini image analysis/chat and TinyFish live web research; never put keys in frontend settings. If Gemini is unavailable, analysis returns an explicit error and is not saved. If TinyFish is unavailable, the validated image analysis is still saved with a clear research-unavailable status and no invented sources. Upload preview, navigation, accounts and guides work without those external services.

## Windows setup

Use **Python 3.12** (3.11+ should work) and **Node.js 22 LTS or newer**. Vite requires Node 20.19+ or 22.12+. Commands below use PowerShell and do not require activating the virtual environment. Start in the extracted `AgriBovix-AI` directory.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-lock.txt
Copy-Item .env.example .env
Set-Location frontend
npm.cmd ci
Set-Location ..
```

If Python 3.12 is your default interpreter, `python -m venv .venv` also works. `requirements.txt` lists the direct dependencies; `requirements-lock.txt` pins the tested Python environment. `package-lock.json` pins frontend dependencies.

Start the backend in one terminal:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m uvicorn run:application --host 127.0.0.1 --port 8000
```

Start the frontend in a second terminal, from the project root:

```powershell
Set-Location frontend
npm.cmd run dev
```

Open **http://127.0.0.1:3000/**. Use the same hostname throughout. The frontend proxies `/api` to `http://127.0.0.1:8000`, so cookies stay on the frontend origin. Port 3000 is intentional; port 5173 was blocked on the development computer.

Expected backend startup: `Application startup complete` and a listening address on port 8000. Expected frontend startup: `Local: http://127.0.0.1:3000/`. AI availability reflects the server-side model configuration; provider errors are reported explicitly.

After setup, the root-level `.\start-local.ps1` command works in Windows PowerShell 5.1 or newer. It checks dependencies and ports, avoids duplicating this project's servers, and opens separate visible backend and frontend windows. Press **Ctrl+C** in each window to stop its server. The optional `start.ps1`/`stop.ps1` pair still requires PowerShell 7 and runs the servers hidden with logs under `.runtime/`.

## Try the main workflows

1. Open the homepage and choose AgriVision. Only crop tools and navigation appear.
2. Choose a plant photo. Its preview appears locally. Replace or remove it as needed.
3. Choose **Sign in to Analyze**, then create your own local account. The selected workspace is retained. Re-select the photo after navigating through login; selected image files are not persisted across navigation.
4. Analyze the image. Gemini returns structured visual observations and uncertainty. TinyFish runs general and institutional-domain searches derived from those observations, then fetches up to four returned pages. The report keeps visual observations distinct from actual source snippets and retrieved page text. Research errors do not erase a valid image analysis.
5. Open Crop History, inspect a saved report, export its JSON, or delete it. Reports require sign-in and are private to their owner.
6. Return home and open PashuVision. Its animal tools, guide, assistant and history are separate from AgriVision.
7. Open AI Assistant. Suggestions fill the composer. A connected service can answer; without one, sending a question produces an explicit unavailable message. Chats are held in memory for this visit.

## Configure genuine AI

See [docs/AI_MODEL_SETUP.md](docs/AI_MODEL_SETUP.md) for Gemini + TinyFish setup, environment variables, private adapter contracts, response schemas, failure behavior and validation requirements. Do not put secrets in frontend files or any `VITE_` variable.

The image adapter must be backed by a real trained model with validated capabilities. A crop classifier must not be used to claim livestock health assessment. Breed, maturity and disease tasks must be enabled only when supported by the specific service. Treatment information requires reliable evidence and expert review.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend readiness and configuration flags |
| POST | `/api/auth/register` | Create a local account |
| POST | `/api/auth/login` | Start a session |
| GET | `/api/auth/me` | Read the current user; 401 for guests |
| POST | `/api/auth/logout` | Invalidate the current session |
| POST | `/api/agrivision/analyze` | Multipart `image`, optional `task` and `language` (`en`, `hi`, `kn`) |
| POST | `/api/pashuvision/analyze` | Separate livestock pipeline; same optional `language` values |
| GET | `/api/{workspace}/history` | Private reports, `limit` and `offset` |
| DELETE | `/api/{workspace}/history/{id}` | Delete an owned report |
| POST | `/api/assistant/agrivision` | Agriculture assistant; optional JSON `language` (`en`, `hi`, `kn`) |
| POST | `/api/assistant/pashuvision` | Livestock assistant; optional JSON `language` (`en`, `hi`, `kn`) |

Interactive API documentation: **http://127.0.0.1:8000/docs**. Authenticated routes use a cookie set by registration/login. Errors have `detail.code` and `detail.message`. Relevant statuses: 401 authentication, 403 origin, 413 size, 415 type, 422 validation, 429 rate limit, 502 invalid provider response, 503 unconfigured model, 504 timeout.

## Tests and build

From the project root:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
Set-Location frontend
npm.cmd test
npm.cmd run build
```

`npm.cmd run preview` serves the production build on **http://127.0.0.1:4173/** and proxies the same backend. Keep the backend running. `npm.cmd run format` formats frontend source. API tests use isolated temporary databases and explicit test-only model fixtures; the application never seeds fake scan results.

## Structure

```text
AgriBovix-AI/
  frontend/
    public/{images,logo,fonts}/
    src/{components,hooks,i18n,layouts,pages,services,styles,types}/
    package.json, package-lock.json, vite.config.ts
  backend/
    app/{database,models,routes,services,validators}/
    tests/
    app.py, run.py, requirements.txt, requirements-lock.txt
  docs/
    ARCHITECTURE.md, AI_MODEL_SETUP.md, ASSETS.md, VERIFICATION.md
  .env.example, .gitignore, start.ps1, stop.ps1, README.md
```

SQLite is created automatically at `backend/data/agribovix.db` on first startup. Override `DATABASE_PATH` in `.env` if needed. Uploaded images are re-encoded in memory and not stored; successful structured reports are stored. Back up the database using SQLite's backup API when the service is running.

## Scope and deployment notes

This is a runnable local prototype with genuine service integration points. There are no bundled trained models, sample diagnoses, email verification, password reset, profile editing, account-deletion UI, contact delivery or external expert booking. The interface identifies unavailable features. Contact information is an explicit placeholder. Privacy and terms pages are prototype disclosures and need an operator identity before public deployment.

Before hosting publicly: use HTTPS, set `COOKIE_SECURE=true` and the exact `FRONTEND_ORIGIN`, configure an upload body limit at the reverse proxy, add durable rate limiting and monitoring, review source retrieval and model safety with relevant experts, define retention rules, and supply real contact/legal details. The process-local auth throttle is intended for a single local server. Framework development servers are not production hosting.

The provided ZIP excludes dependencies, virtual environments, local databases, secrets, build output and caches. Install dependencies after extraction.
