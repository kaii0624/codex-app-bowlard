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
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  if (accept) {
    headers.set("Accept", accept);
  }
  headers.set("x-goog-api-key", apiKey);
  return headers;
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get("origin") || "*";
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path || "";

  if (path === "health") {
    return json({
      ok: true,
      configured: Boolean(env.GEMINI_API_KEY),
      base: GEMINI_BASE,
      runtime: "cloudflare-pages-function",
    });
  }

  if (request.method !== "POST" && request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!env.GEMINI_API_KEY) {
    return json(
      {
        error: "Gemini relay is not configured. Set GEMINI_API_KEY in Cloudflare Pages / Workers secrets.",
      },
      { status: 503 }
    );
  }

  try {
    const upstreamPath = path ? `/${path}` : "/";
    const upstreamUrl = `${GEMINI_BASE}${upstreamPath}${url.search}`;
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: pickRequestHeaders(request, env.GEMINI_API_KEY),
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });

    const responseHeaders = new Headers();
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
    return json(
      {
        error: `Gemini relay failed: ${message}`,
      },
      { status: 502 }
    );
  }
}
