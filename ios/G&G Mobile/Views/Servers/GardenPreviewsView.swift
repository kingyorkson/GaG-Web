import SwiftUI

struct GardenPreviewsView: View {
    let server: Server
    @State private var currentGardenIndex = 0

    var gardens: [Garden] {
        server.gardens
    }

    var body: some View {
        VStack {
            if gardens.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "tree")
                        .font(.system(size: 60))
                        .foregroundColor(Color(hex: "4ecca3"))

                    Text("No gardens to preview")
                        .font(.headline)
                        .foregroundColor(Color(hex: "888888"))

                    Text("Players in this server haven't planted yet")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "555555"))
                }
                .padding(.top, 80)
            } else {
                let garden = gardens[currentGardenIndex]

                VStack(spacing: 16) {
                    HStack {
                        Button(action: {
                            if currentGardenIndex > 0 { currentGardenIndex -= 1 }
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.title)
                                .foregroundColor(Color(hex: "4ecca3"))
                        }
                        .disabled(currentGardenIndex == 0)

                        Spacer()

                        VStack(spacing: 8) {
                            Image(systemName: "leaf.fill")
                                .font(.system(size: 50))
                                .foregroundColor(Color(hex: "4ecca3"))

                            Text(garden.ownerName)
                                .font(.headline)
                                .foregroundColor(.white)

                            GardenStatsView(garden: garden)
                        }

                        Spacer()

                        Button(action: {
                            if currentGardenIndex < gardens.count - 1 { currentGardenIndex += 1 }
                        }) {
                            Image(systemName: "chevron.right")
                                .font(.title)
                                .foregroundColor(Color(hex: "4ecca3"))
                        }
                        .disabled(currentGardenIndex == gardens.count - 1)
                    }
                    .padding(.horizontal, 20)

                    Text("\(currentGardenIndex + 1) of \(gardens.count)")
                        .font(.caption)
                        .foregroundColor(Color(hex: "888888"))
                }
                .padding(.top, 40)
            }
        }
        .background(Color(hex: "0f0f23"))
    }
}

struct GardenStatsView: View {
    let garden: Garden

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Image(systemName: "leaf")
                    .foregroundColor(Color(hex: "4ecca3"))
                Text("\(garden.plantCount) plants")
                    .foregroundColor(.white)
            }
            HStack {
                Image(systemName: "applelogo")
                    .foregroundColor(Color(hex: "f0a500"))
                Text("\(garden.cropCount) crops")
                    .foregroundColor(.white)
            }
            if let watered = garden.lastWatered {
                HStack {
                    Image(systemName: "drop.fill")
                        .foregroundColor(Color(hex: "4ecca3"))
                    Text("Watered: \(timeAgo(watered))")
                        .foregroundColor(Color(hex: "aaaaaa"))
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(Color(hex: "1a1a2e"))
        .cornerRadius(12)
    }

    func timeAgo(_ date: Date) -> String {
        let minutes = Int(-date.timeIntervalSinceNow / 60)
        if minutes < 60 { return "\(minutes)m ago" }
        return "\(minutes / 60)h ago"
    }
}
