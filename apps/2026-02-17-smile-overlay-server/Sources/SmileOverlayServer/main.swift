import Foundation
@preconcurrency import GCDWebServer

func loadIndexHTML() -> Data? {
    let bundle = Bundle.module
    let candidates: [URL?] = [
        bundle.url(forResource: "index", withExtension: "html", subdirectory: "Web"),
        bundle.url(forResource: "index", withExtension: "html")
    ]

    for candidate in candidates {
        guard let url = candidate else {
            continue
        }
        if let data = try? Data(contentsOf: url) {
            return data
        }
    }

    return nil
}

let inferer = SmileInferer()
let server = GCDWebServer()

func withCORSHeaders(_ response: GCDWebServerResponse) -> GCDWebServerResponse {
    response.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin")
    response.setValue("POST, OPTIONS", forAdditionalHeader: "Access-Control-Allow-Methods")
    response.setValue("Content-Type", forAdditionalHeader: "Access-Control-Allow-Headers")
    response.setValue("true", forAdditionalHeader: "Access-Control-Allow-Private-Network")
    response.setValue("86400", forAdditionalHeader: "Access-Control-Max-Age")
    return response
}

server.addHandler(
    forMethod: "GET",
    path: "/",
    request: GCDWebServerRequest.self
) { _ in
    guard let html = loadIndexHTML() else {
        return withCORSHeaders(GCDWebServerResponse(statusCode: 500))
    }
    return withCORSHeaders(GCDWebServerDataResponse(data: html, contentType: "text/html; charset=utf-8"))
}

server.addHandler(
    forMethod: "OPTIONS",
    path: "/infer",
    request: GCDWebServerRequest.self
) { _ in
    withCORSHeaders(GCDWebServerResponse(statusCode: 204))
}

server.addHandler(
    forMethod: "POST",
    path: "/infer",
    request: GCDWebServerDataRequest.self
) { request in
    guard let dataRequest = request as? GCDWebServerDataRequest else {
        return withCORSHeaders(GCDWebServerResponse(statusCode: 400))
    }

    guard !dataRequest.data.isEmpty else {
        return withCORSHeaders(GCDWebServerResponse(statusCode: 400))
    }

    do {
        let result = try inferer.infer(jpegData: dataRequest.data)
        let jsonData = try JSONEncoder().encode(result)
        return withCORSHeaders(GCDWebServerDataResponse(data: jsonData, contentType: "application/json"))
    } catch {
        fputs("[infer] \(error)\n", stderr)
        return withCORSHeaders(GCDWebServerResponse(statusCode: 500))
    }
}

let options: [String: Any] = [
    GCDWebServerOption_Port: 8080,
    GCDWebServerOption_BindToLocalhost: true
]

do {
    try server.start(options: options)
} catch {
    fputs("[server] \(error)\n", stderr)
    exit(1)
}

if let url = server.serverURL {
    print("SmileOverlayServer running at \(url.absoluteString)")
} else {
    print("SmileOverlayServer failed to start")
    exit(1)
}

RunLoop.main.run()
