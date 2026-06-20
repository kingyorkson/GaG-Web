import SwiftUI
import AVFoundation

enum QRScanResult {
    case success(String)
    case failure(Error)
}

struct QRScannerView: UIViewControllerRepresentable {
    var completion: (QRScanResult) -> Void

    func makeUIViewController(context: Context) -> QRScannerController {
        let controller = QRScannerController()
        controller.completion = completion
        return controller
    }

    func updateUIViewController(_ uiViewController: QRScannerController, context: Context) {}
}

class QRScannerController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var completion: ((QRScanResult) -> Void)?
    private var captureSession: AVCaptureSession?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.black
        setupCamera()
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else {
            completion?(.failure(NSError(domain: "camera", code: -1, userInfo: [NSLocalizedDescriptionKey: "Camera not available"])))
            return
        }

        captureSession = AVCaptureSession()
        captureSession?.addInput(input)

        let output = AVCaptureMetadataOutput()
        captureSession?.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.qr]

        let preview = AVCaptureVideoPreviewLayer(session: captureSession!)
        preview.frame = view.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)

        DispatchQueue.global(qos: .background).async {
            self.captureSession?.startRunning()
        }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = object.stringValue else { return }

        captureSession?.stopRunning()
        completion?(.success(stringValue))
        dismiss(animated: true)
    }

    private func dismiss(animated: Bool) {
        DispatchQueue.main.async {
            self.dismiss(animated: true)
        }
    }
}
