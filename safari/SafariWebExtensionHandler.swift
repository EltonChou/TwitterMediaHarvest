// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Native side of the Safari build. Safari Web Extensions have no `downloads`
// or `notifications` API, so the web extension sends messages here
// (see src/libs/safariNative/nativeMessage.ts) and this handler saves files
// into ~/Downloads and shows system notifications.
//
// `safari/setup.sh` copies this file over the one Xcode's converter generates.

import Foundation
import SafariServices
import UniformTypeIdentifiers
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
            return try await download(message)
        case "removeFile":
            return try removeFile(message)
        case "notify":
            try await notify(message)
            return ["ok": true]
        default:
            throw HandlerError("Unknown message type.")
        }
    }

    // MARK: - Downloads

    private var downloadsFolder: URL {
        FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask)[0]
            .resolvingSymlinksInPath()
    }

    /// Resolves a path relative to ~/Downloads, refusing anything outside it.
    private func destination(for relativePath: String) throws -> URL {
        let parts = relativePath.split(separator: "/").map(String.init)
        guard !relativePath.hasPrefix("/"), !parts.isEmpty,
              !parts.contains(where: { $0 == ".." || $0 == "." || $0.isEmpty })
        else { throw HandlerError("Invalid filename.") }
        return parts.reduce(downloadsFolder) { $0.appendingPathComponent($1) }
    }

    private func isInsideDownloads(_ url: URL) -> Bool {
        url.standardizedFileURL.resolvingSymlinksInPath().path
            .hasPrefix(downloadsFolder.path + "/")
    }

    /// "photo.jpg" -> "photo (1).jpg", "photo (2).jpg", ...
    private func uniquified(_ url: URL) -> URL {
        let fm = FileManager.default
        guard fm.fileExists(atPath: url.path) else { return url }
        let base = url.deletingPathExtension().lastPathComponent
        let ext = url.pathExtension
        let folder = url.deletingLastPathComponent()
        for n in 1... {
            let name = ext.isEmpty ? "\(base) (\(n))" : "\(base) (\(n)).\(ext)"
            let candidate = folder.appendingPathComponent(name)
            if !fm.fileExists(atPath: candidate.path) { return candidate }
        }
        return url
    }

    private func download(_ message: [String: Any]) async throws -> [String: Any] {
        guard let filename = message["filename"] as? String else {
            throw HandlerError("Missing filename.")
        }
        var target = try destination(for: filename)
        let fm = FileManager.default
        try fm.createDirectory(
            at: target.deletingLastPathComponent(), withIntermediateDirectories: true)

        let temporary: URL
        var mime = message["mime"] as? String

        if let base64 = message["data"] as? String {
            guard let data = Data(base64Encoded: base64) else {
                throw HandlerError("Invalid file data.")
            }
            temporary = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            try data.write(to: temporary)
        } else if let urlString = message["url"] as? String,
                  let url = URL(string: urlString),
                  url.scheme == "https" || url.scheme == "http" {
            let (file, response) = try await URLSession.shared.download(from: url)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                throw HandlerError("Server responded with \(http.statusCode).")
            }
            mime = response.mimeType ?? mime
            temporary = file
        } else {
            throw HandlerError("Missing or unsupported URL.")
        }

        switch message["conflictAction"] as? String {
        case "overwrite":
            if fm.fileExists(atPath: target.path) { try fm.removeItem(at: target) }
        default:
            // "prompt" cannot show a dialog from here, so it behaves like "uniquify".
            target = uniquified(target)
        }
        try fm.moveItem(at: temporary, to: target)

        let size = (try? fm.attributesOfItem(atPath: target.path)[.size] as? NSNumber)?.intValue ?? 0
        var reply: [String: Any] = ["ok": true, "path": target.path, "fileSize": size]
        if let mime { reply["mime"] = mime }
        return reply
    }

    private func removeFile(_ message: [String: Any]) throws -> [String: Any] {
        guard let path = message["path"] as? String else {
            throw HandlerError("Missing path.")
        }
        let url = URL(fileURLWithPath: path)
        guard isInsideDownloads(url) else {
            throw HandlerError("Refusing to remove a file outside Downloads.")
        }
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
        return ["ok": true]
    }

    // MARK: - Notifications

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

private struct HandlerError: LocalizedError {
    let errorDescription: String?
    init(_ message: String) { errorDescription = message }
}
