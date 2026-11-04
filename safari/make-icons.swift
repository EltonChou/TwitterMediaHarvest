// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Renders the macOS app icons from the extension's SVG logo, so they stay
// sharp at every size (the converter scales up the 128px PNG instead).
//
//   xcrun swift safari/make-icons.swift <logo.svg> <AppIcon.appiconset> <Icon.png>
//
// Run by safari/setup.sh.

import AppKit

let args = CommandLine.arguments
guard args.count == 4, let logo = NSImage(contentsOfFile: args[1]) else {
    FileHandle.standardError.write("usage: make-icons.swift <logo.svg> <appiconset> <Icon.png>\n".data(using: .utf8)!)
    exit(1)
}
let iconSet = URL(fileURLWithPath: args[2])
let windowIcon = URL(fileURLWithPath: args[3])

/// Draws the logo on a light rounded tile following Apple's macOS icon grid
/// (an 824pt tile with a 100pt margin on a 1024pt canvas).
func render(pixels: Int, tile: Bool) -> Data {
    let size = CGFloat(pixels)
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high

    var logoRect = NSRect(x: 0, y: 0, width: size, height: size)
    if tile {
        let margin = size * 100 / 1024
        let tileRect = NSRect(x: margin, y: margin, width: size - 2 * margin, height: size - 2 * margin)
        let path = NSBezierPath(roundedRect: tileRect, xRadius: size * 185 / 1024, yRadius: size * 185 / 1024)

        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(0.3)
        shadow.shadowBlurRadius = size * 10 / 1024
        shadow.shadowOffset = NSSize(width: 0, height: -size * 6 / 1024)
        shadow.set()
        NSColor.white.setFill()
        path.fill()
        NSGraphicsContext.restoreGraphicsState()

        NSGradient(starting: .white, ending: NSColor(white: 0.9, alpha: 1))!
            .draw(in: path, angle: -90)

        let inset = tileRect.width * 0.2
        logoRect = tileRect.insetBy(dx: inset, dy: inset)
    }
    logo.draw(in: logoRect, from: .zero, operation: .sourceOver, fraction: 1)

    NSGraphicsContext.restoreGraphicsState()
    return rep.representation(using: .png, properties: [:])!
}

// Same file names the converter uses, so Contents.json stays valid.
for points in [16, 32, 128, 256, 512] {
    for scale in [1, 2] {
        let file = iconSet.appendingPathComponent("mac-icon-\(points)@\(scale)x.png")
        try render(pixels: points * scale, tile: true).write(to: file)
    }
}
// The large logo in the app's window has no tile, like the converter's.
try render(pixels: 512, tile: false).write(to: windowIcon)
print("Rendered app icons from \(args[1])")
