import SwiftUI

struct CallView: View {
    @EnvironmentObject var appState: AppState
    let call: Call
    @State private var elapsed = 0
    @State private var timer: Timer?

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            Image(systemName: "phone.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 60, height: 60)
                .foregroundColor(call.status == .answered ? Color(hex: "4ecca3") : Color(hex: "f0a500"))

            Text(call.status == .answered ? "In Call" : "Calling...")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)

            if call.status == .answered {
                Text(formatTime(elapsed))
                    .font(.title2)
                    .foregroundColor(Color(hex: "aaaaaa"))
                    .monospacedDigit()
            }

            Text(call.groupId != nil ? "Group Call" : "\(call.fromUserId) → \(call.toUserId)")
                .font(.body)
                .foregroundColor(Color(hex: "888888"))

            Spacer()

            HStack(spacing: 60) {
                Button(action: {}) {
                    Image(systemName: "mic.slash.fill")
                        .font(.title2)
                        .foregroundColor(.white)
                        .padding(20)
                        .background(Color(hex: "ff4444"))
                        .clipShape(Circle())
                }

                Button(action: {
                    appState.callManager.hangUp()
                    appState.activeCall = nil
                }) {
                    Image(systemName: "phone.down.fill")
                        .font(.title2)
                        .foregroundColor(.white)
                        .padding(24)
                        .background(Color.red)
                        .clipShape(Circle())
                }
            }
            .padding(.bottom, 60)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "0f0f23"))
        .onAppear {
            if call.status == .answered {
                timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
                    elapsed += 1
                }
            }
        }
        .onDisappear {
            timer?.invalidate()
            timer = nil
        }
    }

    func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}
