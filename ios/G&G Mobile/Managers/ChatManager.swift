import Foundation
import Combine

class ChatManager: ObservableObject {
    @Published var messages: [String: [Message]] = [:]
    @Published var groupMessages: [String: [Message]] = [:]

    private let supabase = SupabaseClient.shared

    func loadMessages(userId: String, otherUserId: String) async {
        let msgs = await supabase.fetchMessages(userId: userId, otherUserId: otherUserId)
        await MainActor.run {
            messages[otherUserId] = msgs
        }
    }

    func sendMessage(from: String, to: String, content: String) async -> Bool {
        return await supabase.sendMessage(from: from, to: to, content: content)
    }

    func sendGroupMessage(groupId: String, from: String, content: String) async -> Bool {
        return true
    }
}
