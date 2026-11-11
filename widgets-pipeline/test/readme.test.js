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
