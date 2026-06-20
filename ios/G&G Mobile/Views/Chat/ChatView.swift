import SwiftUI

struct ChatView: View {
    @EnvironmentObject var appState: AppState
    let friend: User
    @State private var messageText = ""
    @State private var messages: [Message] = []

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                ZStack {
                    Circle()
                        .fill(Color(hex: "2d2d44"))
                        .frame(width: 36, height: 36)
                    Text(String(friend.username.prefix(2)))
                        .font(.caption)
                        .foregroundColor(.white)
                }

                Text(friend.username)
                    .font(.headline)
                    .foregroundColor(.white)

                Spacer()

                Button(action: {
                    appState.callManager.startCall(from: "me", to: friend.id)
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
            toUserId: friend.id,
            groupId: nil,
            content: text,
            createdAt: Date(),
            read: false
        )
        messages.append(msg)
        messageText = ""
    }
}

struct MessageBubbleView: View {
    let message: Message

    var body: some View {
        HStack {
            if message.isFromMe { Spacer() }

            Text(message.content)
                .font(.body)
                .foregroundColor(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(message.isFromMe ? Color(hex: "4ecca3") : Color(hex: "2d2d44"))
                .cornerRadius(16)

            if !message.isFromMe { Spacer() }
        }
    }
}
