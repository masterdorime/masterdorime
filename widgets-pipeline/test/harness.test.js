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

test("buildAll returns all seven widgets", () => {
  const out = buildAll(fixture);
  assert.deepStrictEqual(
    Object.keys(out).sort(),
    ["city", "city-3d", "hero", "projects", "social", "stack", "stats"]
  );
});

test("no widget falls back to the placeholder panel", () => {
  // The stub exists so the harness works before a renderer is written, but a
  // stub shipping to the README is a silent failure: it renders as an empty
  // box. This nearly happened because "city-3d" did not match "city3d.js".
  const out = buildAll(fixture);
  for (const [name, svg] of Object.entries(out)) {
    assert.doesNotMatch(svg, /not yet implemented/, name + " is still a stub");
  }
});
