# fncsdraft: how the project is built

A map for a developer joining the project. Read this before opening `index.html`.

## The shape in one paragraph

The whole site is a static single page (`index.html`, ~184k lines) served by Cloudflare Pages,
plus three plain scripts it loads (`zone-sim.js`, `zone-replay.js`, `mp.js`), plus one Cloudflare
Worker (`server/`) for everything that needs a server: online lobbies, cloud saves, leaderboards,
the daily draft and the error log. There is no framework and no bundler in the repo. A deploy
step (`tools/build-deploy.js`) cuts `index.html` into a small shell and a cached `app.js`.
Tests are ~500 headless-Chrome harnesses in `tools/check-*.js`.

## Files

| Path | What it is |
|---|---|
| `index.html` | CSS, HTML, strings, card data and all game code, in that order (map below) |
| `zone-sim.js` | Match engine: storm circles, rotations, fights, who dies where. Pure, seeded |
| `zone-replay.js` | Draws a simulated match on the island map (SVG), arrows, names, kill feed |
| `mp.js` | Browser side of online play: WebSocket to the `Lobby` Durable Object, lockstep acts |
| `maps.js`, `fn-shop.js`, `lines-more.js`, `i18n-de.js`, `i18n-es.js` | Lazy data: island maps, item shop by day, extra flavour lines, German and Spanish strings |
| `server/src/worker.js` | Worker entry: WebSocket upgrade to a `Lobby` room, plus `/vault`, `/vreg`, `/board`, `/daily`, `/errlog` and the owner-only dump routes |
| `server/src/lobby.js` | `Lobby` Durable Object: a room for 2-6 players, relays acts in order |
| `server/src/vault.js`, `board.js`, `daily.js`, `errlog.js`, `nick-filter.js` | Cloud save by code key, leaderboards, daily draft seed, client error log, nickname filter |
| `functions/api/live.js` | Pages Function used by the Competitive tab |
| `tools/` | Builders of data, checks, probes, deploy (see below) |
| `tools/measured/` | Data measured from real sources (Epic calendars, results, ratings). Inputs to builders |
| `art/`, `photos/`, `flags/`, `logos/`, `items/`, `devices/`, `fonts/` | Static assets |
| `docs/` | Specs and plans. `docs/superpowers/plans` holds the step-by-step plans of past features |

## index.html and src/

The page is also kept cut into readable files under `src/` (`src/PARTS.txt` is the order). Each part
starts at a marker line `@@PART <path>@@` inside a comment, so the page is the plain concatenation of the parts.

```
node tools/parts.js split      # after editing index.html (stamp-build.js does this on every deploy)
node tools/parts.js assemble   # after editing a file in src/
node tools/parts.js check      # CI: fails if the two disagree
```

Checks and builders still read and write `index.html`; either side can be edited. To re-cut, move or add
a marker line in `index.html` and run `split`. Career sits in `src/js/career/`, one file per stretch of related
features (match choices, loot and endgame, online, cloud and hub, clubs, shop, majors and LANs ...). Code is
never reordered by a cut, so a feature that was written in two places still lives in two files: search by name.

## Map of index.html

Line numbers drift; search for the names, not the numbers.

| Lines (approx.) | Block | Look for |
|---|---|---|
| 1-10400 | CSS | class prefixes `cc-` (career), `ch-` (career hub), `mgr-` (manager), `stage-`, `lobby-` |
| 10400-11540 | `<body>`: the screens as static HTML | `id="screen-..."` |
| 11540-24000 | Strings for ru, en, fr, it, pt | `L()` returns the active table; `T.someKey` in code |
| 24000-30000 | Card helpers: rarity, regions, rating | `rarityFor`, `regionForNat` |
| 30000-90000 | Card data, generated | `CARD_<season><region>_<stage>_RAW`, `*_NAT` (nationality) |
| 96000-108000 | Draft game: drafting, rendering, runs | `render...`, `draft...`, `build...` |
| 108000-114000 | Squad modes, landing spots, run history | `sq...`, `landing...` |
| 114000-168000 | Career mode (most of the code) | `career...`, `cc...`, `CC_...` constants |
| 168000-180000 | Fortnite Manager, home page, Higher or Lower | `mgr...`, `home...`, `hl...`; manager sits between `/*@@MGR-FROM@@*/` and `/*@@MGR-TILL@@*/` |
| 180000-183900 | Regens, profile tab, achievements | `ccRegen...`, `CC_ME_...` |

