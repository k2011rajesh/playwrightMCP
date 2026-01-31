# Xray samples and example responses

## Sample JUnit (see `test-results/sample-results.xml`)

This is a minimal JUnit XML Playwright produces; Xray will map test names containing Jira test keys like `PROJ-101`.

## Xray Cloud — authenticate (example)
Request:

```bash
curl -s -X POST 'https://xray.cloud.getxray.app/api/v2/authenticate' \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET"}'
```

Response (example):

```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Note: Xray Cloud returns a raw token string (not an object) which you must pass as `Authorization: Bearer <TOKEN>`.

## Xray Cloud — import JUnit (example)

Request (curl):

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  -F "file=@test-results/results.xml" \
  "https://xray.cloud.getxray.app/api/v2/import/execution/junit?testExecutionKey=PROJ-EXEC-1"
```

Example response (illustrative):

```json
{
  "testExecIssueKey": "PROJ-EXEC-1",
  "imported": 1,
  "updated": 0,
  "tests": [
    { "testKey": "PROJ-101", "status": "PASSED" }
  ]
}
```

## Troubleshooting
- If Xray does not map tests to Jira Test issues, confirm the JUnit test `name` contains the Jira Test key exactly (e.g., `PROJ-123`).
- For Xray Server/DC the import endpoint differs; consult your Xray Server/DC docs.

## Use with `scripts/upload-xray.js`
- `scripts/upload-xray.js` authenticates and uploads `test-results/results.xml` (or set `JUNIT_PATH` to another file).
- Required env vars: `XRAY_CLIENT_ID`, `XRAY_CLIENT_SECRET`. Optional: `XRAY_TEST_EXEC`.
