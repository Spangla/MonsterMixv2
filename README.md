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
discard an in-progress quote automatically. Users of the initial V2 copy may need
to reload once more after the first update installs.
