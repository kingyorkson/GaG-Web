import Foundation
import AuthenticationServices

class SupabaseClient: NSObject {
    static let shared = SupabaseClient()

    private let baseURL = "https://cqohfidpjiudduoqcppv.supabase.co"
    private let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2hmaWRwaml1ZGR1b3FjcHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMTE3NjIsImV4cCI6MjA0ODY4Nzc2Mn0.8LxPc2nUkksoV6fKqyPp72S42C8SKqIuy0CQyGQXGYA"

    enum APIError: Error {
        case invalidURL
        case noData
        case decodingError
        case serverError(String)

        var localizedDescription: String {
            switch self {
            case .invalidURL: return "Invalid URL"
            case .noData: return "No data received"
            case .decodingError: return "Failed to decode response"
            case .serverError(let msg): return msg
            }
        }
    }

    func authenticateWithQR(token: String) async -> Result<User, APIError> {
        let url = URL(string: "\(baseURL)/rest/v1/rpc/authenticate_with_qr")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["token_text": token]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                return .failure(.serverError("Invalid server response"))
            }
            guard httpResponse.statusCode == 200 else {
                let body = String(data: data, encoding: .utf8) ?? "unknown"
                return .failure(.serverError("Server error \(httpResponse.statusCode): \(body)"))
            }
            let user = try JSONDecoder().decode(User.self, from: data)
            return .success(user)
        } catch {
            return .failure(.serverError(error.localizedDescription))
        }
    }

    func fetchFriends(userId: String) async -> [User] {
        let url = URL(string: "\(baseURL)/rest/v1/friends?user_id=eq.\(userId)&select=friend_id(*)")!
        var request = URLRequest(url: url)
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let friends = try JSONDecoder().decode([User].self, from: data)
            return friends
        } catch {
            return []
        }
    }

    func fetchServers() async -> [Server] {
        let url = URL(string: "\(baseURL)/rest/v1/servers")!
        var request = URLRequest(url: url)
        request.setValue(anonKey, forHTTPHeaderField: "apikey")

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let servers = try JSONDecoder().decode([Server].self, from: data)
            return servers
        } catch {
            return []
        }
    }

    func fetchMessages(userId: String, otherUserId: String) async -> [Message] {
        let url = URL(string: "\(baseURL)/rest/v1/messages?and=(from_user_id.eq.\(userId),to_user_id.eq.\(otherUserId))&order=created_at")!
        var request = URLRequest(url: url)
        request.setValue(anonKey, forHTTPHeaderField: "apikey")

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let msgs = try JSONDecoder().decode([Message].self, from: data)
            return msgs
        } catch {
            return []
        }
    }

    func sendMessage(from: String, to: String, content: String) async -> Bool {
        let url = URL(string: "\(baseURL)/rest/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue(anonKey, forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "from_user_id": from,
            "to_user_id": to,
            "content": content
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (_, _) = try await URLSession.shared.data(for: request)
            return true
        } catch {
            return false
        }
    }

    func signInWithDiscord() async -> (accessToken: String, refreshToken: String)? {
        let authURL = "\(baseURL)/auth/v1/authorize?provider=discord&redirect_to=gag-mobile://auth/callback"
        guard let url = URL(string: authURL) else { return nil }

        return await withCheckedContinuation { continuation in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "gag-mobile") { callbackURL, error in
                if let error = error {
                    print("Discord auth error: \(error.localizedDescription)")
                    continuation.resume(returning: nil)
                    return
                }
                guard let callbackURL = callbackURL,
                      let fragment = callbackURL.fragment else {
                    continuation.resume(returning: nil)
                    return
                }
                let params = fragment.split(separator: "&").reduce(into: [String: String]()) { dict, pair in
                    let kv = pair.split(separator: "=", maxSplits: 1).map(String.init)
                    dict[kv[0]] = kv.count > 1 ? kv[1] : ""
                }
                guard let at = params["access_token"], let rt = params["refresh_token"] else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: (at, rt))
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = true
            session.start()
        }
    }

    func createGuestAccount(username: String, password: String, deviceId: String) async -> (accessToken: String, refreshToken: String)? {
        let email = "\(username)@guest.growinggardening.game"
        guard let url = URL(string: "\(baseURL)/auth/v1/signup") else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body: [String: Any] = [
            "email": email,
            "password": password,
            "data": ["username": username, "auth_type": "guest"]
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
            if let id = json["id"] as? String {
                let at = json["access_token"] as? String ?? ""
                let rt = json["refresh_token"] as? String ?? ""
                await upsertUser(id: id, username: username, authType: "guest")
                return (at, rt)
            }
            return nil
        } catch {
            return nil
        }
    }

    func signInGuest(username: String, password: String) async -> (accessToken: String, refreshToken: String, userId: String)? {
        let email = "\(username)@guest.growinggardening.game"
        guard let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password") else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["email": email, "password": password]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let at = json["access_token"] as? String,
                  let rt = json["refresh_token"] as? String,
                  let user = json["user"] as? [String: Any],
                  let id = user["id"] as? String else { return nil }
            return (at, rt, id)
        } catch {
            return nil
        }
    }

    private func upsertUser(id: String, username: String, authType: String) async {
        guard let url = URL(string: "\(baseURL)/rest/v1/users?on_conflict=id") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
        let body: [String: Any] = [
            "id": id,
            "username": username,
            "auth_type": authType,
            "cash": 100,
            "inventory": [],
            "garden_data": [:]
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        let _ = try? await URLSession.shared.data(for: request)
    }

    func fetchUser(accessToken: String) async -> (id: String, username: String)? {
        let url = URL(string: "\(baseURL)/auth/v1/user")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let id = json["id"] as? String else { return nil }
            let meta = json["user_metadata"] as? [String: Any]
            let username = meta?["full_name"] as? String ?? meta?["user_name"] as? String ?? "DiscordUser"
            return (id, username)
        } catch {
            return nil
        }
    }
}

extension SupabaseClient: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? UIWindow()
    }
}
