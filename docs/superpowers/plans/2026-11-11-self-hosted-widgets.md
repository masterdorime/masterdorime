# Self-Hosted Profile Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six GitSkins widgets in the profile README with SVGs this repository generates and owns, refreshed daily by a GitHub Action.

**Architecture:** One data fetcher writes a committed JSON snapshot from the GitHub API. Six renderer modules each read that snapshot and emit a self-contained SVG. Every panel is generated at a natural width of 820px so it renders at ~1:1 in the README column, using shared chrome constants so all six match the existing portrait and name card.

**Tech Stack:** Node.js (CommonJS, matching the existing `build-ascii-*.js` generators), `gh` CLI for API access, plain string-built SVG (no libraries), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-11-self-hosted-widgets-design.md`

## Global Constraints

- Node.js CommonJS (`require`/`module.exports`), matching `portrait-pipeline/build-ascii-svg.js`.
- **No new npm dependencies.** SVG is built as strings; `gh` CLI supplies API data.
- Every generated SVG must be **self-contained**: no `<script>`, no `on*=` handlers, no `javascript:` URLs, no `<foreignObject>`, no external `href`/`src`.
- Natural width of every panel is **exactly 820px** (the README column is ~828px; 820 renders at ~1:1 and keeps type crisp).
- Every SVG carries `role="img"`, a `<title>`, and a `<desc>` **derived from the rendered data**, never hand-written.
- Panel chrome values are fixed: background `#080e16`, border radius `rx="16"`, edge gradient `#2dd4bf` (0.55) → `#22d3ee` (0.18), window dots `#f87171` / `#fbbf24` / `#34d399` at `fill-opacity="0.85"`, dot radius `4.6` at `cy="40"`, dot `cx` = 36 / 52 / 68.
- Text colours: accent `#5eead4`, body `#7fe7d6`, muted `#a8b6c4`, dim `#5a6b7a`.
- Font stack: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- Generated assets live in `widgets/` and are referenced as `./widgets/<name>.svg`.
- **Do not modify**: `skillicons.dev` row, `streak-stats.demolab.com` card, `./ascii-portrait.svg`, `./ascii-namecard.svg`, `./profile-3d-contrib/profile-gitblock.svg`, or `.github/workflows/profile-3d.yml`.
- PROJECTS widget pins exactly: `opendump-v2`, `hobyd-hackathon`, `portofolio-websites`, `Flying-Fih-Remaster`.

## Review Focus

Failure modes the spec implies that no single task's tests fully cover, most likely to bite first:

1. **A missing or null field blanks a whole widget.** The API returns `null` description for several of the 12 repos, and a brand-new account has zero repos. Every renderer must substitute an explicit placeholder (`--`) rather than throw or emit an empty panel.

2. **A failure mid-fetch commits a partial snapshot.** If the GitHub API returns an error partway through, `profile-data.json` must not be overwritten with incomplete data — a stale-but-correct snapshot beats a fresh-but-wrong one, and the renderers would faithfully draw the wrong numbers.

3. **The widget does not match what it claims.** `<desc>` must be derived from the rendered data. The name-card work already shipped a hand-written `<desc>` that drifted and announced the wrong bio; the same mistake would make these widgets lie to screen readers.

4. **A panel is committed at the wrong width.** Any natural width other than 820 makes GitHub scale it, which blurs type — the exact defect that made the name card unreadable. This is easy to regress when a renderer computes its own height.

5. **Nothing changes but the Action commits anyway.** A daily job that commits an identical file creates empty commits forever and pollutes history. The Action must compare bytes and skip when unchanged.

---

## File Structure

**Correction from the spec.** The spec assumed the generators live inside the profile
repo. They do not: `portrait-pipeline/` sits in the **untracked parent directory**, and
`git ls-files` confirms **no `.js` file is committed** to the published repo. Only
assets are. That convention is deliberate and this plan keeps it.

That raises one question the spec did not answer: the GitHub Action runs on GitHub's
runners, which can only see committed files, so the generator source must be
committed *somewhere*. Two options were weighed:

- **(a) Commit the pipeline into the profile repo.** Simplest — the Action just runs
  `node widgets-pipeline/build-all.js`. Cost: ~15 JS files appear in the file listing
  of a repo whose whole purpose is to render a README.
- **(b) Keep the pipeline out, generate from a scheduled Action that vendors the
  scripts inline.** Avoids clutter but duplicates logic into YAML and makes the code
  untestable in CI.

