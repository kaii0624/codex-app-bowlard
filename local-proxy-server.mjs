import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8123);
const LMSTUDIO_BASE = "http://localhost:1234/v1";
const GEMINI_BASE = "https://generativelanguage.googleapis.com";
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".mjs", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
]);

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePathFromUrl(urlString) {
  const url = new URL(urlString, `http://localhost:${PORT}`);
  const decodedPath = decodeURIComponent(url.pathname);
  let relative = decodedPath === "/" ? "/index.html" : decodedPath;
  const abs = path.resolve(ROOT, "." + relative);
  if (!abs.startsWith(ROOT)) {
    return null;
  }
  return { url, relative, abs };
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
}

function pickProxyHeaders(req) {
  const headers = {};
  const passKeys = ["content-type", "authorization", "accept"];
  for (const key of passKeys) {
    const value = req.headers[key];
    if (typeof value === "string" && value.length > 0) {
      headers[key] = value;
    }
  }
  return headers;
}

async function handleLmStudioProxy(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const upstreamUrl = LMSTUDIO_BASE + url.pathname.replace(/^\/__lmstudio/, "") + url.search;

  if (req.method === "OPTIONS") {
    // Same-origin requests should not need this, but return a permissive response for safety.
    send(res, 204, "", {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    return;
  }

  try {
    const body = await readRequestBody(req);
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: pickProxyHeaders(req),
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    const headers = {
      "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    };
    send(res, upstream.status, responseBody, headers);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(
      res,
      502,
      JSON.stringify({ error: `LM Studio proxy failed: ${message}` }, null, 2),
      { "Content-Type": "application/json; charset=utf-8" }
    );
  }
}

function sendJson(res, status, payload, headers = {}) {
  send(
    res,
    status,
    JSON.stringify(payload, null, 2),
    {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    }
  );
}

function pickGeminiHeaders(req) {
  const headers = {};
  const contentType = req.headers["content-type"];
  const accept = req.headers.accept;
  if (typeof contentType === "string" && contentType.length > 0) {
    headers["Content-Type"] = contentType;
  }
  if (typeof accept === "string" && accept.length > 0) {
    headers.Accept = accept;
  }
  headers["x-goog-api-key"] = GEMINI_API_KEY;
  return headers;
}

async function handleGeminiProxy(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/__gemini/health") {
    sendJson(res, 200, {
      ok: true,
      configured: Boolean(GEMINI_API_KEY),
      base: GEMINI_BASE,
    });
    return;
  }

  if (req.method === "OPTIONS") {
    send(res, 204, "", {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    return;
  }

  if (!GEMINI_API_KEY) {
    sendJson(res, 503, {
      error: "Gemini proxy is not configured. Set GEMINI_API_KEY before starting local-proxy-server.mjs.",
    });
    return;
  }

  const upstreamPath = url.pathname.replace(/^\/__gemini/, "") || "/";
  const upstreamUrl = `${GEMINI_BASE}${upstreamPath}${url.search}`;

  try {
    const body = await readRequestBody(req);
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: pickGeminiHeaders(req),
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    });
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    send(res, upstream.status, responseBody, {
      "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 502, { error: `Gemini proxy failed: ${message}` });
  }
}

function tryServeFile(absPath, res) {
  try {
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      const indexPath = path.join(absPath, "index.html");
      return tryServeFile(indexPath, res);
    }
    const ext = path.extname(absPath).toLowerCase();
    const mime = MIME_TYPES.get(ext) || "application/octet-stream";
    const stream = fs.createReadStream(absPath);
    res.writeHead(200, {
      "Content-Type": mime,
      "Cache-Control": "no-store",
    });
    stream.pipe(res);
    stream.on("error", () => {
      if (!res.headersSent) {
        send(res, 500, "File read error");
      } else {
        res.destroy();
      }
    });
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    send(res, 400, "Bad Request");
    return;
  }

  if (req.url.startsWith("/__lmstudio")) {
    await handleLmStudioProxy(req, res);
    return;
  }

  if (req.url.startsWith("/__gemini")) {
    await handleGeminiProxy(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed");
    return;
  }

  const safe = safePathFromUrl(req.url);
  if (!safe) {
    send(res, 403, "Forbidden");
    return;
  }

  if (tryServeFile(safe.abs, res)) {
    return;
  }

  // directory route without trailing slash fallback
  if (tryServeFile(path.join(safe.abs, "index.html"), res)) {
    return;
  }

  send(res, 404, "Not Found");
});

server.listen(PORT, "::", () => {
  console.log(`Local proxy server running on http://localhost:${PORT}`);
  console.log(`LM Studio proxy => ${LMSTUDIO_BASE}`);
  console.log(
    GEMINI_API_KEY
      ? `Gemini proxy => ${GEMINI_BASE} (GEMINI_API_KEY loaded)`
      : "Gemini proxy => disabled (set GEMINI_API_KEY to enable)"
  );
});
