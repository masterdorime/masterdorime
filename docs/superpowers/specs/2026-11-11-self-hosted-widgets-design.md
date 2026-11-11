# Self-hosted replacement for the six GitSkins widgets

**Date:** 2026-11-11
**Status:** design approved, awaiting implementation plan

## Problem

The profile README at `masterdorime/masterdorime` pulls six widgets from
`www.gitskins.com`. GitSkins has ended free access to these templates and now
stamps every response with a "GitSkins Pro preview / Unlock this template at
gitskins.com" banner, which covers the data and makes the widgets unusable.

Verified against the live service: **all six** carry the banner, not just the two
originally reported.

| Widget | Section | Payload | Banner |
|---|---|---|---|
| HERO | `/api/section/hero` | 209 KB | yes |
| STACK | `/api/section/stack` | 11.6 KB | yes |
| CITY | `/api/section/city` | 219 KB | yes |
| STATS | `/api/section/stats` | 11.5 KB | yes |
| PROJECTS | `/api/section/projects` | 22.9 KB | yes |
| SOCIAL | `/api/section/social` | 8.6 KB | yes |

## Goal

Replace all six with assets this repository owns, so no third party can break
them again. The widgets must keep the current aurora look, stay accurate as the
account changes, and cost nothing to run.

## Explicit non-goals

These are working and are **not** to be modified:

- `skillicons.dev` icon row
- `streak-stats.demolab.com` streak card
- `./ascii-portrait.svg` and `./ascii-namecard.svg`
- `./profile-3d-contrib/profile-gitblock.svg` and its workflow `profile-3d.yml`

The CITY panel is a **frame only**. The isometric 3D geometry is already
self-hosted via `profile-gitblock.svg`, regenerated daily by the existing
`profile-3d.yml` Action. Rebuilding the geometry would duplicate an asset that is
already owned. The new frame is placed in the README directly above the existing
3D image and does not alter it.

## Architecture

```
fetch-data.js                 one API-call site
      |
      v
data/profile-data.json        committed snapshot
      |
      v
lib/theme.js     shared aurora palette, panel chrome, font stack
lib/svg.js       escaping, layout, text measurement helpers
      |
      v
renderers:  stack.js  stats.js  social.js  projects.js  city.js  hero.js
      |
      v
*.svg  committed to the repo, referenced as ./... (served from github.com)
      |
      v
.github/workflows/profile-widgets.yml   daily refresh, commits on change
```

### Why one data file

`profile-data.json` is the single fetch site. Six renderers reading one snapshot
means the Action makes a handful of API calls per run instead of six times as
many, keeps well inside rate limits, and makes every renderer testable offline
from a fixed fixture.

### Why repo-local SVGs

Images referenced with a `./` path are served from `github.com` directly. No
camo proxy, no third-party availability risk, no cache-invalidation surprises.
This is the pattern already proven by `ascii-portrait.svg`.

### File layout

Generated assets are written to `widgets/` and referenced as `./widgets/<name>.svg`:

```
widgets/stack.svg  stats.svg  social.svg  projects.svg  city.svg  hero.svg
```

Matching the existing `profile-3d-contrib/` convention of one directory per
generated group. The `.svg` paths are relative to the README, which sits at the
repository root.

**Generator source must be committed.** The existing `portrait-pipeline/` lives
outside this repository in an untracked parent directory, and `git ls-files` confirms
no `.js` file is committed here. That works for the portrait because it is generated
locally and only its asset is published. It does not work for these widgets: the
daily Action runs on GitHub's runners, which can only read committed files. The
generators therefore live in a committed `widgets-pipeline/` directory. This is the
one deliberate departure from the existing convention, chosen because the alternative
— folding the logic into workflow YAML — would make it untestable in CI.

## Data layer

`fetch-data.js` writes `data/profile-data.json` containing:

- **profile** — login, name, bio, location, blog, twitter_username, followers,
  following, public_repos, avatar_url
- **contributions** — total, activeDays, busiestDay, and the per-day calendar
- **languages** — repo-size-weighted byte totals across owned (non-fork) repos
- **repos** — for each owned repo: name, description, language, topics, stars,
  pushedAt, homepage, and a language breakdown

Sources: `GET /users/{user}`, `GET /users/{user}/repos`, `GET /repos/{u}/{r}/languages`,
and one GraphQL query for the contribution calendar.

**Verified**: the language weighting reproduces GitSkins' output exactly
(ShaderLab 26%, TypeScript 23%, JavaScript 13%, Python 12%, C# 11% on the same
account), so the replacement is visually faithful. It will additionally show
**Rust at 7%**, which GitSkins does not, because of newer work.

