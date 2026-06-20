import SwiftUI

struct PlayMenuView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedMode = "main_menu"
    @State private var showServerSelection = false
    @State private var selectedServerId: String?
    @State private var selectedServerName: String?
    @State private var showGame = false
    @State private var gameMode = ""

    var body: some View {
        VStack(spacing: 20) {
            Text("Play")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.top, 40)

            VStack(alignment: .leading, spacing: 4) {
                PlayModeRow(
                    title: "Main Menu",
                    subtitle: "Start the game normally",
                    icon: "house.fill",
                    isSelected: selectedMode == "main_menu",
                    action: { selectedMode = "main_menu" }
                )

                PlayModeRow(
                    title: "Single Player",
                    subtitle: "Play alone in your garden",
                    icon: "person.fill",
                    isSelected: selectedMode == "single",
                    action: { selectedMode = "single" }
                )

                PlayModeRow(
                    title: "Multiplayer",
                    subtitle: "Play with friends on a server",
                    icon: "person.3.fill",
                    isSelected: selectedMode == "multi",
                    action: { selectedMode = "multi" }
                )
            }
            .padding(.horizontal, 20)

            if selectedMode == "multi" {
                Button(action: { showServerSelection = true }) {
                    HStack {
                        Image(systemName: "server.rack")
                        Text(selectedServerId != nil ? selectedServerName ?? "Server Selected" : "Choose Multiplayer Server to Join")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(selectedServerId != nil ? Color(hex: "4ecca3") : Color(hex: "2d2d44"))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 20)

                if selectedServerId != nil {
                    Text("Will instantly join \(selectedServerName ?? "server") on launch")
                        .font(.caption)
                        .foregroundColor(Color(hex: "888888"))
                }
            }

            Spacer()

            Button(action: launchGame) {
                Text("Play")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(canPlay ? Color(hex: "4ecca3") : Color(hex: "3d3d55"))
                    .cornerRadius(16)
            }
            .disabled(!canPlay)
            .padding(.horizontal, 40)
            .padding(.bottom, 30)
        }
        .background(Color(hex: "0f0f23"))
        .sheet(isPresented: $showServerSelection) {
            ServerSelectionView(selectedServerId: $selectedServerId, selectedServerName: $selectedServerName)
        }
        .fullScreenCover(isPresented: $showGame) {
            GameView(startMode: gameMode, serverId: selectedServerId, serverName: selectedServerName)
                .environmentObject(appState)
        }
    }

    var canPlay: Bool {
        if selectedMode == "multi" { return selectedServerId != nil }
        return true
    }

    func launchGame() {
        if selectedMode == "multi" {
            gameMode = "multi"
        } else if selectedMode == "single" {
            gameMode = "single"
        } else {
            gameMode = "main_menu"
        }
        showGame = true
    }
}

struct PlayModeRow: View {
    let title: String
    let subtitle: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? Color(hex: "4ecca3") : Color(hex: "888888"))
                    .frame(width: 36)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.body)
                        .fontWeight(.semibold)
                        .foregroundColor(isSelected ? .white : Color(hex: "cccccc"))
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(Color(hex: "888888"))
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color(hex: "4ecca3"))
                }
            }
            .padding()
            .background(isSelected ? Color(hex: "4ecca3").opacity(0.1) : Color(hex: "1a1a2e"))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color(hex: "4ecca3") : Color.clear, lineWidth: 1)
            )
        }
    }
}
