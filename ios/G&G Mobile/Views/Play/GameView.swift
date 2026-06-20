import SwiftUI
import WebKit

struct GameView: View {
    let startMode: String
    let serverId: String?
    let serverName: String?
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    @State private var showBackButton = true
    @State private var backButtonOpacity: Double = 1.0

    var body: some View {
        ZStack {
            WebView(url: gameURL)
                .ignoresSafeArea()

            if showBackButton {
                VStack {
                    HStack {
                        Button(action: {
                            appState.callManager.hangUp()
                            appState.activeCall = nil
                            dismiss()
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "chevron.left")
                                Text("Back to Mobile App")
                            }
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.black.opacity(0.65))
                            .cornerRadius(10)
                        }
                        .padding(.leading, 12)
                        .padding(.top, 8)
                        .opacity(backButtonOpacity)

                        Spacer()
                    }
                    Spacer()
                }
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        backButtonOpacity = backButtonOpacity == 1.0 ? 0.0 : 1.0
                    }
                }
            }
        }
        .statusBar(hidden: true)
        .onAppear {
            UIDevice.current.setValue(UIInterfaceOrientation.landscapeLeft.rawValue, forKey: "orientation")
            UINavigationController.attemptRotationToDeviceOrientation()

            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                withAnimation(.easeInOut(duration: 1.5)) {
                    backButtonOpacity = 0.0
                }
            }
        }
        .onDisappear {
            UIDevice.current.setValue(UIInterfaceOrientation.portrait.rawValue, forKey: "orientation")
            UINavigationController.attemptRotationToDeviceOrientation()
        }
    }

    var gameURL: URL {
        var components = URLComponents(string: "https://kingyorkson.github.io/GaG-Web/")!
        var queryItems = [URLQueryItem]()

        if startMode == "single" {
            queryItems.append(URLQueryItem(name: "mode", value: "single"))
        } else if startMode == "multi", let sid = serverId {
            queryItems.append(URLQueryItem(name: "mode", value: "multi"))
            queryItems.append(URLQueryItem(name: "server", value: sid))
        }

        if let userId = appState.authManager.currentUserId {
            queryItems.append(URLQueryItem(name: "user_id", value: userId))
        }
        if let username = appState.authManager.currentUsername {
            queryItems.append(URLQueryItem(name: "username", value: username.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)))
        }

        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        return components.url!
    }
}

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor.black
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
