const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

test("no gitskins reference remains", () => {
  assert.strictEqual((readme.match(/gitskins\.com/g) || []).length, 0);
});

test("all seven self-hosted widgets are referenced", () => {
  for (const n of ["stack", "stats", "social", "projects", "city", "city-3d", "hero"]) {
    assert.ok(readme.includes("./widgets/" + n + ".svg"), "missing " + n);
  }
});

test("the untouched assets are still referenced", () => {
  assert.ok(readme.includes("./ascii-portrait.svg"));
  assert.ok(readme.includes("./ascii-namecard.svg"));
  assert.ok(readme.includes("streak-stats.demolab.com"));
  assert.ok(readme.includes("skillicons.dev/icons?i="));
});

test("the third-party 3D city is no longer referenced", () => {
  assert.ok(!readme.includes("profile-3d-contrib"), "README still points at profile-3d-contrib");
  assert.ok(!readme.includes("yoshi389111"), "README still points at the third-party action");
});

test("no mojibake in the README", () => {
  assert.strictEqual((readme.match(/\uFFFD/g) || []).length, 0);
});

test("README points at the new pinned projects", () => {
  for (const n of ["opendump-v2", "hobyd-hackathon", "portofolio-websites", "Flying-Fih-Remaster"]) {
    assert.ok(readme.includes(n), "missing " + n);
  }
});
