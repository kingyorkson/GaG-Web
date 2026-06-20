import SwiftUI

struct ServerSelectionView: View {
    @EnvironmentObject var appState: AppState
    @Binding var selectedServerId: String?
    @Binding var selectedServerName: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                ForEach(appState.servers) { server in
                    Button(action: {
                        selectedServerId = server.id
                        selectedServerName = server.name
                        dismiss()
                    }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(server.name)
                                    .font(.headline)
                                    .foregroundColor(.white)
                                Text("\(server.memberCount) members • \(server.playerCount) playing")
                                    .font(.caption)
                                    .foregroundColor(Color(hex: "888888"))
                            }

                            Spacer()

                            if selectedServerId == server.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(Color(hex: "4ecca3"))
                            }

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(Color(hex: "555555"))
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowBackground(Color(hex: "1a1a2e"))
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color(hex: "0f0f23"))
            .navigationTitle("Select Server")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(Color(hex: "4ecca3"))
                }
            }
        }
    }
}
