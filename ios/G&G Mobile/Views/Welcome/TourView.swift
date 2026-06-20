import SwiftUI

struct TourView: View {
    @EnvironmentObject var appState: AppState
    @State private var tourStep = 0

    let totalSteps = 8

    var body: some View {
        ZStack {
            if tourStep < totalSteps {
                Color.black.opacity(0.75)
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer()

                    switch tourStep {
                    case 0:
                        friendsTourOverlay
                    case 1:
                        chatTourOverlay
                    case 2:
                        callTourOverlay
                    case 3:
                        groupsTourOverlay
                    case 4:
                        sidebarTourOverlay
                    case 5:
                        gardenTourOverlay
                    case 6:
                        playTourOverlay
                    case 7:
                        qrTourOverlay
                    default:
                        EmptyView()
                    }

                    Spacer()

                    HStack {
                        Button("Skip Tour") {
                            withAnimation { appState.completeOnboarding(); appState.loadDemoData() }
                        }
                        .foregroundColor(Color(hex: "888888"))
                        .font(.subheadline)

                        Spacer()

                        HStack(spacing: 6) {
                            ForEach(0..<totalSteps, id: \.self) { i in
                                Circle()
                                    .fill(i == tourStep ? Color(hex: "4ecca3") : Color(hex: "3d3d55"))
                                    .frame(width: 8, height: 8)
                            }
                        }

                        Spacer()

                        Button(tourStep < totalSteps - 1 ? "Next" : "Finish") {
                            withAnimation {
                                if tourStep < totalSteps - 1 {
                                    tourStep += 1
                                } else {
                                    appState.completeOnboarding()
                                    appState.loadDemoData()
                                }
                            }
                        }
                        .foregroundColor(Color(hex: "4ecca3"))
                        .fontWeight(.bold)
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 30)
                }
            }
        }
    }

    var friendsTourOverlay: some View {
        VStack(spacing: 20) {
            Text("Friends Menu")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("This is where you'll view all your friends.\nTap a friend to chat or press the call button.\n\nHere are some test friends:")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            VStack(spacing: 4) {
                ForEach(appState.friends.prefix(3)) { friend in
                    HStack {
                        Circle()
                            .fill(Color(hex: friend.status.colorHex))
                            .frame(width: 10, height: 10)
                        Text(friend.username)
                            .font(.subheadline)
                            .foregroundColor(.white)
                        Spacer()
                        Image(systemName: "message.fill")
                            .foregroundColor(Color(hex: "4ecca3"))
                            .font(.caption)
                        Image(systemName: "phone.fill")
                            .foregroundColor(Color(hex: "4ecca3"))
                            .font(.caption)
                    }
                    .padding(.horizontal, 40)
                    .padding(.vertical, 6)
                }
            }
            .padding()
            .background(Color(hex: "1a1a2e").opacity(0.8))
            .cornerRadius(12)
            .padding(.horizontal, 30)

            Text("The text box will move to fit in space\nfor these introductions.")
                .font(.caption)
                .foregroundColor(Color(hex: "888888"))
                .multilineTextAlignment(.center)
        }
    }

    var chatTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "message.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("User Chatting / Calling")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            VStack(alignment: .leading, spacing: 12) {
                tourBullet("A big box shows all messages you can scroll through")
                tourBullet("A text box opens the Apple keyboard to type")
                tourBullet("Press Send to send your message to your friend")
                tourBullet("They can respond on their device in real time")
            }
            .padding(.horizontal, 30)

            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(hex: "2d2d44"))
                    .frame(height: 40)
                    .overlay(Text("Type a message...").foregroundColor(Color(hex: "555555")).padding(.horizontal, 12), alignment: .leading)
                Circle()
                    .fill(Color(hex: "4ecca3"))
                    .frame(width: 40, height: 40)
                    .overlay(Image(systemName: "paperplane.fill").foregroundColor(.white).font(.caption))
            }
            .padding(.horizontal, 40)
        }
    }

    var callTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "phone.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Call Feature")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            VStack(spacing: 16) {
                HStack {
                    Text("Friend Name")
                        .foregroundColor(.white)
                        .fontWeight(.bold)
                    Spacer()
                    Image(systemName: "phone.fill")
                        .foregroundColor(Color(hex: "4ecca3"))
                        .font(.title3)
                }
                .padding()
                .background(Color(hex: "1a1a2e"))
                .cornerRadius(12)
            }
            .padding(.horizontal, 30)

            Text("Tap the phone icon next to a friend's name\nto start a call. The call screen shows\nboth players' names like the PC version.")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
    }

    var groupsTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Groups")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("Go back to your Friends menu. There's a selection bar at the top with two tabs:")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            HStack {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color(hex: "4ecca3"), lineWidth: 1)
                    .frame(height: 32)
                    .overlay(Text("Friends").foregroundColor(.white).font(.subheadline))
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(hex: "4ecca3"))
                    .frame(height: 32)
                    .overlay(Text("Groups").foregroundColor(.white).font(.subheadline))
            }
            .padding(.horizontal, 40)

            Text("Press Groups to see all your groups.\nClick a group to chat — you can see what\neveryone is typing at once.\nYou can also call the whole group!")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
    }

    var sidebarTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "sidebar.left")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Server Sidebar")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("The left sidebar shows all your servers.\nEach server shows its first letter.\n\nTap a server to view its players and gardens before joining.")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            HStack(spacing: 8) {
                ForEach(["V", "S", "M"], id: \.self) { letter in
                    Text(letter)
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(Color(hex: "2d2d44"))
                        .cornerRadius(10)
                }
            }
        }
    }

    var gardenTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "rectangle.3.group.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Garden Previews")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("View all players' gardens in a server before joining.")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            HStack {
                Image(systemName: "chevron.left")
                    .foregroundColor(Color(hex: "4ecca3"))
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color(hex: "4ecca3"))
                    Text("Gardener's Garden")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("12 plants • 5 crops")
                        .font(.caption)
                        .foregroundColor(Color(hex: "aaaaaa"))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(Color(hex: "4ecca3"))
            }
            .padding()
            .background(Color(hex: "1a1a2e"))
            .cornerRadius(12)
            .padding(.horizontal, 30)

            Text("Use the left and right arrows to navigate.\nYour own garden is not shown here\nsince you're not in the game.")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            Text("Note: The app will request landscape mode when you join a game.")
                .font(.caption)
                .foregroundColor(Color(hex: "888888"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
    }

    var playTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "play.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Play Button")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("Press the Play icon in the sidebar to open the play menu.\nChoose your mode:")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            VStack(alignment: .leading, spacing: 12) {
                tourBullet("Main Menu – Start the game normally")
                tourBullet("Single Player – Play alone in your garden")
                tourBullet("Multiplayer – Join a server and play with friends")
            }
            .padding(.horizontal, 30)

            Text("The app will switch to landscape mode and launch the game.\nPress \"Back to Mobile App\" at any time to return.")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
        }
    }

    var qrTourOverlay: some View {
        VStack(spacing: 20) {
            Image(systemName: "qrcode.viewfinder")
                .resizable()
                .scaledToFit()
                .frame(width: 45, height: 45)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("QR Sign-In")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text("On the Web or Windows version of G&G,\nclick the \"Scan QR Code for Mobile App\" button\nin the bottom-right corner.")
                .font(.body)
                .foregroundColor(Color(hex: "dddddd"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)

            VStack(spacing: 12) {
                tourBullet("The web/Windows app generates a QR code")
                tourBullet("Open this app and press Scan QR Code")
                tourBullet("Scan the QR code on your computer screen")
                tourBullet("You're instantly signed in with your account!")
            }
            .padding(.horizontal, 30)

            Text("No need to type passwords — just scan and go!")
                .font(.headline)
                .foregroundColor(Color(hex: "4ecca3"))
                .padding(.horizontal, 30)
        }
    }

    func tourBullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "circle.fill")
                .font(.system(size: 6))
                .foregroundColor(Color(hex: "4ecca3"))
                .padding(.top, 6)
            Text(text)
                .font(.subheadline)
                .foregroundColor(Color(hex: "dddddd"))
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
