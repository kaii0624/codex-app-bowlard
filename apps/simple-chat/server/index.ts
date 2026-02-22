import 'dotenv/config';
import cors from 'cors';
import express from 'express';

type ChatInput = {
  text?: string;
  imageBase64?: string;
  imageMime?: string;
};

type ModelListResponse = {
  data?: Array<{ id?: string }>;
};

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = Number(process.env.PORT ?? 8787);
const LMSTUDIO_BASE_URL = normalizeBaseUrl(process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234/v1');
const LMSTUDIO_API_KEY = process.env.LMSTUDIO_API_KEY ?? 'lm-studio';
const LMSTUDIO_MODEL = (process.env.LMSTUDIO_MODEL ?? '').trim();
const MODELS_CACHE_TTL_MS = 30_000;

let modelsCache: { ids: string[]; fetchedAt: number } | null = null;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, lmstudioBaseUrl: LMSTUDIO_BASE_URL });
});

app.get('/api/models', async (_req, res) => {
  try {
    const ids = await fetchModelIds();
    res.json({ ok: true, data: ids.map((id) => ({ id })) });
  } catch (error) {
    res.status(502).json({ ok: false, error: toUserErrorMessage(error) });
  }
});

app.post('/api/chat', async (req, res) => {
  const body = (req.body ?? {}) as ChatInput;
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
  const imageMime = typeof body.imageMime === 'string' ? body.imageMime.trim() : '';

  if (!text && !imageBase64) {
    return res.status(400).json({
      ok: false,
      error: 'テキストまたは画像を入力してください。',
    });
  }

  if (imageBase64 && !isLikelyBase64(imageBase64)) {
    return res.status(400).json({
      ok: false,
      error: '画像データ形式が不正です。再度アップロードしてください。',
    });
  }

  try {
    const { model, autoSelected, availableModels } = await resolveModel();
    const userContent = buildUserContent({ text, imageBase64, imageMime });

    const payload = {
      model,
      messages: [
        { role: 'system', content: 'あなたは役に立つアシスタントです。' },
        { role: 'user', content: userContent },
      ],
      stream: false,
    };

    const lmResponse = await fetchWithTimeout(`${LMSTUDIO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LMSTUDIO_API_KEY}`,
      },
      body: JSON.stringify(payload),
    }, 180_000);

    const responseJson = await parseJsonSafe(lmResponse);

    if (!lmResponse.ok) {
      const providerMessage = extractProviderError(responseJson);
      const maybeModelHint = availableModels.length
        ? ` 利用可能モデル: ${availableModels.join(', ')}`
        : ' `/v1/models` でモデル一覧を確認してください。';

      return res.status(502).json({
        ok: false,
        error:
          `LM Studio 推論エラー (${lmResponse.status})。${providerMessage ?? 'モデルまたは入力形式を確認してください。'}` +
          maybeModelHint,
      });
    }

    const assistantText = extractAssistantText(responseJson);

    if (!assistantText) {
      return res.status(502).json({
        ok: false,
        error: 'LM Studio から応答を取得できませんでした。レスポンス形式を確認してください。',
      });
    }

    res.json({
      ok: true,
      text: assistantText,
      model,
      autoSelected,
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: toUserErrorMessage(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`simple-chat backend listening on http://localhost:${PORT}`);
  console.log(`LM Studio Base URL: ${LMSTUDIO_BASE_URL}`);
});

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

async function fetchModelIds(): Promise<string[]> {
  const now = Date.now();
  if (modelsCache && now - modelsCache.fetchedAt < MODELS_CACHE_TTL_MS) {
    return modelsCache.ids;
  }

  const res = await fetchWithTimeout(
    `${LMSTUDIO_BASE_URL}/models`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${LMSTUDIO_API_KEY}`,
      },
    },
    15_000,
  );

  if (!res.ok) {
    const json = await parseJsonSafe(res);
    const message = extractProviderError(json) ?? `HTTP ${res.status}`;
    throw new Error(`LM Studio の /v1/models 取得に失敗しました: ${message}`);
  }

  const json = (await parseJsonSafe(res)) as ModelListResponse;
  const ids = Array.isArray(json?.data)
    ? json.data
        .map((item) => (typeof item?.id === 'string' ? item.id : ''))
        .filter(Boolean)
    : [];

  modelsCache = { ids, fetchedAt: now };
  return ids;
}

async function resolveModel(): Promise<{ model: string; autoSelected: boolean; availableModels: string[] }> {
  let availableModels: string[] = [];

  try {
    availableModels = await fetchModelIds();
  } catch (error) {
    if (!LMSTUDIO_MODEL) {
      throw error;
    }
  }

  if (LMSTUDIO_MODEL) {
    if (availableModels.length && !availableModels.includes(LMSTUDIO_MODEL)) {
      throw new Error(
        `LMSTUDIO_MODEL='${LMSTUDIO_MODEL}' が /v1/models に存在しません。利用可能モデル: ${availableModels.join(', ')}`,
      );
    }
    return { model: LMSTUDIO_MODEL, autoSelected: false, availableModels };
  }

  const fallback = availableModels[0];
  if (!fallback) {
    throw new Error('モデル未指定で /v1/models からもモデルが取得できませんでした。LM Studio でモデルをロードしてください。');
  }

  return { model: fallback, autoSelected: true, availableModels };
}

function buildUserContent(input: Required<Pick<ChatInput, 'text' | 'imageBase64' | 'imageMime'>>): string | ContentPart[] {
  const text = input.text.trim();
  const imageBase64 = input.imageBase64.trim();

  if (!imageBase64) {
    return text;
  }

  const mime = normalizeImageMime(input.imageMime);
  const prompt = text || 'この画像を説明してください。';
  const dataUrl = `data:${mime};base64,${imageBase64}`;

  return [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: dataUrl } },
  ];
}

function normalizeImageMime(mime: string): string {
  const lower = mime.toLowerCase();
  if (lower === 'image/png' || lower === 'image/jpeg' || lower === 'image/jpg' || lower === 'image/webp') {
    return lower === 'image/jpg' ? 'image/jpeg' : lower;
  }
  return 'image/png';
}

function isLikelyBase64(value: string): boolean {
  return /^[A-Za-z0-9+/=\s]+$/.test(value);
}

async function parseJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractProviderError(json: any): string | null {
  if (!json) {
    return null;
  }

  if (typeof json?.error === 'string') {
    return json.error;
  }

  if (typeof json?.error?.message === 'string') {
    return json.error.message;
  }

  if (typeof json?.message === 'string') {
    return json.message;
  }

  if (typeof json?.raw === 'string') {
    return json.raw;
  }

  return null;
}

function extractAssistantText(json: any): string {
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toUserErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const causeCode = (error as any)?.cause?.code as string | undefined;

  if (causeCode === 'ECONNREFUSED' || /fetch failed/i.test(message)) {
    return `LM Studio に接続できません。Local Server を起動し、${LMSTUDIO_BASE_URL} を確認してください。`;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'LM Studio の応答がタイムアウトしました。モデル負荷や画像サイズを確認してください。';
  }

  return message;
}
