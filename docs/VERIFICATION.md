# Verification — 20 October 2026

## Automated checks

- Frontend production build: TypeScript checking and Vite bundle succeeded.
- Backend: **22 tests passed**. Isolated SQLite databases cover health/configuration, private histories, registration/login/logout, hashed credentials/sessions, duplicate accounts, input redaction, origin checks, throttling, missing/unreadable/unsupported/oversized/over-resolution images, task separation, unconfigured model/assistant behavior, provider schema and treatment rejection, successful fixture persistence, owner/workspace isolation and deletion.
- Frontend: **7 tests passed**. Tests cover safe login destinations, separate workspace actions, selected-image preview, passing the correct workspace/task, honest unavailable-model errors, invalid/oversized files, removal and object-URL cleanup.
- Explicit test-only provider fixtures exercise the successful result contract; production routes do not use them or seed reports.
- A Starlette dependency deprecation warning recommends a future HTTP test-client migration. It does not fail the tests; the pinned stack runs successfully.

## Browser checks

- Opened the local Vite app and read the proxied backend health endpoint.
- Desktop **1440 × 1000**: homepage and both dashboard layouts rendered; all homepage images loaded; no horizontal overflow.
- Mobile **390 × 844** and the default narrow preview: homepage and AgriVision rendered without horizontal overflow; sidebar opened with the selected crop navigation and closed through normal navigation.
- Confirmed AgriVision has no PashuVision tools/content and PashuVision has no Crop History or crop tools.
- Signed in using an isolated synthetic local QA identity and confirmed navigation returned to PashuVision, the originally selected workspace. Registration, login, logout and history privacy also passed API tests.
- Browser file-picker automation stalled and the tab session disappeared before file selection completed. The image-preview/remove/error behavior was therefore verified through the automated component tests, while image decoding, upload limits and model failures were verified through the API suite. A successful real-model call was not browser-tested.
- Final screenshots were captured from the actual application, not a generated interface mockup.

## Branding and assets

- SHA-256 comparison confirms the local original-logo asset matches the supplied file byte for byte.
- Farmer, crop and cattle images and DM Sans font are included locally; images have explicit fallbacks.
- Original logo artwork was not regenerated, cropped, recolored, filtered or redrawn.

## Limits

No genuine model, API credentials or trained weights were provided, so accuracy, model capabilities, real inference and clinical/agricultural validity could not be tested. Configuration flags are not readiness/accuracy claims. Educational guidance is separate from predictions. Production security, legal disclosures and operational controls require deployment-specific work described in README and ARCHITECTURE.
