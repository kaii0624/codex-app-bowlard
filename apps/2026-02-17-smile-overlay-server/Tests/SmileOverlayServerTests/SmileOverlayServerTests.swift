import CoreGraphics
import Foundation
import ImageIO
import Testing
import UniformTypeIdentifiers
@testable import SmileOverlayServer

struct SmileOverlayServerTests {
    @Test
    func testSmileOnSmilingBabyImage() throws {
        let imageData = try loadResourceData(named: "smiling_baby", ext: "jpg")
        let inferer = SmileInferer(threshold: SmileInferer.defaultThreshold)

        let result = try inferer.infer(jpegData: imageData)

        #expect(result.hasFace, "Expected face detection in smiling_baby.jpg")
        #expect(result.smile, "Expected smile=true for smiling_baby.jpg. score=\(result.score)")
    }

    @Test
    func testNoFaceOnBlankImage() throws {
        let inferer = SmileInferer(threshold: SmileInferer.defaultThreshold)
        let blackImage = try makeBlackJPEG(width: 320, height: 240)

        let result = try inferer.infer(jpegData: blackImage)

        #expect(!result.hasFace)
        #expect(!result.smile)
        #expect(abs(result.score - 0.0) < 0.0001)
    }

    private func loadResourceData(named name: String, ext: String) throws -> Data {
        let bundle = Bundle.module
        let candidates = [
            bundle.url(forResource: name, withExtension: ext, subdirectory: "Resources"),
            bundle.url(forResource: name, withExtension: ext)
        ]

        guard let url = candidates.compactMap({ $0 }).first else {
            throw NSError(domain: "SmileOverlayServerTests", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Missing resource \(name).\(ext)"
            ])
        }

        return try Data(contentsOf: url)
    }

    private func makeBlackJPEG(width: Int, height: Int) throws -> Data {
        guard width > 0, height > 0 else {
            throw NSError(domain: "SmileOverlayServerTests", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "Invalid image size"
            ])
        }

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        ) else {
            throw NSError(domain: "SmileOverlayServerTests", code: 3, userInfo: [
                NSLocalizedDescriptionKey: "Failed to create CGContext"
            ])
        }

        context.setFillColor(red: 0, green: 0, blue: 0, alpha: 1)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))

        guard let cgImage = context.makeImage() else {
            throw NSError(domain: "SmileOverlayServerTests", code: 4, userInfo: [
                NSLocalizedDescriptionKey: "Failed to create CGImage"
            ])
        }

        let output = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(
            output as CFMutableData,
            UTType.jpeg.identifier as CFString,
            1,
            nil
        ) else {
            throw NSError(domain: "SmileOverlayServerTests", code: 5, userInfo: [
                NSLocalizedDescriptionKey: "Failed to create JPEG destination"
            ])
        }

        CGImageDestinationAddImage(destination, cgImage, [
            kCGImageDestinationLossyCompressionQuality: 1.0
        ] as CFDictionary)

        guard CGImageDestinationFinalize(destination) else {
            throw NSError(domain: "SmileOverlayServerTests", code: 6, userInfo: [
                NSLocalizedDescriptionKey: "Failed to finalize JPEG"
            ])
        }

        return output as Data
    }
}