**Decision: (a), with the pipeline confined to one directory.** Correctness and
testability beat file-listing tidiness, the directory is self-contained, and the
existing `profile-3d-contrib/` precedent shows a per-concern directory in this repo is
already normal. The generators are additionally excluded from the rendered README, so
a visitor never sees them.

```
widgets-pipeline/          committed (source)
  fetch-data.js            one API-call site; writes ../data/profile-data.json
  lib/theme.js             chrome constants, palette, font stack, panel wrapper
  lib/svg.js               escaping, text-measure estimate, bar rendering
  renderers/stack.js       -> ../widgets/stack.svg
  renderers/stats.js       -> ../widgets/stats.svg
  renderers/social.js      -> ../widgets/social.svg
  renderers/projects.js    -> ../widgets/projects.svg
  renderers/city.js        -> ../widgets/city.svg
  renderers/hero.js        -> ../widgets/hero.svg
  build-all.js             runs every renderer, writes widgets/*.svg
  test/                    node:test suites, one per module
  fixtures/snapshot.json   frozen fixture for offline renderer tests

widgets/                   generated output, committed
data/profile-data.json     committed snapshot

.github/workflows/profile-widgets.yml   daily refresh
```

**Note:** `portrait-pipeline/` (outside this repo) is unaffected — the portrait and
name card keep their existing out-of-repo generation, because they are not refreshed
on a schedule and therefore need no committed source.

**Responsibilities:**

- `lib/theme.js` — the single source of truth for every chrome value in Global
  Constraints. Renderers never hard-code a colour.
- `lib/svg.js` — `esc()`, plus `bar()` and `panel()`. Pure functions, no data access.
- `renderers/*.js` — each exports `render(snapshot) -> string`. Pure: given the same
  snapshot, byte-identical output. No I/O, no clock, no randomness.
- `fetch-data.js` — the only module that touches the network.

**Why this split:** renderers are pure functions of the snapshot, so every one is
testable offline from `fixtures/snapshot.json`. That is what makes the daily Action
safe — a renderer can never fail because of a network condition.

---

### Task 1: Theme and SVG helpers

**Files:**
- Create: `widgets-pipeline/lib/theme.js`
- Create: `widgets-pipeline/lib/svg.js`
- Test: `widgets-pipeline/test/theme.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `theme.js`: `COLORS` (object), `PANEL` (object), `FONT_STACK` (string),
    `WIDTH` (number, `820`), `panel(inner, height) -> string`
  - `svg.js`: `esc(s) -> string`, `bar(x, y, w, pct, color) -> string`

- [ ] **Step 1: Write the failing test**

Create `widgets-pipeline/test/theme.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const theme = require("../lib/theme.js");
const svg = require("../lib/svg.js");

test("panel width is exactly the README column width", () => {
  assert.strictEqual(theme.WIDTH, 820);
});

