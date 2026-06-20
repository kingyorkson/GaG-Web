import Foundation
import AVFoundation
import UserNotifications

class PermissionManager: ObservableObject {
    @Published var microphoneGranted = false
    @Published var notificationsGranted = false
    @Published var cameraGranted = false
    @Published var allGranted = false

    func requestMicrophone() async -> Bool {
        let status = await AVCaptureDevice.requestAccess(for: .audio)
        await MainActor.run { microphoneGranted = status }
        return status
    }

    func requestNotifications() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            await MainActor.run { notificationsGranted = granted }
            return granted
        } catch {
            return false
        }
    }

    func requestCamera() async -> Bool {
        let status = await AVCaptureDevice.requestAccess(for: .video)
        await MainActor.run { cameraGranted = status }
        return status
    }

    func requestAllPermissions() async {
        let micResult = await requestMicrophone()
        let notifResult = await requestNotifications()

        await MainActor.run {
            allGranted = micResult && notifResult
        }
    }
}
