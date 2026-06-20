import SwiftUI

struct AccountMenuView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section {
                    HStack {
                        let name = appState.currentUsername ?? "?"
                        ZStack {
                            Circle()
                                .fill(Color(hex: "4ecca3"))
                                .frame(width: 50, height: 50)
                            Text(String(name.prefix(2).uppercased()))
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text(appState.currentUsername ?? "Unknown")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text("Signed in")
                                .font(.caption)
                                .foregroundColor(Color(hex: "4ecca3"))
                        }
                    }
                    .listRowBackground(Color(hex: "1a1a2e"))
                }

                if !appState.authManager.savedAccounts.isEmpty {
                    Section("Switch Account") {
                        ForEach(appState.authManager.savedAccounts, id: \.userId) { account in
                            Button(action: {
                                appState.authManager.switchToAccount(account)
                                appState.currentUser = User(
                                    id: account.userId,
                                    username: account.username,
                                    status: .online
                                )
                                dismiss()
                            }) {
                                HStack {
                                    Text(account.username)
                                        .foregroundColor(.white)
                                    Spacer()
                                    if account.userId == appState.authManager.currentUserId {
                                        Image(systemName: "checkmark")
                                            .foregroundColor(Color(hex: "4ecca3"))
                                    }
                                }
                            }
                            .listRowBackground(Color(hex: "1a1a2e"))
                        }
                    }
                }

                Section {
                    Button(role: .destructive) {
                        appState.authManager.logout()
                        appState.isLoggedIn = false
                        appState.currentUser = nil
                        dismiss()
                    } label: {
                        Label("Log Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                    .listRowBackground(Color(hex: "1a1a2e"))
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color(hex: "0f0f23"))
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .foregroundColor(Color(hex: "4ecca3"))
                }
            }
        }
    }
}
