import Foundation

class SupabaseClient {
    static let shared = SupabaseClient()

    private let baseURL = "https://cqohfidpjiudduoqcppv.supabase.co"
    private let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2hmaWRwaml1ZGR1b3FjcHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMTE3NjIsImV4cCI6MjA0ODY4Nzc2Mn0.8LxPc2nUkksoV6fKqyPp72S42C8SKqIuy0CQyGQXGYA"

    enum APIError: Error {
        case invalidURL
        case noData
        case decodingError
        case serverError(String)
    }

    func authenticateWithQR(token: String) async -> User? {
        let url = URL(string: "\(baseURL)/rest/v1/rpc/authenticate_with_qr")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["token_text": token]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let user = try JSONDecoder().decode(User.self, from: data)
            return user
        } catch {
            return nil
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
}
