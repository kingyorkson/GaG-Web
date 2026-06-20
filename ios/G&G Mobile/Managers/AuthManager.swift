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
    private let guestKey = "stored_guest"

    init() {
        loadSavedAccounts()
    }

    func signInAsGuest() async -> Bool {
        if let stored = defaults.dictionary(forKey: guestKey) as? [String: String],
           let user = stored["username"],
           let pass = stored["password"] {
            if let result = await supabase.signInGuest(username: user, password: pass) {
                await MainActor.run {
                    self.currentUserId = result.userId
                    self.currentUsername = user
                    self.isSignedIn = true
                    self.saveAccount(id: result.userId, username: user, token: result.accessToken)
                }
                return true
            }
        }

        let newId = UUID().uuidString
        let username = "Guest_\(String(newId.prefix(6)))"
        let password = "Guest_\(newId.replacingOccurrences(of: "-", with: ""))!Aa1"
        let deviceId = newId

        guard let result = await supabase.createGuestAccount(username: username, password: password, deviceId: deviceId) else {
            return false
        }

        defaults.set(["username": username, "password": password], forKey: guestKey)

        await MainActor.run {
            self.currentUserId = newId
            self.currentUsername = username
            self.isSignedIn = true
            self.saveAccount(id: newId, username: username, token: result.accessToken)
        }
        return true
    }

    func signInWithDiscord() async -> Bool {
        guard let tokens = await supabase.signInWithDiscord() else { return false }
        guard let user = await supabase.fetchUser(accessToken: tokens.accessToken) else { return false }

        await MainActor.run {
            self.currentUserId = user.id
            self.currentUsername = user.username
            self.isSignedIn = true
            self.saveAccount(id: user.id, username: user.username, token: tokens.accessToken)
        }
        return true
    }

    func signInWithQRCode(token: String) async -> Result<Void, SupabaseClient.APIError> {
        let result = await supabase.authenticateWithQR(token: token)
        switch result {
        case .success(let user):
            await MainActor.run {
                self.currentUserId = user.id
                self.currentUsername = user.username
                self.isSignedIn = true
                self.saveAccount(id: user.id, username: user.username, token: token)
            }
            return .success(())
        case .failure(let error):
            return .failure(error)
        }
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
