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
  assert.doesNotMatch(out, /\uFFFD/);
  assert.doesNotMatch(out, /<script/i);
});

// A description containing an astral character (emoji) straddling the clamp
// boundary must not be sliced into a lone surrogate. Repo descriptions are
// arbitrary third-party text, so this is reachable with real data.
test("clamping never splits a surrogate pair", () => {
  const emoji = "\u{1F600}"; // U+1F600, two UTF-16 code units
  const long = "x".repeat(77) + emoji + "tail";
  const s = JSON.parse(JSON.stringify(fixture));
  const r = s.repos.find((x) => x.name === "portofolio-websites");
  r.description = long;
  const out = render(s);
  assert.doesNotMatch(out, /\uFFFD/, "clamp produced a broken character");
  // A lone surrogate would also survive as an invalid XML character.
  assert.doesNotMatch(out, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/, "lone high surrogate");
});

test("a null description becomes an explicit placeholder", () => {
  const out = render(fixture);
  // Must match the placeholder itself, not the header "> ./projects.sh --all",
  // which also contains "--" and would make this assertion vacuous.
  assert.match(out, /-- no description --/);
});

test("a pinned repo missing from the snapshot keeps its slot", () => {
  const s = JSON.parse(JSON.stringify(fixture));
  s.repos = s.repos.filter((r) => r.name !== "hobyd-hackathon");
  const out = render(s);
  assert.match(out, /-- repository not found --/, "missing pin was silently dropped");
  for (const n of PINNED) assert.ok(out.includes(n), "pin " + n + " no longer listed");
});

test("opendump-v2 is described as pre-alpha, not as a finished tool", () => {
  // The repo says the scanner, executor and Tauri shell are not built yet, and
  // the panel must not imply otherwise. Assert on the DESCRIPTION line: the
  // topic chips also contain "#pre-alpha", so a bare /pre-alpha/ match would
  // pass even if the description itself said "shipped".
  const out = render(fixture);
  const descLines = [...out.matchAll(/<text[^>]*font-size="12\.5"[^>]*>([^<]*)<\/text>/g)]
    .map((m) => m[1]);
  const opendump = descLines.find((l) => /Rust core/i.test(l));
  assert.ok(opendump, "opendump description line not found");
  assert.match(opendump, /pre-alpha/i, "description does not state pre-alpha: " + opendump);
});

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
});
