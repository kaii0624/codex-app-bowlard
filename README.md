# LM Studio Local Chat (Simple Chat)

LM Studio をローカル LLM/VLM サーバとして使うための接続手順と、画像/テキスト対応の最小チャットアプリをこのリポジトリに追加しています。

## 先に読むドキュメント
- セットアップ手順: [`docs/LMSTUDIO_SETUP.md`](./docs/LMSTUDIO_SETUP.md)
- API接続定型: [`docs/LMSTUDIO_API.md`](./docs/LMSTUDIO_API.md)

## 1分で動かす手順
1. LM Studio を起動してモデルをロード
2. LM Studio の Local Server (OpenAI compatible API) を起動
3. ベースURLが `http://localhost:1234/v1` であることを確認
4. アプリを起動

```bash
cd apps/simple-chat
cp .env.example .env
npm install
npm run dev
```

5. ブラウザで開く
- フロント: `http://localhost:5173`
- バックエンド疎通確認(任意): `http://localhost:8787/api/health`

## simple-chat の概要
- テキストのみ推論: OK
- 画像 + テキスト推論: OK (Vision対応モデルが必要)
- バックエンドが LM Studio OpenAI互換 API (`/v1/chat/completions`) にプロキシ
- `LMSTUDIO_MODEL` 未指定時は `/v1/models` から先頭モデルを自動選択

## 環境変数（`apps/simple-chat/.env`）
```env
LMSTUDIO_BASE_URL=http://localhost:1234/v1
LMSTUDIO_API_KEY=lm-studio
LMSTUDIO_MODEL=
PORT=8787
```

## よくあるハマりどころ
- 画像推論が失敗する: Vision対応モデルを選んでいない
- 接続できない: LM Studio Local Server が未起動 / ポート違い
- モデルエラー: `GET /v1/models` でモデルIDを確認
