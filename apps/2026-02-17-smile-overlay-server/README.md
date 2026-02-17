# SmileOverlayServer

Minimal local-only smile overlay app for macOS (Apple Silicon).

## What it does

- Serves `http://localhost:8080/` from Swift (`GCDWebServer`)
- Captures camera frames in browser with `getUserMedia()`
- Sends JPEG frames to `POST /infer` at ~3fps
- Runs on-device Vision face landmarks (`VNDetectFaceLandmarksRequest`)
- Returns JSON:

```json
{ "smile": true, "score": 0.0, "hasFace": true }
```

- Draws `SMILE` on overlay only when `smile == true`
- Does not save images

## Run

```bash
swift run
```

Open: [http://localhost:8080/](http://localhost:8080/)

## Test

```bash
swift test
```

`Tests/SmileOverlayServerTests/Resources/smiling_baby.jpg` is included for `testSmileOnSmilingBabyImage()`.
