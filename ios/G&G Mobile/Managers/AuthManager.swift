import Foundation
import AVFoundation

class AuthManager: ObservableObject {
    @Published var isSignedIn = false
    @Published var currentUserId: String?
    @Published var currentUsername: String?
    @Published var savedAccounts: [StoredAccount] = []

    struct StoredAccount: Codable {
        let userId: String
        let username: String
        let token: String
    }

    private let supabase = SupabaseClient.shared
    private let defaults = UserDefaults.standard
    private let accountsKey = "saved_accounts"

    init() {
        loadSavedAccounts()
    }

    func signInAsGuest() async -> Bool {
        let guestId = UUID().uuidString
        let username = "Guest_\(guestId.prefix(6))"

        await MainActor.run {
            self.currentUserId = guestId
            self.currentUsername = String(username)
            self.isSignedIn = true
        }
        return true
    }

    func signInWithQRCode(token: String) async -> Bool {
        let result = await supabase.authenticateWithQR(token: token)
        await MainActor.run {
            if let user = result {
                self.currentUserId = user.id
                self.currentUsername = user.username
                self.isSignedIn = true
                self.saveAccount(id: user.id, username: user.username, token: token)
            }
        }
        return result != nil
    }

    func switchToAccount(_ account: StoredAccount) {
        currentUserId = account.userId
        currentUsername = account.username
        isSignedIn = true
    }

    func logout() {
        currentUserId = nil
        currentUsername = nil
        isSignedIn = false
    }

    func saveAccount(id: String, username: String, token: String) {
        var accounts = loadSavedAccountsInternal()
        accounts.removeAll { $0.userId == id }
        accounts.append(StoredAccount(userId: id, username: username, token: token))
        if let data = try? JSONEncoder().encode(accounts) {
            defaults.set(data, forKey: accountsKey)
        }
        loadSavedAccounts()
    }

    func removeAccount(_ account: StoredAccount) {
        var accounts = loadSavedAccountsInternal()
        accounts.removeAll { $0.userId == account.userId }
        if let data = try? JSONEncoder().encode(accounts) {
            defaults.set(data, forKey: accountsKey)
        }
        loadSavedAccounts()
    }

    private func loadSavedAccounts() {
        savedAccounts = loadSavedAccountsInternal()
    }

    private func loadSavedAccountsInternal() -> [StoredAccount] {
        guard let data = defaults.data(forKey: accountsKey),
              let accounts = try? JSONDecoder().decode([StoredAccount].self, from: data) else {
            return []
        }
        return accounts
    }
}
