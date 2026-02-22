import { ChangeEvent, FormEvent, useRef, useState } from 'react';

type ApiResponse = {
  ok: boolean;
  text?: string;
  error?: string;
  model?: string;
  autoSelected?: boolean;
};

type ChatRow = {
  id: number;
  role: 'user' | 'assistant' | 'error';
  text: string;
  imagePreview?: string;
  meta?: string;
};

type PreparedImage = {
  base64: string;
  mime: string;
  previewUrl: string;
  name: string;
};

const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function App() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('待機中');
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSend = Boolean(text.trim() || image) && !isSending;

  async function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLocalError('');

    if (!ACCEPTED_MIME.has(file.type)) {
      setLocalError('png / jpg / webp を選んでください。');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError('画像サイズが大きすぎます（8MB以下）。');
      event.target.value = '';
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const previewUrl = `data:${file.type};base64,${base64}`;

      setImage({
        base64,
        mime: file.type,
        previewUrl,
        name: file.name,
      });
      setStatus('画像を準備しました');
    } catch {
      setLocalError('画像の読み込みに失敗しました。');
    }
  }

  function clearImage() {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setStatus('画像をクリアしました');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const prompt = text.trim();
    const sendingImage = image;

    setIsSending(true);
    setLocalError('');
    setStatus('送信中...');

    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'user',
        text: prompt || '(画像のみ)',
        imagePreview: sendingImage?.previewUrl,
      },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          imageBase64: sendingImage?.base64,
          imageMime: sendingImage?.mime,
        }),
      });

      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `リクエスト失敗 (${res.status})`);
      }

      setRows((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: data.text || '(空の応答)',
          meta: data.model ? `model: ${data.model}${data.autoSelected ? ' (auto)' : ''}` : undefined,
        },
      ]);

      setStatus('応答を受信しました');
      setText('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '送信に失敗しました。';
      setRows((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'error',
          text: message,
        },
      ]);
      setStatus('エラー');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Simple Chat</h1>
          <p>LM Studio (OpenAI互換)</p>
        </div>
        <span className="status-chip" aria-live="polite">
          {status}
        </span>
      </header>

      <section className="composer-panel" aria-label="入力">
        <form onSubmit={onSubmit} className="composer-form">
          <label className="field-label" htmlFor="prompt">
            テキスト
          </label>
          <textarea
            id="prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="質問 / 指示"
            rows={4}
          />

          <div className="file-row">
            <label className="file-button" htmlFor="image-input">
              画像を選択
            </label>
            <input
              ref={fileInputRef}
              id="image-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickFile}
            />
            {image ? (
              <button type="button" className="ghost-button" onClick={clearImage}>
                クリア
              </button>
            ) : null}
          </div>

          {image ? (
            <div className="preview-wrap">
              <img src={image.previewUrl} alt="選択画像プレビュー" />
              <div className="preview-meta">{image.name}</div>
            </div>
          ) : (
            <div className="preview-empty">画像なし</div>
          )}

          {localError ? <p className="inline-error">{localError}</p> : null}

          <button type="submit" className="submit-button" disabled={!canSend}>
            {isSending ? '送信中...' : '送信'}
          </button>
        </form>
      </section>

      <section className="log-panel" aria-label="応答">
        {rows.length === 0 ? <div className="empty-log">まだ送信していません</div> : null}
        {rows.map((row) => (
          <article key={row.id} className={`log-row ${row.role}`}>
            <div className="row-head">{row.role === 'user' ? 'You' : row.role === 'assistant' ? 'AI' : 'Error'}</div>
            {row.imagePreview ? <img className="row-image" src={row.imagePreview} alt="送信画像" /> : null}
            <pre>{row.text}</pre>
            {row.meta ? <div className="row-meta">{row.meta}</div> : null}
          </article>
        ))}
      </section>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('read failed'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });

  const commaIndex = dataUrl.indexOf(',');
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}
