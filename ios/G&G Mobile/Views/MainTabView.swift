import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedSection: String = "friends"
    @State private var showAccountMenu = false

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: 0) {
                if appState.showSidebar {
                    sidebarView
                        .frame(width: 80)
                }

                mainContent
                    .frame(maxWidth: .infinity)
            }
            .background(Color(hex: "0f0f23").ignoresSafeArea())
            .overlay(alignment: .topLeading) {
                if appState.activeCall != nil {
                    activeCallBanner
                }
            }
            .overlay(alignment: .center) {
                if let call = appState.pendingCalls.first {
                    IncomingCallView(call: call)
                }
            }
        }
    }

    var sidebarView: some View {
        VStack(spacing: 0) {
            VStack(spacing: 24) {
                Button(action: { selectedSection = "friends" }) {
                    VStack(spacing: 4) {
                        Image(systemName: "person.3.fill")
                            .font(.title2)
                        Text("Friends")
                            .font(.caption2)
                    }
                    .foregroundColor(selectedSection == "friends" ? Color(hex: "4ecca3") : Color(hex: "888888"))
                }

                Button(action: { selectedSection = "play" }) {
                    VStack(spacing: 4) {
                        Image(systemName: "play.fill")
                            .font(.title2)
                        Text("Play")
                            .font(.caption2)
                    }
                    .foregroundColor(selectedSection == "play" ? Color(hex: "4ecca3") : Color(hex: "888888"))
                }
            }
            .padding(.top, 60)

            Divider()
                .background(Color(hex: "2d2d44"))
                .padding(.vertical, 12)

            ScrollView {
                VStack(spacing: 8) {
                    ForEach(appState.servers) { server in
                        Button(action: { selectedSection = "server_\(server.id)" }) {
                            Text(String(server.name.prefix(2)))
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(Color(hex: "2d2d44"))
                                .cornerRadius(12)
                        }
                    }
                }
            }

            Spacer()

            Button(action: { showAccountMenu = true }) {
                HStack(spacing: 4) {
                    let name = appState.currentUsername ?? "?"
                    Text(String(name.prefix(2).uppercased()))
                        .font(.caption)
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color(hex: "4ecca3"))
                        .cornerRadius(10)
                    Image(systemName: "chevron.up")
                        .font(.caption2)
                        .foregroundColor(.white)
                }
            }
            .padding(.bottom, 30)
        }
        .background(Color(hex: "151530"))
        .sheet(isPresented: $showAccountMenu) {
            AccountMenuView().environmentObject(appState)
        }
    }

    @ViewBuilder
    var mainContent: some View {
        if selectedSection == "friends" {
            FriendsTabView()
        } else if selectedSection == "play" {
            PlayMenuView()
        } else if selectedSection.hasPrefix("server_") {
            let serverId = String(selectedSection.dropFirst("server_".count))
            ServerDetailView(serverId: serverId)
        } else {
            FriendsTabView()
        }
    }

    var activeCallBanner: some View {
        HStack {
            Image(systemName: "phone.fill")
                .foregroundColor(Color(hex: "4ecca3"))
            Text("In Call")
                .foregroundColor(.white)
                .fontWeight(.bold)
            Spacer()
            Button("Hang Up") {
                appState.callManager.hangUp()
                appState.activeCall = nil
            }
            .foregroundColor(.red)
            .fontWeight(.bold)
        }
        .padding()
        .background(Color(hex: "1a1a2e"))
        .cornerRadius(12)
        .padding()
    }
}
