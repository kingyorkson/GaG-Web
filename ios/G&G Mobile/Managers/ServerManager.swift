import Foundation

class ServerManager: ObservableObject {
    @Published var servers: [Server] = []

    private let supabase = SupabaseClient.shared

    func loadServers() async {
        let result = await supabase.fetchServers()
        await MainActor.run {
            servers = result
        }
    }

    func playersForServer(_ serverId: String) -> [User] {
        servers.first(where: { $0.id == serverId })?.players ?? []
    }

    func gardensForServer(_ serverId: String) -> [Garden] {
        servers.first(where: { $0.id == serverId })?.gardens ?? []
    }
}
