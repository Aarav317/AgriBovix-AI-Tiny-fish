# Connecting real models and assistants

## Current state

No trained weights, model service URL or API credentials were supplied. Analysis and assistant endpoints therefore return **503** with `model_unavailable`. There are no fallback predictions, invented confidence scores, seeded scan histories or simulated chat replies.

This project includes a tested HTTP integration boundary. It does not bundle a trained computer-vision model or directly call an arbitrary consumer AI API. You must supply a service that implements the contract below, or wrap your actual model/provider API in an adapter that does. Service-specific training, deployment and model validation are outside the included source.

## 1. Select and validate capabilities

Use a model licensed for your intended use and evaluated on relevant species/crops, geography, camera conditions and disease classes. Document the dataset, supported labels, unsupported inputs, preprocessing, confidence calibration, out-of-distribution checks, thresholds and validation results.

Do not assume a plant classifier supports fruit maturity or that a cattle breed classifier can diagnose disease. The adapter must reject unsupported tasks/images instead of forcing a label. Use `confidence: null` if a calibrated model score is unavailable. Never generate a numerical confidence from chat prose.

AgriVision tasks: `general`, `crop`, `disease`, `maturity`.

PashuVision tasks: `general`, `breed`, `health`.

The UI's task links indicate intended workflows, not a claim that a currently installed model supports them. Each task is passed through to the provider. Breed/health/maturity functionality becomes available only with a suitable validated service.

## 2. Implement an image adapter

Expose a private **POST** endpoint accepting `multipart/form-data`:

| Field | Type | Meaning |
|---|---|---|
| `image` | file | Validated JPEG, EXIF metadata removed, at most 2048 × 2048 |
| `workspace` | string | `agrivision` or `pashuvision` |
| `task` | string | Intended task from the list above |

The backend sends `Authorization: Bearer <KEY>` when a key is configured. Keys never enter the frontend bundle. Adapter URLs should use HTTPS outside a trusted loopback environment. Redirects are not followed. Do not point environment values at arbitrary user-provided URLs.

Return a JSON object matching `backend/app/models/schemas.py::Analysis` exactly:

```typescript
{
  subject: string;                  // identified supported subject
  possible_condition: string|null;  // uncertain prediction, never confirmed diagnosis
  model_name: string;               // actual model/version
  confidence: number|null;          // 0..1 if available
  observations: string[];           // 1..12 supported visual observations
  care_steps: string[];             // 0..12 appropriate general care steps
  prevention: string[];             // 0..12 preventive recommendations
  treatment_options: string[];      // 0..8; evidence required; always [] for livestock
  limitations: string[];            // 1..12 explicit uncertainties/limitations
  urgency: "routine"|"expert_review"|"urgent";
  sources: { title: string; url: string }[]; // HTTP(S), 0..8
}
```

Each guidance item must be nonempty and at most 1500 characters. Subject and model name are at most 200 characters; possible condition at most 300. Extra fields are rejected. Responses over 100 KB are rejected after receipt. Configure your adapter/reverse proxy to enforce its own response limits.

The adapter should return a non-2xx error for unsupported subjects/tasks, missing model files or low-quality images. Such responses are surfaced as a structured provider error and are **not saved**. The backend does not silently substitute sample output. A successful validated response is stored as a report with a server-generated ID and UTC timestamp.

## Native Gemini + TinyFish setup

Set these server-side environment variables (for local use, in the project-root `.env`; for Render, in the **backend Web Service** environment settings):

```dotenv
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
TINYFISH_API_KEY=your_tinyfish_api_key
```

Gemini 429 responses are retried at most twice with short exponential backoff when they appear temporary. Daily-quota exhaustion is not retried: the backend returns a clear 429 message and suppresses further calls for that model until Google's reported reset time (up to 24 hours if Google provides no estimate). This cooldown is process-local; restarting the backend clears the local guard but does not restore Google's quota. Check the project's model-specific limits and billing in Google AI Studio. The TinyFish integration is independent and is not changed by Gemini quota errors.

Gemini handles image analysis and assistant responses. After a validated image analysis, the backend builds two focused research queries from the returned subject, possible condition, and visible observations. TinyFish Search executes both in parallel: one general evidence query and one query restricted to agricultural/veterinary institutional domains. TinyFish Fetch then retrieves up to four of the actual returned URLs. The report keeps visual observations separate from real search snippets and fetched page text. Search/fetch errors are shown as research status and do not discard a valid image analysis. Without `TINYFISH_API_KEY`, analysis still succeeds with an explicit unavailable research status.

