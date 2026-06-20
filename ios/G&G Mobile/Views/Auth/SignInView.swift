import SwiftUI

struct SignInView: View {
    @EnvironmentObject var appState: AppState
    @State private var showQRScanner = false
    @State private var isSigningIn = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            Image(systemName: "leaf.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 70, height: 70)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Finally, to use this application\nyou must sign in with your\nDiscord / Guest account.")
                .font(.title3)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            VStack(spacing: 16) {
                Button(action: signInAsGuest) {
                    HStack {
                        Image(systemName: "person.fill")
                        Text("Continue as Guest")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: "2d2d44"))
                    .cornerRadius(14)
                }
                .disabled(isSigningIn)

                Button(action: { showQRScanner = true }) {
                    HStack {
                        Image(systemName: "qrcode.viewfinder")
                        Text("Scan QR Code")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: "4ecca3"))
                    .cornerRadius(14)
                }
                .disabled(isSigningIn)
            }
            .padding(.horizontal, 40)

            if isSigningIn {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: Color(hex: "4ecca3")))
                    .scaleEffect(1.5)
            }

            Spacer()

            Text("Discord sign-in is available on Web/Windows.\nUse QR Code to link your account.")
                .font(.caption)
                .foregroundColor(Color(hex: "888888"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
        }
        .background(Color(hex: "0f0f23").ignoresSafeArea())
        .sheet(isPresented: $showQRScanner) {
            QRScannerView { result in
                switch result {
                case .success(let token):
                    Task {
                        await appState.authManager.signInWithQRCode(token: token)
                    }
                case .failure(let error):
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
        .alert("Error", isPresented: $showError) {
            Button("OK") {}
        } message: {
            Text(errorMessage)
        }
    }

    func signInAsGuest() {
        isSigningIn = true
        Task {
            let success = await appState.authManager.signInAsGuest()
            await MainActor.run {
                isSigningIn = false
                if success {
                    appState.isLoggedIn = true
                    appState.currentUser = User(
                        id: appState.authManager.currentUserId ?? UUID().uuidString,
                        username: appState.authManager.currentUsername ?? "Guest",
                        status: .online
                    )
                }
            }
        }
    }
}
