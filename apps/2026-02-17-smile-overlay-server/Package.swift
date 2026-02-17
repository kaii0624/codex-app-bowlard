// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "SmileOverlayServer",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "SmileOverlayServer", targets: ["SmileOverlayServer"])
    ],
    dependencies: [
        .package(url: "https://github.com/yene/GCDWebServer.git", from: "3.5.7"),
        .package(url: "https://github.com/swiftlang/swift-testing.git", from: "6.2.0")
    ],
    targets: [
        .executableTarget(
            name: "SmileOverlayServer",
            dependencies: [
                .product(name: "GCDWebServer", package: "GCDWebServer")
            ],
            resources: [
                .process("Web")
            ]
        ),
        .testTarget(
            name: "SmileOverlayServerTests",
            dependencies: [
                "SmileOverlayServer",
                .product(name: "Testing", package: "swift-testing")
            ],
            resources: [
                .process("Resources")
            ]
        )
    ],
    swiftLanguageModes: [
        .v5
    ]
)
