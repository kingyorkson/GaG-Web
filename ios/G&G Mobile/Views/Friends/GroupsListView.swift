import SwiftUI

struct GroupsListView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedGroup: ChatGroup?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(appState.chatGroups) { group in
                    Button(action: { selectedGroup = group }) {
                        GroupRowView(group: group)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)
        }
        .background(Color(hex: "0f0f23"))
        .sheet(item: $selectedGroup) { group in
            GroupChatView(group: group).environmentObject(appState)
        }
    }
}

struct GroupRowView: View {
    let group: ChatGroup

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(hex: "4ecca3").opacity(0.2))
                    .frame(width: 44, height: 44)
                Image(systemName: "person.2.fill")
                    .foregroundColor(Color(hex: "4ecca3"))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(group.name)
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text("\(group.members.count) members")
                    .font(.caption)
                    .foregroundColor(Color(hex: "888888"))
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(Color(hex: "555555"))
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 12)
        .background(Color(hex: "1a1a2e"))
        .cornerRadius(12)
    }
}