Career entry points worth knowing: `careerEntry` (load a save), `careerRenderHub` (main screen),
`careerNext` (what the next evening is), `careerPlay` / `careerPlayRun` (play it),
`runCareerCup`, `runCareerVictoryNight`, `runCareerSoloSeries` (the evening runners),
`careerFastForward` (skip days), `careerSave`. The save lives in `localStorage['fncsdraft_career']`.

Strings: every user-facing string goes through `L()`; never hard-code text. The UI never shows the
long dash; `ccNoDash` strips it.

## Online play

Lockstep. Each client simulates the same evening from the same seed; only player decisions travel
(`MP.act(kind, payload)`), relayed in order by the `Lobby` Durable Object. The room leader also sends a
"world book" at the start of an evening (`tworld` for team, `world` for race) so both sides start
from identical state; followers re-ask (`tworld?`, `world?`) until they have it. Anything that reads
`Math.random`, the clock or local-only state inside an evening is a divergence bug; the
`check-mp-*` harnesses exist to catch exactly that. Client errors are posted to `/errlog`.

## Build and deploy

```
node tools/stamp-scripts.js && node tools/stamp-build.js      # content hashes into ?v= and CC_BUILD
node tools/build-deploy.js "<new empty folder>"                # shell + app.js + mgr.js + pages
node tools/check-deploy-folder.js "<that folder>"              # opens it in Chrome, counts 404s and errors
cd "<that folder>" && npx wrangler pages deploy . --project-name=fncsdraft --branch=debug --commit-dirty=true
```

`--branch=debug` is https://debug.fncsdraft.pages.dev; production is `--branch=main`. Production is
only deployed on the owner's explicit word. The root URL can serve a cached build for a few minutes;
check with `?cb=<random>`.

The Worker deploys separately: `cd server && npx wrangler deploy`.

Why `index.html` stays whole in the repo: the harnesses copy it to a temp folder and run it from
`file://`. Many have no `<base href>`, so an external `app.js` would not load and they would all fail.
The cut happens only in the deploy folder, and `check-deploy-folder.js` re-checks it every time.

## Checks

- `bash tools/run-guards.sh`: the 60 fast guards (~15 min). Online guards need a local Worker:
  `cd server && npx wrangler dev --port 8787 --local`, then `CC_HOST=ws://127.0.0.1:8787`.
- `node tools/check-<name>.js`: any single check. Exit code 0 is green.
- `tools/probe-run.js <body.js> [virtual-ms]`: runs a snippet inside the page in headless Chrome and
  prints its return value as JSON. The quickest way to ask the game a question.
- `tools/check-iphone.js`: WebKit (Playwright) pass over 15 screens. The owner plays on iPhone Safari.
- `server/tools/check-*.js`: Worker checks.
- `.github/workflows/guards.yml`: CI, see the file for what runs on each push.

Chrome is found at the usual Windows paths or through the `CHROME` environment variable.

## Data

Real data only: ratings, results, prize tables, calendars and scoring come from Epic, Liquipedia
and recorded replays. If a number is a design choice rather than a measurement, the comment next to
it says so. Builders (`tools/build-*.js`) read `tools/measured/*.json` and write generated blocks
into `index.html` between marker comments; re-run the builder rather than editing a generated block.
`tools/fetch-*.js` refresh the measured inputs. Do not scrape fortnitetracker.com.

## Conventions and traps

- Comments are short and say what and why. Some are Russian; both are fine.
- `index.html` is committed with LF. Check `git diff --cached --stat` before committing; a CRLF
  conversion shows up as the whole file changed.
- Editing `index.html` from a shell: `sed` and `node -e` in Git Bash eat backslashes in regexes.
  Use a real editor or a script file.
- Code between the `MGR` markers ships in `mgr.js`, which loads only when the manager opens.
  Career code must not call into it.
- Never add a dependency on a CDN or a tracker. Keep the page working from `file://`.
- Player names on the site belong to real people. Player pages honour `tools/player-optout.json`.
