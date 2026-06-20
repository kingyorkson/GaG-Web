import Foundation

struct Garden: Identifiable, Codable {
    let id: String
    let ownerId: String
    var ownerName: String
    var plantCount: Int
    var cropCount: Int
    var lastWatered: Date?
}
