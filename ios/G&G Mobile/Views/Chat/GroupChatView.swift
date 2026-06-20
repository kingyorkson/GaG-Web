import SwiftUI

struct GroupChatView: View {
    @EnvironmentObject var appState: AppState
    let group: Group
    @State private var messageText = ""
    @State private var messages: [Message] = []

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "person.2.fill")
                    .foregroundColor(Color(hex: "4ecca3"))

                Text(group.name)
                    .font(.headline)
                    .foregroundColor(.white)

                Spacer()

                Text("\(group.members.count)")
                    .font(.caption)
                    .foregroundColor(Color(hex: "888888"))

                Button(action: {
                    appState.callManager.startGroupCall(from: "me", groupId: group.id)
                    appState.activeCall = appState.callManager.activeCall
                }) {
                    Image(systemName: "phone.fill")
                        .foregroundColor(Color(hex: "4ecca3"))
                        .font(.title3)
                }
            }
            .padding()
            .background(Color(hex: "151530"))

            Divider()
                .background(Color(hex: "2d2d44"))

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(messages) { msg in
                            MessageBubbleView(message: msg)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            Divider()
                .background(Color(hex: "2d2d44"))

            HStack(spacing: 8) {
                TextField("Type a message...", text: $messageText)
                    .foregroundColor(.white)
                    .accentColor(Color(hex: "4ecca3"))
                    .padding(12)
                    .background(Color(hex: "1a1a2e"))
                    .cornerRadius(20)

                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.white)
                        .padding(12)
                        .background(Color(hex: "4ecca3"))
                        .cornerRadius(20)
                }
                .disabled(messageText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
            .background(Color(hex: "0f0f23"))
        }
        .background(Color(hex: "0f0f23"))
    }

    func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        let msg = Message(
            id: UUID().uuidString,
            fromUserId: "me",
            toUserId: nil,
            groupId: group.id,
            content: text,
            createdAt: Date(),
            read: false
        )
        messages.append(msg)
        messageText = ""
    }
}
