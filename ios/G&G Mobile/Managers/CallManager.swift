import Foundation
import AVFoundation

class CallManager: ObservableObject {
    @Published var activeCall: Call?
    @Published var incomingCall: Call?
    @Published var isRinging = false

    private var audioPlayer: AVAudioPlayer?
    private var ringTimer: Timer?

    func startCall(from: String, to: String) {
        let call = Call(
            id: UUID().uuidString,
            fromUserId: from,
            toUserId: to,
            groupId: nil,
            status: .ringing,
            createdAt: Date(),
            endedAt: nil
        )
        activeCall = call
    }

    func startGroupCall(from: String, groupId: String) {
        let call = Call(
            id: UUID().uuidString,
            fromUserId: from,
            toUserId: "",
            groupId: groupId,
            status: .ringing,
            createdAt: Date(),
            endedAt: nil
        )
        activeCall = call
    }

    func answerCall(_ call: Call) {
        var updated = call
        updated.status = .answered
        activeCall = updated
        incomingCall = nil
        stopRing()
    }

    func declineCall(_ call: Call) {
        var updated = call
        updated.status = .declined
        updated.endedAt = Date()
        incomingCall = nil
        stopRing()
    }

    func hangUp() {
        if var call = activeCall {
            call.status = .ended
            call.endedAt = Date()
            activeCall = nil
        }
    }

    func playRingSound() {
        let systemSoundID: SystemSoundID = 1003
        AudioServicesPlaySystemSound(systemSoundID)
    }

    func startRing() {
        isRinging = true
        playRingSound()
        ringTimer = Timer.scheduledTimer(withTimeInterval: 1.5, repeats: true) { [weak self] _ in
            self?.playRingSound()
        }
    }

    func stopRing() {
        isRinging = false
        ringTimer?.invalidate()
        ringTimer = nil
    }
}