## Renderers

Each renderer is a module exporting `render(data) -> string`, reading only from
the snapshot. Shared constants live in `lib/theme.js` so the six panels match
each other and the existing portrait/name-card chrome.

| Renderer | Content |
|---|---|
| `stack.js` | "LANGUAGE STACK" header, `> stack.scan` label, top 5 languages as labelled bars with percentages |
| `stats.js` | "PROFILE SIGNAL" header, four figures: Stars, Contributions, Repos, Followers |
| `social.js` | "GitHub" label, `@masterdorime`, link to the profile |
| `projects.js` | "PROJECTS.LIST" header, `./projects.sh --all`, 4 repos with description, tags, stars, update age |
| `city.js` | "CONTRIBUTION CITY" **frame only** — header, total contributions, active days, busiest day. Contains no 3D geometry; it sits above the existing `profile-gitblock.svg`. |
| `hero.js` | Avatar, identity block, top-language chips |

### Sizing rule (carried from the name-card work)

The README column is ~828px wide and GitHub renders at `displayed/natural`.
Every panel is generated at a natural width of **820px** so it renders at ~1:1
and stays crisp. This is the constraint that fixed the blurry name card and it
applies to all six.

### Freshness

The snapshot is a point-in-time capture, which is exactly why the daily Action
exists. Renderers must not embed timestamps or "generated ago" text that would
look stale if the Action fails; the only time-relative text is per-repo
"updated Nmo ago", recomputed on every run.

`profile-widgets.yml` is a **new, separate** workflow. It does not modify, replace,
or depend on the existing `profile-3d.yml`, which continues to regenerate the 3D
contribution asset on its own schedule. The two run independently; if either
fails, the other is unaffected.

## Project picks

The PROJECTS widget and the README tables below it pin these four repos:

1. `opendump-v2` — Rust core, described accurately including its pre-alpha status
2. `hobyd-hackathon` — TypeScript, live demo at hobyd-hackathon.vercel.app
3. `portofolio-websites` — the portfolio itself
4. `Flying-Fih-Remaster` — JavaScript 3D endless runner

Despite the name, `opendump-v2` is pinned **without** `opendump` (the TypeScript
original), per explicit instruction. Its description states pre-alpha plainly
rather than implying a finished tool.

### Known drift to fix in the same change

- README contains **mojibake**: `01 �` and `Pok�mon` (corrupted from an earlier
  write, to be corrected to `01 ·` and `Pokemon`)
- `aim-drill-game-nyahu` is labelled JavaScript in the README but GitHub reports
  **GDScript**
- `Flying-Fih-Remaster`'s README description does not match the repo's own
- Project titles and links in the tables must match the new four

## Error handling

- **Missing field** in the snapshot: the renderer substitutes an explicit
  placeholder (`--`) rather than throwing, so one absent field cannot blank a
  whole widget.
- **API failure during fetch**: the script exits non-zero *without* overwriting
  `profile-data.json`, so a partial or empty snapshot can never be committed.
- **No change**: the Action compares generated bytes and skips the commit when
  nothing changed, keeping history clean.
- **Zero/empty data**: an empty repo or a zero-value metric renders as `0`, not
  as a gap.

## Accessibility

Every SVG carries `role="img"`, a `<title>`, and a `<desc>` derived from the
rendered content rather than hand-written. This rule comes from the name-card
work, where a hand-written `<desc>` had already drifted out of sync with the
card and was announcing the wrong bio.

## Testing

A validator (`validate-widgets.js`) asserts, per widget:

- self-contained: no `<script>`, no event handlers, no `javascript:` URLs, no
  `<foreignObject>`, no external references
- palette matches the aurora theme constants
- natural width is 820 so it renders at ~1:1
- `role`/`title`/`desc` present
- `<desc>` text matches the data actually rendered
- size under a per-widget ceiling

Plus existing checks carried over: the non-gitskins widgets are still referenced
exactly as before, and no `gitskins.com` reference remains anywhere in the README.

Rendering is verified in a real browser at README width, per widget, capturing
the actual displayed pixels rather than trusting the SVG source.

## Open item (not blocking)

The GitHub profile `name` is `null` and the `bio` is `"masih belajar"`. The agent
token lacks the `user` scope so this cannot be set programmatically. The HERO
widget will render the identity block consistent with the name card so the two
never contradict each other. Setting the real profile fields remains a manual
step for the account owner.

## Cost

Six generated SVGs estimated at 60–90 KB total, replacing ~482 KB of GitSkins
payload. The only runtime cost is one daily Action run.
