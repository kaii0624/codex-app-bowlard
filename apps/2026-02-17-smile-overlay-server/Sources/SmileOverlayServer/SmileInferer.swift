import Foundation
import Vision

struct InferResult: Codable, Equatable {
    let smile: Bool
    let score: Double
    let hasFace: Bool
}

private struct NormalizedPoint {
    let x: Double
    let y: Double
}

final class SmileInferer {
    static let defaultThreshold: Double = 2.2

    private let threshold: Double

    init(threshold: Double = SmileInferer.defaultThreshold) {
        self.threshold = threshold
    }

    func infer(jpegData: Data) throws -> InferResult {
        let request = VNDetectFaceLandmarksRequest()
        let handler = VNImageRequestHandler(data: jpegData, options: [:])
        try handler.perform([request])

        guard let face = request.results?.first else {
            return InferResult(smile: false, score: 0.0, hasFace: false)
        }

        guard let landmarks = face.landmarks else {
            return InferResult(smile: false, score: 0.0, hasFace: false)
        }

        var mouthPoints = [NormalizedPoint]()
        if let outerLips = landmarks.outerLips {
            mouthPoints.append(contentsOf: mapPoints(in: outerLips, from: face.boundingBox))
        }
        if let innerLips = landmarks.innerLips {
            mouthPoints.append(contentsOf: mapPoints(in: innerLips, from: face.boundingBox))
        }

        guard mouthPoints.count >= 2 else {
            return InferResult(smile: false, score: 0.0, hasFace: false)
        }

        let leftCorner = mouthPoints.min { $0.x < $1.x }!
        let rightCorner = mouthPoints.max { $0.x < $1.x }!

        let mouthWidth = distance(from: leftCorner, to: rightCorner)
        let mouthOpen = estimateMouthOpen(from: landmarks, faceBox: face.boundingBox)

        let score = mouthWidth / (mouthOpen + 1e-4)
        return InferResult(smile: score > threshold, score: score, hasFace: true)
    }

    private func mapPoints(in region: VNFaceLandmarkRegion2D, from faceBox: CGRect) -> [NormalizedPoint] {
        let points = region.normalizedPoints
        var mapped = [NormalizedPoint]()
        mapped.reserveCapacity(Int(region.pointCount))

        for index in 0..<Int(region.pointCount) {
            let point = points[index]
            mapped.append(
                NormalizedPoint(
                    x: Double(faceBox.origin.x + faceBox.size.width * point.x),
                    y: Double(faceBox.origin.y + faceBox.size.height * point.y)
                )
            )
        }

        return mapped
    }

    private func estimateMouthOpen(from landmarks: VNFaceLandmarks2D, faceBox: CGRect) -> Double {
        guard let outerLips = landmarks.outerLips else {
            return 0.03
        }

        let points = mapPoints(in: outerLips, from: faceBox)
        guard points.count >= 4 else {
            return 0.03
        }

        let sorted = points.sorted { $0.y < $1.y }
        let sampleCount = max(1, points.count / 4)

        let upperLipMid = centroid(of: Array(sorted.prefix(sampleCount)))
        let lowerLipMid = centroid(of: Array(sorted.suffix(sampleCount)))
        return max(distance(from: upperLipMid, to: lowerLipMid), 1e-4)
    }

    private func centroid(of points: [NormalizedPoint]) -> NormalizedPoint {
        let sum = points.reduce((x: 0.0, y: 0.0)) { partial, point in
            (x: partial.x + point.x, y: partial.y + point.y)
        }

        let count = Double(points.count)
        return NormalizedPoint(x: sum.x / count, y: sum.y / count)
    }

    private func distance(from lhs: NormalizedPoint, to rhs: NormalizedPoint) -> Double {
        let dx = lhs.x - rhs.x
        let dy = lhs.y - rhs.y
        return (dx * dx + dy * dy).squareRoot()
    }
}
