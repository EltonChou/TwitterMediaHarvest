// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Native side of the Safari build. Safari Web Extensions have no `downloads`
// or `notifications` API, so the web extension sends messages here
// (see src/libs/safariNative/nativeMessage.ts) and this handler saves files
// into ~/Downloads and shows system notifications.
//
// Remote files download in a background URLSession. Its transfers run in a
// system daemon, so they keep going when this extension process is suspended
// or quits between messages (which matters for long videos). `download`
// answers with a token straight away and the extension asks for the result
// with `status`. Results are kept in the app group's UserDefaults so they
// survive this process relaunching.
//
// `safari/setup.sh` copies this file over the one Xcode's converter generates.

import Foundation
import SafariServices
import UserNotifications
import os.log

private let log = Logger(subsystem: "app.mediaharvest.safari", category: "native")

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems.first as? NSExtensionItem
        let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any] ?? [:]

        Task {
            let reply: [String: Any]
            do {
                reply = try await handle(message)
            } catch {
                log.error("Request failed: \(error.localizedDescription, privacy: .public)")
                reply = ["ok": false, "error": error.localizedDescription]
            }
            let response = NSExtensionItem()
            response.userInfo = [SFExtensionMessageKey: reply]
            context.completeRequest(returningItems: [response], completionHandler: nil)
        }
    }

    private func handle(_ message: [String: Any]) async throws -> [String: Any] {
        switch message["type"] as? String {
        case "download":
            return try download(message)
        case "status":
            guard let token = message["token"] as? String else {
                throw HandlerError("Missing token.")
            }
            return await BackgroundDownloads.shared.status(of: token)
        case "removeFile":
            return try removeFile(message)
        case "notify":
            try await notify(message)
            return ["ok": true]
        default:
            throw HandlerError("Unknown message type.")
        }
    }

    private func download(_ message: [String: Any]) throws -> [String: Any] {
        guard let filename = message["filename"] as? String else {
            throw HandlerError("Missing filename.")
        }
        let conflictAction = message["conflictAction"] as? String ?? "uniquify"
        // Validate the target before starting anything.
        _ = try Downloads.destination(for: filename)

        // Small local files (blob:/data: URLs) arrive inline and are saved now.
        if let base64 = message["data"] as? String {
            guard let data = Data(base64Encoded: base64) else {
                throw HandlerError("Invalid file data.")
            }
            let temporary = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
            try data.write(to: temporary)
            var saved = try Downloads.save(temporary, as: filename, conflictAction: conflictAction)
            if let mime = message["mime"] as? String, saved["mime"] == nil { saved["mime"] = mime }
            return saved
        }

        guard let urlString = message["url"] as? String,
              let url = URL(string: urlString),
              url.scheme == "https" || url.scheme == "http"
        else { throw HandlerError("Missing or unsupported URL.") }

        let token = try BackgroundDownloads.shared.start(
            url, job: .init(filename: filename, conflictAction: conflictAction))
        return ["ok": true, "pending": true, "token": token]
    }

    private func removeFile(_ message: [String: Any]) throws -> [String: Any] {
        guard let path = message["path"] as? String else {
            throw HandlerError("Missing path.")
        }
        let url = URL(fileURLWithPath: path)
        guard Downloads.contains(url) else {
            throw HandlerError("Refusing to remove a file outside Downloads.")
        }
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
        return ["ok": true]
    }

    private func notify(_ message: [String: Any]) async throws {
        let center = UNUserNotificationCenter.current()
        let granted = try await center.requestAuthorization(options: [.alert, .sound])
        guard granted else { return }

        let content = UNMutableNotificationContent()
        content.title = message["title"] as? String ?? "Media Harvest"
        content.body = message["message"] as? String ?? ""
        let id = message["id"] as? String ?? UUID().uuidString
        try await center.add(UNNotificationRequest(identifier: id, content: content, trigger: nil))
    }
}

// MARK: - Saving into ~/Downloads

