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
