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
