const GEMINI_BASE = "https://generativelanguage.googleapis.com";

function json(payload, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers,
  });
}

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

function pickRequestHeaders(request, apiKey) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  headers.set("x-goog-api-key", apiKey);
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/__gemini")) {
      return env.ASSETS.fetch(request);
    }

    const origin = request.headers.get("origin") || "*";
    const relayPath = url.pathname.replace(/^\/__gemini\/?/, "");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (relayPath === "health") {
      return json({
        ok: true,
        configured: Boolean(env.GEMINI_API_KEY),
        base: GEMINI_BASE,
        runtime: "cloudflare-pages-advanced-worker",
      }, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST" && request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          ...corsHeaders(origin),
          Allow: "GET, HEAD, POST, OPTIONS",
          "Cache-Control": "no-store",
        },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return json({
        error: "Gemini relay is not configured. Set GEMINI_API_KEY in Cloudflare Pages / Workers secrets.",
      }, {
        status: 503,
        headers: corsHeaders(origin),
      });
    }

    try {
      const upstreamPath = relayPath ? `/${relayPath}` : "/";
      const upstreamUrl = `${GEMINI_BASE}${upstreamPath}${url.search}`;
      const upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers: pickRequestHeaders(request, env.GEMINI_API_KEY),
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      });

      const responseHeaders = new Headers(corsHeaders(origin));
      responseHeaders.set(
        "Content-Type",
        upstream.headers.get("content-type") || "application/json; charset=utf-8"
      );
      responseHeaders.set("Cache-Control", "no-store");
      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return json({ error: `Gemini relay failed: ${message}` }, {
        status: 502,
        headers: corsHeaders(origin),
      });
    }
  },
};
