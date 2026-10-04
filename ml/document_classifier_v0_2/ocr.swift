// Local training-data OCR only. This does not add OCR to the browser extension.
import Foundation
import Vision
import ImageIO
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let items = try JSONSerialization.jsonObject(with: Data(contentsOf: input)) as! [[String:String]]
var output: [[String:Any]] = []
for item in items {
    let start = Date()
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["en-US"]
    request.usesLanguageCorrection = false
    let handler = VNImageRequestHandler(url: URL(fileURLWithPath: item["path"]!), options: [:])
    try handler.perform([request])
    let lines = (request.results ?? []).compactMap { observation -> [String:Any]? in
        guard let text = observation.topCandidates(1).first else { return nil }
        let b = observation.boundingBox
        return ["text":text.string, "confidence":text.confidence, "box":[b.minX,b.minY,b.width,b.height]]
    }
    output.append(["id":item["id"]!, "text":lines.map{$0["text"] as! String}.joined(separator:"\n"), "lines":lines, "milliseconds":Date().timeIntervalSince(start)*1000])
}
let data = try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys])
try data.write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
