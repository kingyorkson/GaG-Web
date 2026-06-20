import Foundation

struct Message: Identifiable, Codable {
    let id: String
    let fromUserId: String
    let toUserId: String?
    let groupId: String?
    let content: String
    let createdAt: Date
    var read: Bool

    var isFromMe: Bool {
        fromUserId == "me"
    }
}
