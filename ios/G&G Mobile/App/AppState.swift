import Foundation
import SwiftUI

class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var isLoggedIn = false
    @Published var hasCompletedOnboarding = false
    @Published var hasRequestedPermissions = false
    @Published var navigationPath = NavigationPath()
    @Published var selectedTab: Tab = .friends
    @Published var selectedServerId: String?
    @Published var showSidebar = true

    @Published var friends: [User] = []
    @Published var groups: [Group] = []
    @Published var servers: [Server] = []
    @Published var pendingCalls: [Call] = []
    @Published var activeCall: Call?

    let authManager = AuthManager()
    let chatManager = ChatManager()
    let callManager = CallManager()
    let serverManager = ServerManager()

    enum Tab: String, CaseIterable {
        case friends
        case play
        case servers
    }

    func loadDemoData() {
        friends = [
            User(id: "user1", username: "GardenerMike", status: .online),
            User(id: "user2", username: "FlowerQueen", status: .online),
            User(id: "user3", username: "TreeHugger", status: .idle),
            User(id: "user4", username: "SeedPlanter", status: .offline),
            User(id: "user5", username: "HarvestKing", status: .online),
            User(id: "user6", username: "BloomMaster", status: .idle),
        ]
        groups = [
            Group(id: "group1", name: "Garden Club", members: ["user1", "user2", "user4"]),
            Group(id: "group2", name: "Rare Seeds Team", members: ["user1", "user3", "user5", "user6"]),
        ]
        servers = [
            Server(id: "srv1", name: "Verdant Valley", memberCount: 24, playerCount: 8),
            Server(id: "srv2", name: "Sunflower Fields", memberCount: 56, playerCount: 12),
            Server(id: "srv3", name: "Mushroom Grove", memberCount: 13, playerCount: 3),
        ]
    }

    func completeOnboarding() {
        hasCompletedOnboarding = true
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
    }

    func completePermissions() {
        hasRequestedPermissions = true
        UserDefaults.standard.set(true, forKey: "hasRequestedPermissions")
    }
}