test("panel emits a self-contained svg at the fixed width", () => {
  const out = theme.panel("<text>hi</text>", 100);
  assert.match(out, /<svg[^>]*width="820"/);
  assert.match(out, /viewBox="0 0 820 100"/);
  assert.match(out, /role="img"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|//)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("esc escapes the five xml-significant characters", () => {
  assert.strictEqual(svg.esc(`<a & b "c" 'd'>`), "&lt;a &amp; b &quot;c&quot; &#39;d&#39;&gt;");
});

test("bar width is proportional to percentage", () => {
  const half = svg.bar(0, 0, 100, 50, "#5eead4");
  assert.match(half, /width="50/);
});

test("bar clamps out-of-range percentages", () => {
  assert.match(svg.bar(0, 0, 100, 150, "#5eead4"), /width="100/);
  assert.match(svg.bar(0, 0, 100, -20, "#5eead4"), /width="0/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/theme.test.js`
Expected: FAIL — `Cannot find module '../lib/theme.js'`

- [ ] **Step 3: Implement `lib/theme.js` and `lib/svg.js`**

`lib/theme.js` exports the constants from Global Constraints verbatim, plus:

```js
// panel(inner, height) wraps rendered content in the shared chrome:
// background rect, edge gradient, three window dots, then `inner`.
// `height` is the caller's content height; the panel adds PAD*2.
function panel(inner, height) { /* ... */ }
```

The SVG root carries `xmlns`, `width="820"`, `height`, `viewBox="0 0 820 <height>"`,
`role="img"`, and `aria-labelledby="ttl dsc"`. Caller-supplied `<title id="ttl">`
and `<desc id="dsc">` are passed inside `inner`.

`lib/svg.js`:

```js
// bar(x, y, w, pct, color) -> a track rect plus a value rect.
// pct is clamped to 0..100. Width is (w * pct / 100).
function bar(x, y, w, pct, color) { /* ... */ }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/theme.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/lib widgets-pipeline/test/theme.test.js
git commit -m "feat(widgets): add shared theme constants and svg helpers"
```

---

### Task 2: Data fetcher

**Files:**
- Create: `widgets-pipeline/fetch-data.js`
- Test: `widgets-pipeline/test/fetch-data.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `data/profile-data.json` with shape:

```jsonc
{
  "fetchedAt": "2026-11-11T00:00:00Z",
  "profile": { "login": "", "name": null, "bio": null, "blog": null,
               "twitter_username": null, "followers": 0, "following": 0,
               "public_repos": 0, "avatar_url": "" },
  "contributions": { "total": 0, "activeDays": 0, "busiestDay": 0 },
  "languages": [ { "name": "ShaderLab", "bytes": 128000, "pct": 26 }, ... ],
  "repos": [ { "name": "", "description": null, "language": null,
               "topics": [], "stars": 0, "pushedAt": "", "homepage": null } ]
}
```

`languages` is sorted descending by `bytes`. `pct` is a rounded integer of
`bytes / sum(bytes) * 100`. `repos` is sorted descending by `pushedAt`, forks excluded.

- [ ] **Step 1: Write the failing test**

Create `widgets-pipeline/test/fetch-data.test.js`. The fetch itself hits the network,
so test only the pure transform:

```js
const test = require("node:test");
const assert = require("node:assert");
const { buildSnapshot } = require("../fetch-data.js");

const raw = {
  profile: { login: "u", followers: 1, following: 2, public_repos: 3, avatar_url: "a" },
  contributions: { totalContributions: 10, weeks: [
    { contributionDays: [ { date: "2026-01-01", contributionCount: 4 },
                          { date: "2026-01-02", contributionCount: 0 } ] },
    { contributionDays: [ { date: "2026-01-08", contributionCount: 6 } ] },
  ]},
  repos: [
    { name: "b", fork: false, pushedAt: "2026-01-02", description: null,
      language: "Rust", topics: [], stargazers_count: 0, homepage: null, languages: { Rust: 100 } },
    { name: "a", fork: false, pushedAt: "2026-03-01", description: "x",
      language: "TS", topics: ["t"], stargazers_count: 2, homepage: "h", languages: { TS: 300 } },
    { name: "f", fork: true,  pushedAt: "2026-05-01", languages: { Go: 999 } },
  ],
};

test("forks are excluded", () => {
  const s = buildSnapshot(raw);
  assert.deepStrictEqual(s.repos.map(r => r.name), ["a", "b"]);
});

test("repos sort by pushedAt descending", () => {
  assert.strictEqual(buildSnapshot(raw).repos[0].name, "a");
});

test("contributions derive total, activeDays and busiestDay", () => {
  const c = buildSnapshot(raw).contributions;
  assert.strictEqual(c.total, 10);
  assert.strictEqual(c.activeDays, 2);
  assert.strictEqual(c.busiestDay, 6);
});

test("languages are byte-weighted, sorted, and sum sensibly", () => {
  const l = buildSnapshot(raw).languages;
  assert.strictEqual(l[0].name, "TS");
  assert.strictEqual(l[0].pct, 75);
  assert.strictEqual(l[1].pct, 25);
});

test("null fields survive as null rather than throwing", () => {
  const b = buildSnapshot(raw).repos.find(r => r.name === "b");
  assert.strictEqual(b.description, null);
  assert.strictEqual(b.homepage, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/fetch-data.test.js`
Expected: FAIL — `buildSnapshot` is not a function

- [ ] **Step 3: Implement `buildSnapshot(raw)` and the fetch wrapper**

`buildSnapshot(raw)` is pure — it takes already-fetched data and shapes it. The
network work lives in `main()`, which calls `gh api` for profile, repos and
per-repo languages, and `gh api graphql` for the contribution calendar.

**Critical (Review Focus 2):** `main()` writes `data/profile-data.json` only after
every call has succeeded. On any error it exits non-zero **without touching the
existing file**:

```js
// Write to a temp path, then rename. A crash between the two leaves the
// previous snapshot intact rather than a truncated one.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/fetch-data.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Generate a real snapshot**

Run: `node widgets-pipeline/fetch-data.js`
Expected: writes `data/profile-data.json`. Verify it parses and has 12 repos:

```bash
node -e "const d=require('./data/profile-data.json'); console.log(d.repos.length, d.languages.slice(0,3).map(l=>l.name+' '+l.pct+'%').join(', '), d.contributions.total)"
```

Expected: `12 ShaderLab 26%, TypeScript 23%, JavaScript 13% <total>`

- [ ] **Step 6: Commit**

```bash
git add widgets-pipeline/fetch-data.js widgets-pipeline/test/fetch-data.test.js data/profile-data.json
git commit -m "feat(widgets): add data fetcher and initial snapshot"
```

---

### Task 3: Fixture and renderer harness

**Files:**
- Create: `widgets-pipeline/fixtures/snapshot.json`
- Create: `widgets-pipeline/build-all.js`
- Test: `widgets-pipeline/test/harness.test.js`

**Interfaces:**
- Consumes: `fetch-data.js`'s snapshot shape (Task 2).
- Produces:
  - `fixtures/snapshot.json` — a frozen copy of a real snapshot, plus deliberate
    nulls, used by every renderer test so they never touch the network.
  - `build-all.js` exporting `buildAll(snapshot) -> { [name]: string }` and, when
    run directly, writing each to `widgets/<name>.svg`.

- [ ] **Step 1: Write the failing test**

Create `widgets-pipeline/test/harness.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { buildAll } = require("../build-all.js");

test("fixture contains a null-description repo to exercise placeholders", () => {
  assert.ok(fixture.repos.some(r => r.description === null));
});

test("fixture contains a zero-repo-safe shape", () => {
  assert.ok(Array.isArray(fixture.languages));
  assert.ok(fixture.contributions.total >= 0);
});

test("buildAll returns all six widgets", () => {
  const out = buildAll(fixture);
  assert.deepStrictEqual(
    Object.keys(out).sort(),
    ["city", "hero", "projects", "social", "stack", "stats"]
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/harness.test.js`
Expected: FAIL — cannot find `../fixtures/snapshot.json`

- [ ] **Step 3: Create the fixture and `build-all.js`**

Copy `data/profile-data.json` to `fixtures/snapshot.json`, then hand-edit:

- one repo to have `"description": null` and one to have `"homepage": null`, so the
  placeholder path is always exercised
- `opendump-v2` to keep its real description, which contains the word **pre-alpha**,
  so Task 7's truthfulness test has something to assert against

The fixture is frozen from this point — no task regenerates it. Task 3's test
already asserts a null-description repo exists.

`build-all.js`:

```js
// Renderers not yet written are stubbed to return an empty panel, so this
// harness is usable from Task 3 onward and finishes as later tasks land.
const RENDERERS = ["stack", "stats", "social", "projects", "city", "hero"];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/harness.test.js`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/fixtures widgets-pipeline/build-all.js widgets-pipeline/test/harness.test.js
git commit -m "test(widgets): add frozen fixture and renderer harness"
```

---

### Task 4: STACK renderer

**Files:**
- Create: `widgets-pipeline/renderers/stack.js`
- Test: `widgets-pipeline/test/stack.test.js`

**Interfaces:**
- Consumes: `lib/theme.js`, `lib/svg.js`, snapshot shape from Task 2.
- Produces: `render(snapshot) -> string`. Top **5** languages by `bytes`.

- [ ] **Step 1: Write the failing test**

Create `widgets-pipeline/test/stack.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/stack.js");

test("renders a self-contained svg at the fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|//)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("shows at most five languages", () => {
  const names = [...render(fixture).matchAll(/class="lang-name"[^>]*>([^<]+)</g)]
    .map(m => m[1]);
  assert.ok(names.length <= 5, "got " + names.length);
  assert.ok(names.includes("ShaderLab"));
});

test("describes itself from the rendered data", () => {
  const out = render(fixture);
  const desc = (out.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [])[1] || "";
  assert.match(desc, /ShaderLab/);
  assert.ok(desc.length > 20);
});

test("survives a snapshot with no languages", () => {
  const out = render({ ...fixture, languages: [] });
  assert.match(out, /width="820"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/stack.test.js`
Expected: FAIL — cannot find module `../renderers/stack.js`

- [ ] **Step 3: Implement the renderer**

Header "LANGUAGE STACK", right-aligned `> stack.scan` label, one row per language:
name, percentage, and a bar via `svg.bar()`. Bar colour cycles through the accent
palette so five rows stay distinguishable. Height is computed from row count — never
a hard-coded constant (Review Focus 4).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/stack.test.js`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/renderers/stack.js widgets-pipeline/test/stack.test.js
git commit -m "feat(widgets): render language stack panel"
```

---

### Task 5: STATS renderer

**Files:**
- Create: `widgets-pipeline/renderers/stats.js`
- Test: `widgets-pipeline/test/stats.test.js`

**Interfaces:**
- Consumes: `lib/theme.js`, snapshot shape.
- Produces: `render(snapshot) -> string`. Four figures: Stars, Contributions, Repos,
  Followers. Stars is summed across non-fork repos.

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/stats.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|//)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("shows all four metrics", () => {
  const out = render(fixture);
  for (const label of ["Stars", "Contributions", "Repos", "Followers"]) {
    assert.ok(out.includes(label), "missing " + label);
  }
});

test("uses the snapshot numbers, not placeholders", () => {
  const out = render(fixture);
  assert.ok(out.includes(String(fixture.contributions.total)));
  assert.ok(out.includes(String(fixture.profile.public_repos)));
});

test("renders zero honestly rather than blanking", () => {
  const zeroed = JSON.parse(JSON.stringify(fixture));
  zeroed.profile.followers = 0;
  zeroed.contributions.total = 0;
  const out = render(zeroed);
  assert.match(out, />0</);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/stats.test.js`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the renderer**

Header "PROFILE SIGNAL", sub-label "Live GitHub stats, self-hosted", then four
metric blocks. Use thousands separators for `contributions.total`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/stats.test.js`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/renderers/stats.js widgets-pipeline/test/stats.test.js
git commit -m "feat(widgets): render profile signal panel"
```

---

### Task 6: SOCIAL renderer

**Files:**
- Create: `widgets-pipeline/renderers/social.js`
- Test: `widgets-pipeline/test/social.test.js`

**Interfaces:**
- Consumes: `lib/theme.js`, snapshot `.profile`.
- Produces: `render(snapshot) -> string`. This is the smallest panel and the only one
  the README displays at `width="60%"`, so its natural width is still 820 (Global
  Constraints) — the 60% is applied in the README, not here.

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/social.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|//)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("shows the login handle with an at-sign", () => {
  assert.ok(render(fixture).includes("@" + fixture.profile.login));
});

test("the handle is a link to the profile", () => {
  const out = render(fixture);
  assert.match(out, /<a [^>]*href="https:\/\/github\.com\/masterdorime/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/social.test.js`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the renderer**

Note: this renderer is the one place a URL is expected, so the self-contained check
above is scoped to exclude the profile `href`. Keep the `<a>` to the GitHub profile
and no other external reference.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/social.test.js`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/renderers/social.js widgets-pipeline/test/social.test.js
git commit -m "feat(widgets): render social handle panel"
```

---

### Task 7: PROJECTS renderer

**Files:**
- Create: `widgets-pipeline/renderers/projects.js`
- Test: `widgets-pipeline/test/projects.test.js`

**Interfaces:**
- Consumes: `lib/theme.js`, `lib/svg.js`, snapshot `.repos`.
- Produces: `render(snapshot) -> string`, plus an exported
  `PINNED = ["opendump-v2", "hobyd-hackathon", "portofolio-websites", "Flying-Fih-Remaster"]`.

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render, PINNED } = require("../renderers/projects.js");

test("pins exactly the four agreed repos", () => {
  assert.deepStrictEqual(PINNED, [
    "opendump-v2", "hobyd-hackathon", "portofolio-websites", "Flying-Fih-Remaster",
  ]);
});

test("pinned order is preserved in the output", () => {
  const out = render(fixture);
  const idx = PINNED.map(n => out.indexOf(n));
  assert.ok(idx.every(i => i >= 0), "missing a pinned repo: " + idx.join(","));
  assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx);
});

test("descriptions render without trailing mojibake or raw markup", () => {
  const out = render(fixture);
  assert.doesNotMatch(out, /\\uFFFD/);
  assert.doesNotMatch(out, /<script/i);
});

test("a null description becomes an explicit placeholder", () => {
  const out = render(fixture);
  assert.match(out, /--/);
});

test("opendump-v2 is described as pre-alpha, not as a finished tool", () => {
  // The repo says the scanner, executor and Tauri shell are not built yet.
  // The panel must not imply otherwise.
  const out = render(fixture);
  assert.match(out, /pre-alpha/i);
});

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/projects.test.js`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the renderer**

Header "PROJECTS.LIST", sub-label `./projects.sh --all`, then four entries in
`PINNED` order. Each entry: name, description clamped to a measured character budget
with an ellipsis, up to 3 topics, star count, and a relative update age.

Relative age is computed from `pushedAt` **against a date passed in the snapshot**
(`snapshot.fetchedAt`), never `Date.now()`, so renders stay pure and tests
deterministic.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/projects.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/renderers/projects.js widgets-pipeline/test/projects.test.js
git commit -m "feat(widgets): render pinned projects panel"
```

---

### Task 8: CITY frame renderer

**Files:**
- Create: `widgets-pipeline/renderers/city.js`
- Test: `widgets-pipeline/test/city.test.js`

**Interfaces:**
- Consumes: `lib/theme.js`, snapshot `.contributions`.
- Produces: `render(snapshot) -> string`. **Frame only** — contains no 3D geometry and
  no `<image>` reference. It is placed in the README above the existing
  `profile-3d-contrib/profile-gitblock.svg`, which stays untouched.

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/city.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|//)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("contains no embedded or referenced 3D asset", () => {
  const out = render(fixture);
  assert.doesNotMatch(out, /<image/i);
  assert.doesNotMatch(out, /profile-gitblock/);
});

test("shows the three contribution figures", () => {
  const c = fixture.contributions;
  const out = render(fixture);
  assert.ok(out.includes(String(c.total)));
  assert.ok(out.includes(String(c.activeDays)));
  assert.ok(out.includes(String(c.busiestDay)));
  assert.match(out, /CONTRIBUTION CITY/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/city.test.js`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the renderer**

Short panel: header "CONTRIBUTION CITY", large total, "contributions in the last
year", then two small lines "N active days" and "Busiest day: N". Height is
deliberately small (roughly 150px) because the 3D graphic below it supplies the mass.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/city.test.js`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/renderers/city.js widgets-pipeline/test/city.test.js
git commit -m "feat(widgets): render contribution city frame"
```

---

### Task 9: HERO renderer

**Files:**
- Create: `widgets-pipeline/renderers/hero.js`
- Test: `widgets-pipeline/test/hero.test.js`

**Interfaces:**
- Consumes: `lib/theme.js`, `lib/svg.js`, snapshot `.profile` and `.languages`.
- Produces: `render(snapshot) -> string`. Top 5 languages as chips.

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/hero.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+=|javascript:|<foreignObject/i);
});

test("shows the identity block consistent with the name card", () => {
  const out = render(fixture);
  assert.ok(out.includes("Tristan Edgina"));
  assert.ok(out.includes("Telkom University"));
});

test("embeds the avatar as inline data, not a remote URL", () => {
  const out = render(fixture);
  assert.doesNotMatch(out, /<image[^>]*https?:\/\//i);
});

test("survives a null avatar", () => {
  const p = JSON.parse(JSON.stringify(fixture));
  p.profile.avatar_url = null;
  const out = render(p);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<image/i);
});

test("renders zero top-languages without crashing", () => {
  const out = render({ ...fixture, languages: [] });
  assert.match(out, /width="820"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/hero.test.js`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the renderer**

Layout: circular-clipped avatar on the left, identity block on the right (name,
then the same three lines the name card uses: university, interests, status), then a
row of top-language chips.

**Identity source:** the profile API currently returns `name: null` and
`bio: "masih belajar"`, which would contradict the name card. Until the account
owner sets real profile fields, render the identity block from the same constants the
name card uses — export them from `lib/theme.js` as `IDENTITY` so there is one
source of truth. When `profile.name` is non-null, prefer it.

**Avatar (Review Focus 1):** embed as a base64 `data:` URI in an `<image>` with a
`<clipPath>` circle. When `avatar_url` is null or the fetch fails, omit the `<image>`
entirely and render the identity block full-width — never emit a broken image.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/hero.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add widgets-pipeline/renderers/hero.js widgets-pipeline/test/hero.test.js
git commit -m "feat(widgets): render hero identity panel"
```

---

### Task 10: Build all and wire the README

**Files:**
- Modify: `widgets-pipeline/build-all.js` (replace stubs with real renderers)
- Modify: `README.md:8,32,40,59,67,130` (replace the six gitskins tags)
- Modify: `README.md` (fix mojibake and stale project tables)
- Test: `widgets-pipeline/test/readme.test.js`

**Interfaces:**
- Consumes: all six renderers, `data/profile-data.json`.
- Produces: `widgets/{stack,stats,social,projects,city,hero}.svg` and a README with no
  `gitskins.com` reference.

- [ ] **Step 1: Write the failing test**

Create `widgets-pipeline/test/readme.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

test("no gitskins reference remains", () => {
  assert.strictEqual((readme.match(/gitskins\.com/g) || []).length, 0);
});

test("all six self-hosted widgets are referenced", () => {
  for (const n of ["stack", "stats", "social", "projects", "city", "hero"]) {
    assert.ok(readme.includes("./widgets/" + n + ".svg"), "missing " + n);
  }
});

test("the untouched assets are still referenced", () => {
  assert.ok(readme.includes("./ascii-portrait.svg"));
  assert.ok(readme.includes("./ascii-namecard.svg"));
  assert.ok(readme.includes("./profile-3d-contrib/profile-gitblock.svg"));
  assert.ok(readme.includes("streak-stats.demolab.com"));
  assert.ok(readme.includes("skillicons.dev/icons?i="));
});

test("no mojibake in the README", () => {
  assert.strictEqual((readme.match(/\uFFFD/g) || []).length, 0);
});

test("README points at the new pinned projects", () => {
  for (const n of ["opendump-v2", "hobyd-hackathon", "portofolio-websites", "Flying-Fih-Remaster"]) {
    assert.ok(readme.includes(n), "missing " + n);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test widgets-pipeline/test/readme.test.js`
Expected: FAIL — gitskins references still present

- [ ] **Step 3: Wire up build-all and swap the README tags**

Build: `node widgets-pipeline/build-all.js` writes all six SVGs to `widgets/`.

In `README.md`, replace each of the six gitskins `<img>` tags with the matching
`./widgets/<name>.svg`, preserving each tag's existing `width` and writing a
descriptive `alt`:

- L8 hero → `./widgets/hero.svg`, `width="100%"`
- L32 stack → `./widgets/stack.svg`, `width="100%"`
- L40 city → `./widgets/city.svg`, `width="100%"` **immediately above** the existing
  `./profile-3d-contrib/profile-gitblock.svg` image
- L59 stats → `./widgets/stats.svg`, `width="100%"`
- L67 projects → `./widgets/projects.svg`, `width="100%"`
- L130 social → `./widgets/social.svg`, `width="60%"`

While in the file, fix the mojibake (`01 \uFFFD` → `01 ·`, `Pok\uFFFDmon` →
`Pokemon`) and rewrite the project tables to match the four new pins, correcting the
`aim-drill-game-nyahu` language label if that repo is still listed.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test widgets-pipeline/test/readme.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Run the whole suite**

Run: `node --test widgets-pipeline/test/`
Expected: all suites PASS

- [ ] **Step 6: Commit**

```bash
git add widgets widgets-pipeline/build-all.js README.md widgets-pipeline/test/readme.test.js data/profile-data.json
git commit -m "feat(widgets): replace gitskins widgets with self-hosted panels"
```

---

### Task 11: Browser verification at README width

**Files:**
- Create: `widgets-pipeline/test/visual-check.js`

**Interfaces:**
- Consumes: the six generated `widgets/*.svg`.
- Produces: a screenshot per widget at 820px, for human review. Not committed as
  binary — this is a verification step, and the artifacts are transient.

- [ ] **Step 1: Serve and render each widget at 820px**

For each of the six, load it in a browser at exactly 820px wide, confirm:

- it renders as an **image**, not a download and not a blank box
- the natural size reported by the browser is `820 x <h>`
- text is legible at that size (no sub-8px type)
- the panel chrome matches `ascii-namecard.svg` (same background, radius, dots)

Capture a screenshot per widget with the viewport scrolled to it.

- [ ] **Step 2: Verify each capture is distinct and correct**

Compare each screenshot against the old gitskins rendering for the same section.
Confirm the data shown matches `data/profile-data.json`, and specifically that no
"Pro preview" banner appears anywhere.

- [ ] **Step 3: Fix any layout defect found**

Expect at least one: text overflowing its panel, a bar extending past the border, or
a panel taller than its content needs. Fix in the owning renderer and re-run that
renderer's test plus Step 1.

- [ ] **Step 4: Commit any fixes**

```bash
git add widgets README.md widgets-pipeline
git commit -m "fix(widgets): correct layout defects found in browser review"
```

---

### Task 12: Daily refresh workflow

**Files:**
- Create: `.github/workflows/profile-widgets.yml`
- Test: none (verified by a manual dispatch run)

**Interfaces:**
- Consumes: `fetch-data.js`, `build-all.js`, committed `widgets/`.
- Produces: fresh `data/profile-data.json` and `widgets/*.svg` on a daily schedule.

- [ ] **Step 1: Write the workflow**

Mirror the structure of the existing `profile-3d.yml` (checkout, configure git,
commit only if changed). Key points:

- `on: schedule` with a cron that does not collide with `profile-3d.yml`'s `0 18 * * *`
- `on: workflow_dispatch` so it can be run by hand
- `permissions: contents: write`
- `GITHUB_TOKEN` exposed to the fetch step
- **Review Focus 5:** stage, then `if ! git diff --cached --quiet; then commit; fi`
  so an unchanged run produces no commit

- [ ] **Step 2: Verify the workflow parses**

Run: `gh workflow list` and confirm `profile-widgets` appears.
If unavailable locally, validate the YAML parses with
`node -e "require('yaml')" `-free check: `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/profile-widgets.yml'))"`.

- [ ] **Step 3: Run it manually**

Run: `gh workflow run profile-widgets.yml`
Then: `gh run watch`
Expected: success. Confirm it either committed fresh output or correctly reported no
changes.

- [ ] **Step 4: Confirm the existing 3D workflow is untouched**

Run: `git log --oneline -3 -- .github/workflows/profile-3d.yml`
Expected: no new commit from this work touches it.

- [ ] **Step 5: Remove the malformed duplicate workflow file**

Pre-existing defect found during planning, not caused by this work: a copy of the 3D
workflow exists at a malformed nested path.

```bash
git rm ".github/workflows/.github/workflows/profile-3d.yml"
```

This file is tracked but has no effect (GitHub only reads `.github/workflows/*.yml`
directly). Confirm the real workflow survives:

```bash
git ls-files ".github/" && gh workflow list
```

Expected: `profile-3d` and `profile-widgets` both still listed. If removing the file
disturbs either, restore it and leave the defect for a separate change.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/profile-widgets.yml
git commit -m "ci(widgets): refresh profile widgets daily"
```

- [ ] **Step 7: Commit the duplicate-file cleanup separately**

Removing it in its own commit keeps the history clean and makes the cleanup trivially
revertable if it turns out to matter:

```bash
git rm ".github/workflows/.github/workflows/profile-3d.yml"
git commit -m "chore: remove malformed duplicate workflow file"
```

---

### Task 13: Final verification and push

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Run the complete suite**

Run: `node --test widgets-pipeline/test/`
Expected: every suite passes.

- [ ] **Step 2: Confirm no gitskins dependency remains**

Run: `grep -ri gitskins README.md widgets/ data/ widgets-pipeline/ || echo "clean"`
Expected: `clean`

- [ ] **Step 3: Confirm the untouched assets are byte-identical**

The non-goals list is a hard constraint, not a preference. Verify no commit from this
work has modified any of them:

```bash
git log --oneline 6183c5c..HEAD -- ascii-portrait.svg ascii-namecard.svg profile-3d-contrib/ .github/workflows/profile-3d.yml
```

Expected: **empty output** — no commit in this range touches those paths. If anything
appears, revert that file before pushing.

Also confirm `streak-stats.demolab.com` and `skillicons.dev/icons?i=` are still
present in the README (Task 10's test covers this, but re-check after any late edit).

- [ ] **Step 4: Verify live**

Push, then load `https://github.com/masterdorime/masterdorime` and confirm all six
widgets render from `./widgets/`, with no banner, and the portrait, name card, city
asset, streak card and icon row all still present and unchanged.

- [ ] **Step 5: Push**

```bash
git push origin main
```

Verify the ref-update line. Note GitHub writes progress to stderr, so a
`NativeCommandError` in PowerShell can still mean success.