private enum Downloads {
    static var folder: URL {
        FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask)[0]
            .resolvingSymlinksInPath()
    }

    /// Resolves a path relative to ~/Downloads, refusing anything outside it.
    static func destination(for relativePath: String) throws -> URL {
        let parts = relativePath.split(separator: "/").map(String.init)
        guard !relativePath.hasPrefix("/"), !parts.isEmpty,
              !parts.contains(where: { $0 == ".." || $0 == "." || $0.isEmpty })
        else { throw HandlerError("Invalid filename.") }
        return parts.reduce(folder) { $0.appendingPathComponent($1) }
    }

    static func contains(_ url: URL) -> Bool {
        url.standardizedFileURL.resolvingSymlinksInPath().path.hasPrefix(folder.path + "/")
    }

    /// "photo.jpg" -> "photo (1).jpg", "photo (2).jpg", ...
    private static func uniquified(_ url: URL) -> URL {
        let fm = FileManager.default
        guard fm.fileExists(atPath: url.path) else { return url }
        let base = url.deletingPathExtension().lastPathComponent
        let ext = url.pathExtension
        let parent = url.deletingLastPathComponent()
        for n in 1... {
            let name = ext.isEmpty ? "\(base) (\(n))" : "\(base) (\(n)).\(ext)"
            let candidate = parent.appendingPathComponent(name)
            if !fm.fileExists(atPath: candidate.path) { return candidate }
        }
        return url
    }

    /// Moves a finished temporary file into place and describes the result
    /// in the shape the extension expects.
    static func save(_ temporary: URL, as filename: String, conflictAction: String) throws -> [String: Any] {
        let fm = FileManager.default
        var target = try destination(for: filename)
        try fm.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
        if conflictAction == "overwrite" {
            if fm.fileExists(atPath: target.path) { try fm.removeItem(at: target) }
        } else {
            // "prompt" cannot show a dialog from here, so it behaves like "uniquify".
            target = uniquified(target)
        }
        try fm.moveItem(at: temporary, to: target)
        let size = (try? fm.attributesOfItem(atPath: target.path)[.size] as? NSNumber)?.intValue ?? 0
        return ["ok": true, "path": target.path, "fileSize": size]
    }
}

// MARK: - Background downloads

private final class BackgroundDownloads: NSObject, URLSessionDownloadDelegate {
    static let shared = BackgroundDownloads()

    struct Job: Codable {
        var token = UUID().uuidString
        let filename: String
        let conflictAction: String
    }

    private static let sessionID = "app.mediaharvest.safari.downloads"
    private static let resultPrefix = "result."
    private static let resultLifetime: TimeInterval = 24 * 60 * 60

    /// Set by setup.sh in the extension's Info.plist, e.g. "ABCDE12345.app.mediaharvest.safari".
    private let appGroup = Bundle.main.object(forInfoDictionaryKey: "MHAppGroup") as? String

    private lazy var results: UserDefaults =
        appGroup.flatMap { UserDefaults(suiteName: $0) } ?? .standard

    /// Creating the session also reconnects to transfers started by an earlier
    /// run of this process; their delegate callbacks then arrive here.
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: Self.sessionID)
        // App extensions must download into a container shared with their app.
        config.sharedContainerIdentifier = appGroup
        config.isDiscretionary = false
        config.timeoutIntervalForResource = 6 * 60 * 60
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    func start(_ url: URL, job: Job) throws -> String {
        pruneResults()
        let task = session.downloadTask(with: url)
        task.taskDescription = String(data: try JSONEncoder().encode(job), encoding: .utf8)
        task.resume()
        return job.token
    }

    func status(of token: String) async -> [String: Any] {
        if let result = results.dictionary(forKey: Self.resultPrefix + token) {
            return result.filter { $0.key != "finishedAt" }
        }
        let tasks = await session.allTasks
        if let task = tasks.first(where: { Self.job(of: $0)?.token == token }) {
            return [
                "ok": true, "pending": true,
                "bytesReceived": task.countOfBytesReceived,
                "totalBytes": task.countOfBytesExpectedToReceive,
            ]
        }
        // Not known (yet): after a relaunch, callbacks for transfers that
        // finished meanwhile can arrive shortly after the session is created.
        return ["ok": true, "pending": true, "unknown": true]
    }

    private static func job(of task: URLSessionTask) -> Job? {
        guard let data = task.taskDescription?.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Job.self, from: data)
    }

    private func store(_ result: [String: Any], for token: String) {
        var result = result
        result["finishedAt"] = Date().timeIntervalSince1970
        results.set(result, forKey: Self.resultPrefix + token)
    }

    private func pruneResults() {
        let cutoff = Date().timeIntervalSince1970 - Self.resultLifetime
        for (key, value) in results.dictionaryRepresentation() where key.hasPrefix(Self.resultPrefix) {
            let finishedAt = (value as? [String: Any])?["finishedAt"] as? Double ?? 0
            if finishedAt < cutoff { results.removeObject(forKey: key) }
        }
    }

    // The temporary file is deleted as soon as this returns, so move it here.
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask,
                    didFinishDownloadingTo location: URL) {
        guard let job = Self.job(of: downloadTask) else { return }
        if let http = downloadTask.response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            store(["ok": false, "error": "Server responded with \(http.statusCode)."], for: job.token)
            return
        }
        do {
            var saved = try Downloads.save(location, as: job.filename, conflictAction: job.conflictAction)
            if let mime = downloadTask.response?.mimeType { saved["mime"] = mime }
            store(saved, for: job.token)
        } catch {
            log.error("Saving failed: \(error.localizedDescription, privacy: .public)")
            store(["ok": false, "error": error.localizedDescription], for: job.token)
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let error, let job = Self.job(of: task),
              results.dictionary(forKey: Self.resultPrefix + job.token) == nil
        else { return }
        log.error("Download failed: \(error.localizedDescription, privacy: .public)")
        store(["ok": false, "error": error.localizedDescription], for: job.token)
    }
}

private struct HandlerError: LocalizedError {
    let errorDescription: String?
    init(_ message: String) { errorDescription = message }
}
