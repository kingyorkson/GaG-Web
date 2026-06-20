import SwiftUI

struct FriendsListView: View {
    @EnvironmentObject var appState: AppState
    @State private var searchText = ""
    @State private var selectedFriend: User?

    var filteredFriends: [User] {
        if searchText.isEmpty { return appState.friends }
        return appState.friends.filter { $0.username.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(Color(hex: "888888"))
                TextField("Search friends...", text: $searchText)
                    .foregroundColor(.white)
                    .accentColor(Color(hex: "4ecca3"))
            }
            .padding(10)
            .background(Color(hex: "1a1a2e"))
            .cornerRadius(10)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)

            ScrollView {
                LazyVStack(spacing: 6) {
                    ForEach(filteredFriends) { friend in
                        Button(action: { selectedFriend = friend }) {
                            FriendRowView(friend: friend)
                        }
                    }
                }
                .padding(.horizontal, 12)
            }
        }
        .background(Color(hex: "0f0f23"))
        .sheet(item: $selectedFriend) { friend in
            ChatView(friend: friend)
        }
    }
}

struct FriendRowView: View {
    let friend: User

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(hex: "2d2d44"))
                    .frame(width: 44, height: 44)
                Text(String(friend.username.prefix(2)))
                    .font(.caption)
                    .foregroundColor(.white)
            }

            Circle()
                .fill(Color(hex: friend.status.colorHex))
                .frame(width: 10, height: 10)

            VStack(alignment: .leading, spacing: 2) {
                Text(friend.username)
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(friend.status.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(Color(hex: "888888"))
            }

            Spacer()

            Image(systemName: "message.fill")
                .foregroundColor(Color(hex: "4ecca3"))
                .font(.system(size: 14))
                .padding(8)
                .background(Color(hex: "4ecca3").opacity(0.15))
                .cornerRadius(8)

            Image(systemName: "phone.fill")
                .foregroundColor(Color(hex: "4ecca3"))
                .font(.system(size: 14))
                .padding(8)
                .background(Color(hex: "4ecca3").opacity(0.15))
                .cornerRadius(8)
                .onTapGesture {
                    appState.callManager.startCall(from: "me", to: friend.id)
                    appState.activeCall = appState.callManager.activeCall
                }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color(hex: "1a1a2e"))
        .cornerRadius(12)
    }
}
