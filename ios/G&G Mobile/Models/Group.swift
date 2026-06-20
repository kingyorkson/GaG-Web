import Foundation

struct Group: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var members: [String]
    var messages: [Message] = []

    static func == (lhs: Group, rhs: Group) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
