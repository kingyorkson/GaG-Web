import Foundation

struct Call: Identifiable, Codable {
    let id: String
    let fromUserId: String
    let toUserId: String
    let groupId: String?
    var status: CallStatus
    let createdAt: Date
    var endedAt: Date?

    enum CallStatus: String, Codable {
        case ringing
        case answered
        case declined
        case ended
    }
}
