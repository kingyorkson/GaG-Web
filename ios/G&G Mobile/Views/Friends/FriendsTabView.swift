import SwiftUI

struct FriendsTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedSegment = 0

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Picker("", selection: $selectedSegment) {
                    Text("Friends").tag(0)
                    Text("Groups").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 20)
                .padding(.top, 12)
            }

            if selectedSegment == 0 {
                FriendsListView()
            } else {
                GroupsListView()
            }
        }
        .background(Color(hex: "0f0f23"))
    }
}
