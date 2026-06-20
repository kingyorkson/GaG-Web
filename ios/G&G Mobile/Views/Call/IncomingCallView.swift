import SwiftUI

struct IncomingCallView: View {
    @EnvironmentObject var appState: AppState
    let call: Call

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "phone.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 40, height: 40)
                .foregroundColor(.red)

            Text("Incoming Call")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("From: \(call.fromUserId)")
                .font(.body)
                .foregroundColor(Color(hex: "cccccc"))

            HStack(spacing: 40) {
                Button(action: {
                    appState.callManager.declineCall(call)
                    appState.pendingCalls.removeAll { $0.id == call.id }
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "phone.down.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Color.red)
                            .clipShape(Circle())
                        Text("Decline")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                Button(action: {
                    appState.callManager.answerCall(call)
                    appState.pendingCalls.removeAll { $0.id == call.id }
                    appState.activeCall = call
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: "phone.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Color.green)
                            .clipShape(Circle())
                        Text("Answer")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
        }
        .padding(30)
        .background(Color(hex: "1a1a2e"))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.5), radius: 20)
        .padding(40)
    }
}
