import SwiftUI

struct ServerDetailView: View {
    @EnvironmentObject var appState: AppState
    let serverId: String
    @State private var selectedTab = 0
    @State private var showGame = false

    var server: Server? {
        appState.servers.first(where: { $0.id == serverId })
    }

    var body: some View {
        VStack(spacing: 0) {
            if let server = server {
                HStack {
                    VStack(alignment: .leading) {
                        Text(server.name)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("\(server.memberCount) members • \(server.playerCount) playing")
                            .font(.caption)
                            .foregroundColor(Color(hex: "888888"))
                    }
                    Spacer()

                    Button(action: { showGame = true }) {
                        Text("Join Now")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color(hex: "4ecca3"))
                            .cornerRadius(10)
                    }
                }
                .padding()
                .background(Color(hex: "151530"))

                Picker("", selection: $selectedTab) {
                    Text("Players").tag(0)
                    Text("Gardens").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()

                if selectedTab == 0 {
                    PlayersListView(server: server)
                } else {
                    GardenPreviewsView(server: server)
                }
            } else {
                VStack {
                    Text("Server not found")
                        .foregroundColor(Color(hex: "888888"))
                    Spacer()
                }
            }
        }
        .background(Color(hex: "0f0f23"))
        .fullScreenCover(isPresented: $showGame) {
            GameView(startMode: "multi", serverId: server?.id, serverName: server?.name)
                .environmentObject(appState)
        }
    }
}

struct PlayersListView: View {
    let server: Server

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                ForEach(server.players) { player in
                    HStack {
                        Circle()
                            .fill(Color(hex: player.status.colorHex))
                            .frame(width: 10, height: 10)
                        Text(player.username)
                            .foregroundColor(.white)
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(Color(hex: "1a1a2e"))
                    .cornerRadius(8)
                }
            }
            .padding(.horizontal, 12)
        }
    }
}