The backend sends `X-API-Key` to the official TinyFish REST APIs: `GET https://api.search.tinyfish.ai` and `POST https://api.fetch.tinyfish.ai` with `{"urls":[...],"format":"markdown","per_url_timeout_ms":12000,"purpose":"..."}`. Search uses the documented `query`, `location`, `language`, `purpose`, and optional `include_domains` parameters. Returned source links are taken from TinyFish results, restricted to HTTP(S), and deduplicated. Fetched page text is shown as source context, not as a verified diagnosis or prescription. See the official [TinyFish Search API](https://docs.tinyfish.ai/search-api) and [TinyFish Fetch API](https://docs.tinyfish.ai/fetch-api) documentation.

Never place either key in frontend code, `VITE_` variables, source control, or a public ZIP. After changing local `.env`, restart the backend. `/api/health` reports whether the keys/adapters are configured, not whether provider calls are successful.

## 3. Configure environment variables

Copy `.env.example` to `.env` in the root. Example endpoints below are **illustrative local adapter addresses**, not included services:

```dotenv
AGRIVISION_MODEL_URL=http://127.0.0.1:9001/analyze
AGRIVISION_MODEL_KEY=your-private-adapter-key
PASHUVISION_MODEL_URL=http://127.0.0.1:9002/analyze
PASHUVISION_MODEL_KEY=your-private-adapter-key
```

Set only the services you actually have. Empty values keep a pipeline unavailable. Restart the backend after editing `.env`. `/api/health` then reports `analysis_configured: true` for a nonempty model URL; this is **not** a connectivity or accuracy test. Upload a supported image from a registered local account to test the complete request path. Confirm that the model service actually receives a JPEG, the correct workspace and intended task.

## Assistant adapter

Set these separately, then restart the backend:

```dotenv
AGRIVISION_ASSISTANT_URL=http://127.0.0.1:9001/chat
AGRIVISION_ASSISTANT_KEY=your-private-adapter-key
PASHUVISION_ASSISTANT_URL=http://127.0.0.1:9002/chat
PASHUVISION_ASSISTANT_KEY=your-private-adapter-key
```

The private endpoint receives **POST application/json**:

```typescript
{
  workspace: "agrivision"|"pashuvision";
  messages: {role: "user"|"assistant"; content: string}[];
  policy: string; // server-supplied scope/evidence/safety instruction
}
```

It must return:

```typescript
{
  message: string; // 1..6000 characters
  sources: {title: string; url: string}[]; // actual retrieved supporting sources
}
```

Enforce the workspace and educational-only scope in the adapter's own trusted system instruction. Treat user messages and retrieved documents as untrusted data. Do not treat the submitted `policy` field alone as a complete security mechanism. Use a real model/provider API, with retrieval from a curated trusted corpus when making factual care claims. Do not use a plant-only service to answer veterinary questions. Conversation messages are passed only to the corresponding configured workspace service.

## Evidence and treatment policy

- Separate visual observations, uncertain predictions, educational information and professional diagnosis. This application does not provide a professional diagnosis.
- Prefer appropriate non-chemical first steps for crops. Source any treatment information from reliable, relevant local agricultural references. Follow applicable product labels, crop uses and professional advice.
- Crop `treatment_options` are rejected when `sources` is empty. Link presence alone is not evidence verification: the adapter must retrieve and check relevance, applicability, dates and jurisdiction. The backend does not do this research for you.
- Livestock `treatment_options` must be empty. The adapter must not prescribe medicines, antibiotics, injections or dosages from photographs. General care, observations and prompt veterinary escalation may be appropriate.
- A conservative livestock keyword guard blocks several dose/medicine terms. It can over-reject safe wording and cannot catch every unsafe paraphrase. Treat it as defense in depth; it does not replace a validated clinical policy, reliable sources and expert evaluation.
- Low certainty, unsupported input or serious concern should produce an honest limitation/error and appropriate expert escalation, never a made-up diagnosis.

## Failure behavior

| Condition | Status / code |
|---|---|
| No model/assistant URL | 503 `model_unavailable` |
| Request timeout (60 seconds) | 504 `model_timeout` |
| Provider HTTP error/bad JSON/oversized response | 502 `model_error` |
| Schema or treatment-format rejection | 502 `invalid_model_result` |
| Invalid assistant output/safety rejection | 502 `invalid_assistant_result` |

Only a validated success is saved. A failed call never populates history. Automated tests use isolated explicit fixtures to validate those boundaries; they do not establish real model accuracy or safety. Real-provider inference was not tested because no genuine model or credentials were provided.
