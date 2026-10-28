# Monster Mix V2 — Test

Development copy of Spangla/Testbedbeta at commit a46080fb71e0c720eaf3dda0766eaa3088a1e331.

The live app remains in Spangla/Testbedbeta. Make development changes in this repository only.
Concrete prices were updated from Mike's supplied price list on 28 Oct 2026.
All eleven grades are listed in `pricing.js`; monetary amounts there are integer pence.
Delivery bands, pump charges, 20% VAT, and waiting-time rules retain the existing setup.
Mike confirmed keeping free delivery above 30 m³ and the existing waiting boundaries.

GitHub Pages uses branch main, folder / (root). Test address:
https://spangla.github.io/MonsterMixv2/

The test app has its own name, install scope, and cache prefix. Its service worker only
cleans up MonsterMixv2 caches. The original app's existing service worker can still clear
other caches on the same origin when it activates; use a separate browser profile for
offline testing if that happens. This does not change the original app's source files.

## Development and checks

No build step or frontend dependencies. Serve the repository through a local HTTP server
for browser testing. Run calculation and service worker tests with:

    node --test tests/*.test.cjs

Mobile layout uses native form controls, numeric keyboards, inputs at least 16px,
touch targets at least 44px, and safe-area padding. Browser checks covered WebKit
with iPhone settings at 320px, 390px, 430px and landscape, and Chromium with Pixel settings.
These checks do not replace physical iPhone and Android testing.

After changing cached assets, bump the version in `service-worker.js`. An existing
V2 session shows a Reload app notice when a new version takes control; it does not
discard an in-progress calculation automatically. Users of the initial V2 copy may need
to reload once more after the first update installs.

## Driver workflow and image forwarding

Enter the load details and tap Calculate. The total updates when those details change.
The real company wordmark from the company website is used in the header and price image;
the rest of the interface uses a system font. The website header uses an image, so no
matching reusable company font has been identified. The existing PWA icons are retained.

Wordmark source (retrieved 28 Oct 2026):
https://static.wixstatic.com/media/153d1a_b366021e436247d0bbf2779c6581619e~mv2.jpeg

Forward as quote uses the native file-sharing menu when the browser supports PNG files.
Save as image beneath it downloads the same PNG file. Both actions use the current calculation.
The driver chooses WhatsApp and the recipient. The app cannot preselect WhatsApp or confirm
message delivery. Preview quote is available below the buttons. There are no copy or print controls.
If native image sharing fails, the preview opens so the driver can use the phone's image options.
The quote image identifies the concrete grade and total volume above the price breakdown.
All test images are marked V2 TEST CALCULATION and are not payment receipts.

Images are generated locally with canvas, including offline. No customer details or images
are uploaded. Preparing the image before the share tap preserves user activation on mobile.
Any edit invalidates the previous image; stale asynchronous renders cannot replace it.

## Installation guidance

iPhone/iPad browser visits show an optional install welcome, followed by Safari's
Share > Add to Home Screen > Add steps. Other iPhone browsers are directed to Safari.
Not now/Got it suppresses repeat automatic guidance in the current tab session.
Don't show again stores a preference in this browser; setup remains available from
the Install app dropdown. Preferences fail safely if browser storage is blocked.

Android keeps the browser's native beforeinstallprompt default behavior. The Install app
dropdown can also invoke an available native prompt; a browser-menu instruction is
shown otherwise. The browser controls eligibility and whether an automatic popup appears.

Home Screen app launches (iOS standalone or standalone/fullscreen/minimal-ui display mode)
hide all installation controls and open directly to the calculator. Browsers do not
provide reliable cross-context detection of an existing iPhone installation.
