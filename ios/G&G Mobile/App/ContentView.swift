import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        SwiftUI.Group {
            if !appState.hasCompletedOnboarding {
                WelcomePageView()
            } else if !appState.isLoggedIn {
                SignInView()
            } else {
                MainTabView()
            }
        }
        .onAppear {
            let completed = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
            appState.hasCompletedOnboarding = completed
            if completed {
                appState.loadDemoData()
            }
        }
    }
}
