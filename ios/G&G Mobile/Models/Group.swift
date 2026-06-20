import Foundation

struct ChatGroup: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var members: [String]
    var messages: [Message] = []

    static func == (lhs: ChatGroup, rhs: ChatGroup) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
