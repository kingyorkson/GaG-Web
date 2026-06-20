import SwiftUI

struct PermissionsRequestView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var permManager = PermissionManager()
    @State private var step = 0
    @State private var micGranted = false
    @State private var notifGranted = false
    var onContinue: () -> Void

    var body: some View {
        VStack(spacing: 28) {
            Spacer()

            if step == 0 {
                permissionsIntro
            } else if step == 1 {
                micRequest
            } else if step == 2 {
                notifRequest
            } else if step == 3 {
                permissionsDone
            }

            Spacer()
        }
        .padding(.bottom, 60)
    }

    var permissionsIntro: some View {
        VStack(spacing: 28) {
            Image(systemName: "hand.raised.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 50, height: 50)
                .foregroundColor(Color(hex: "f0a500"))

            Text("Before we get through the tour\nand sign into your account\nwe have to first request some stuff.")
                .font(.body)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            Text("We are going to request\nNotification Access and Microphone Access.")
                .font(.headline)
                .foregroundColor(Color(hex: "4ecca3"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            Button(action: { withAnimation { step = 1 } }) {
                Text("Next")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 40)
        }
    }

    var micRequest: some View {
        VStack(spacing: 24) {
            Image(systemName: "mic.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 50, height: 50)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Step 1: Microphone Access")
                .font(.title3)
                .foregroundColor(.white)
                .fontWeight(.bold)

            Text("We need microphone access for voice calls with your friends.")
                .font(.body)
                .foregroundColor(Color(hex: "aaaaaa"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            Button(action: {
                Task {
                    micGranted = await permManager.requestMicrophone()
                    withAnimation { step = 2 }
                }
            }) {
                HStack {
                    Image(systemName: micGranted ? "checkmark.circle.fill" : "mic.fill")
                    Text(micGranted ? "Microphone Granted" : "Allow Microphone")
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: 220)
                .padding()
                .background(micGranted ? Color.green : Color(hex: "4ecca3"))
                .cornerRadius(14)
            }
        }
    }

    var notifRequest: some View {
        VStack(spacing: 24) {
            Image(systemName: "bell.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 50, height: 50)
                .foregroundColor(Color(hex: "f0a500"))

            Text("Step 2: Notification Access")
                .font(.title3)
                .foregroundColor(.white)
                .fontWeight(.bold)

            Text("We need notification access so you never miss a call or message from your friends.")
                .font(.body)
                .foregroundColor(Color(hex: "aaaaaa"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            Button(action: {
                Task {
                    notifGranted = await permManager.requestNotifications()
                    withAnimation { step = 3 }
                }
            }) {
                HStack {
                    Image(systemName: notifGranted ? "checkmark.circle.fill" : "bell.fill")
                    Text(notifGranted ? "Notifications Granted" : "Allow Notifications")
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: 220)
                .padding()
                .background(notifGranted ? Color.green : Color(hex: "f0a500"))
                .cornerRadius(14)
            }
        }
    }

    var permissionsDone: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 70, height: 70)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("All permissions granted!")
                .font(.title3)
                .foregroundColor(.white)
                .fontWeight(.bold)

            Text("Now let's get on with\nyour tour through this app.")
                .font(.body)
                .foregroundColor(Color(hex: "cccccc"))
                .multilineTextAlignment(.center)

            Button(action: onContinue) {
                Text("Let's Start Touring")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: "4ecca3"))
                    .cornerRadius(14)
            }
            .padding(.horizontal, 40)
            .padding(.top, 20)
        }
    }
}
