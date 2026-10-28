# Monster Mix V2 — Test

Development copy of Spangla/Testbedbeta at commit a46080fb71e0c720eaf3dda0766eaa3088a1e331.

The live app remains in Spangla/Testbedbeta. Make development changes in this repository only.
Pricing and calculation rules are copied unchanged.

Enable GitHub Pages in this repository's Settings > Pages, using Deploy from a branch,
branch main, folder / (root). The expected test address is:
https://spangla.github.io/MonsterMixv2/

The test app has its own name, install scope, and cache prefix. Its service worker only
cleans up MonsterMixv2 caches. The original app's existing service worker can still clear
other caches on the same origin when it activates; use a separate browser profile for
offline testing if that happens. This does not change the original app's source files.
