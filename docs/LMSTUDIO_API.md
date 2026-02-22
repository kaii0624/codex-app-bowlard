# LM Studio OpenAI互換 API 接続定型

このドキュメントは、LM Studio のローカルサーバ (`OpenAI compatible API`) に接続するための定型です。

## 基本方針
- LM Studio を **OpenAI互換 API** として扱う
- ベースURLは通常 **`http://localhost:1234/v1`**
- APIキーは LM Studio 側で厳密に不要な場合でも、クライアント実装の都合でダミー値を設定することがある

## 接続情報（定型）
- `BASE_URL`: `http://localhost:1234/v1`
- `API_KEY`: `lm-studio`（ダミー例）
- 主に使うエンドポイント:
  - `POST /v1/chat/completions`
  - `GET /v1/models`（モデル一覧/モデルID確認）

## モデル名の取得方法
### curl
```bash
curl http://localhost:1234/v1/models
```

返ってきた JSON の `data[].id` を使う。

## 最小リクエスト例（テキストのみ）
### curl
```bash
curl -X POST http://localhost:1234/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer lm-studio' \
  -d '{
    "model": "<model-id>",
    "messages": [
      {"role": "system", "content": "あなたは役に立つアシスタントです"},
      {"role": "user", "content": "今日の予定を3つに整理して"}
    ],
    "stream": false
  }'
```

### Node.js (fetch)
```js
const baseUrl = process.env.BASE_URL ?? 'http://localhost:1234/v1';
const apiKey = process.env.API_KEY ?? 'lm-studio';
const model = process.env.MODEL ?? '<model-id>';

const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: 'あなたは役に立つアシスタントです' },
      { role: 'user', content: 'こんにちは' },
    ],
    stream: false,
  }),
});

const data = await res.json();
console.log(data.choices?.[0]?.message?.content);
```

### Python (requests)
```python
import os
import requests

base_url = os.getenv('BASE_URL', 'http://localhost:1234/v1')
api_key = os.getenv('API_KEY', 'lm-studio')
model = os.getenv('MODEL', '<model-id>')

res = requests.post(
    f"{base_url}/chat/completions",
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    },
    json={
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'あなたは役に立つアシスタントです'},
            {'role': 'user', 'content': 'こんにちは'},
        ],
        'stream': False,
    },
    timeout=120,
)
res.raise_for_status()
print(res.json().get('choices', [{}])[0].get('message', {}).get('content'))
```

## 最小リクエスト例（画像 + テキスト）
OpenAI互換形式では、`messages[n].content` を配列にして `text` と `image_url` を同居させる。

### リクエスト形式（要点）
```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "この画像を説明して" },
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/png;base64,iVBORw0KGgoAAA..."
      }
    }
  ]
}
```

### curl（短縮例）
```bash
IMG_DATA_URL='data:image/png;base64,<BASE64>'

curl -X POST http://localhost:1234/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer lm-studio' \
  -d "{
    \"model\": \"<vision-model-id>\",
    \"messages\": [
      {\"role\": \"system\", \"content\": \"あなたは役に立つアシスタントです\"},
      {
        \"role\": \"user\",
        \"content\": [
          {\"type\": \"text\", \"text\": \"この画像を説明して\"},
          {\"type\": \"image_url\", \"image_url\": {\"url\": \"${IMG_DATA_URL}\"}}
        ]
      }
    ],
    \"stream\": false
  }"
```

### Node.js (fetch)
```js
const baseUrl = process.env.BASE_URL ?? 'http://localhost:1234/v1';
const apiKey = process.env.API_KEY ?? 'lm-studio';
const model = process.env.MODEL ?? '<vision-model-id>';

const imageDataUrl = 'data:image/png;base64,<BASE64>';

const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: 'あなたは役に立つアシスタントです' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'この画像を説明して' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
    stream: false,
  }),
});

const data = await res.json();
console.log(data.choices?.[0]?.message?.content);
```

### Python (requests)
```python
import os
import requests

base_url = os.getenv('BASE_URL', 'http://localhost:1234/v1')
api_key = os.getenv('API_KEY', 'lm-studio')
model = os.getenv('MODEL', '<vision-model-id>')
image_data_url = 'data:image/png;base64,<BASE64>'

payload = {
    'model': model,
    'messages': [
        {'role': 'system', 'content': 'あなたは役に立つアシスタントです'},
        {
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'この画像を説明して'},
                {'type': 'image_url', 'image_url': {'url': image_data_url}},
            ],
        },
    ],
    'stream': False,
}

res = requests.post(
    f"{base_url}/chat/completions",
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    },
    json=payload,
    timeout=180,
)
res.raise_for_status()
print(res.json().get('choices', [{}])[0].get('message', {}).get('content'))
```

## レスポンスの読み方
基本は以下を読む:
- `choices[0].message.content`

注意:
- 実装/モデルによって `content` が配列で返る場合がある
- その場合は `[{type:'text', text:'...'}]` の `text` を連結して扱うと安全

## モデル未指定時の扱い（推奨）
- `GET /v1/models` を呼ぶ
- `data[0].id` を暫定選択する（ローカル開発向け）
- ただし本番運用では明示的にモデルIDを固定する方が安全

## ストリーミング（任意）
### 使わない場合
- `stream: false`（実装が単純）

### 使う場合
- `stream: true` を指定
- `text/event-stream` を逐次パースする
- ブラウザUI側は段階表示できるが、プロキシ実装が少し増える

ローカル検証の最初の一歩では、まず `stream: false` を推奨。

## 接続トラブル時の確認順
1. LM Studio の Local Server が起動中か
2. `BASE_URL` が `http://localhost:1234/v1` か
3. `GET /v1/models` が返るか
4. 指定モデルIDが `data[].id` に存在するか
5. 画像推論時は Vision対応モデルか

## 推奨環境変数名（再利用しやすい命名）
- `LMSTUDIO_BASE_URL=http://localhost:1234/v1`
- `LMSTUDIO_API_KEY=lm-studio`
- `LMSTUDIO_MODEL=<model-id>`

この命名で統一すると、複数アプリ間で接続コードを使い回しやすい。
