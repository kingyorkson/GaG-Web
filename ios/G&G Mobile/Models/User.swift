import Foundation

struct User: Identifiable, Codable, Hashable {
    let id: String
    var username: String
    var avatarUrl: String?
    var status: UserStatus
    var isFriend: Bool = false

    enum UserStatus: String, Codable {
        case online
        case idle
        case offline
        case busy

        var colorHex: String {
            switch self {
            case .online: return "4ecca3"
            case .idle: return "f0a500"
            case .offline: return "888888"
            case .busy: return "ff4444"
            }
        }
    }

    static func == (lhs: User, rhs: User) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
