import Foundation

struct Server: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var memberCount: Int
    var playerCount: Int
    var players: [User] = []
    var gardens: [Garden] = []

    static func == (lhs: Server, rhs: Server) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
