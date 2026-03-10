# Cloudflare Pages + Workers

Care Lens already calls the same-origin relay path `/__gemini/...`.
This repository now includes a Cloudflare Pages Function at
`functions/__gemini/[[path]].js`, so the static app and the Gemini relay can
live behind one HTTPS origin without exposing the API key to the browser.

## What Gets Deployed

- Static files: repository root (`.`)
- Relay route: `/__gemini/*`
- Secret: `GEMINI_API_KEY`

## Cloudflare Setup

1. Create a new Pages project and connect this repository.
2. Set the build command to empty.
3. Set the build output directory to `.`.
4. Add the secret `GEMINI_API_KEY` in Pages settings for Production.
5. Add the same secret for Preview if you want preview deployments to relay.
6. Deploy.

## Health Check

After deploy, open:

```text
https://<your-pages-domain>/__gemini/health
```

Expected JSON:

```json
{
  "ok": true,
  "configured": true,
  "base": "https://generativelanguage.googleapis.com",
  "runtime": "cloudflare-pages-function"
}
```

## Local Development

Local development can keep using `local-proxy-server.mjs`.

If you want to run local Cloudflare-style dev, create `.dev.vars` from
`.dev.vars.example` and put the real Gemini key there. Do not commit
`.dev.vars`.

## Notes

- The browser never receives the Gemini API key.
- The relay only forwards requests and adds the `x-goog-api-key` header server-side.
- If the secret is missing, `/__gemini/health` returns `configured: false` and
  inference requests return `503`.
- Protect the relay with rate limits or auth if you expose it publicly.
