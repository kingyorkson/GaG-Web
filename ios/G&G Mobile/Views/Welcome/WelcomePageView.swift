import SwiftUI

struct WelcomePageView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0

    var body: some View {
        VStack {
            Spacer()

            if currentPage == 0 {
                welcomeContent
                    .transition(.opacity)
            } else if currentPage == 1 {
                PermissionsRequestView(onContinue: {
                    withAnimation { currentPage = 2 }
                })
                    .transition(.opacity)
            } else if currentPage == 2 {
                TourView()
                    .transition(.opacity)
            }

            Spacer()

            if currentPage == 0 {
                Button(action: { withAnimation { currentPage = 1 } }) {
                    Text("Next")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(14)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 60)
            }
        }
        .background(Color(hex: "0f0f23").ignoresSafeArea())
    }

    var welcomeContent: some View {
        VStack(spacing: 24) {
            Image(systemName: "leaf.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 80, height: 80)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Welcome to\nGrowing & Gardening\nMobile App!")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            Text("This is an application that allows you to\nCall, Text, Add, View, and Play!")
                .font(.body)
                .foregroundColor(Color(hex: "aaaaaa"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
    }
}
