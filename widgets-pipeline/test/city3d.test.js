const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/city3d.js");
const iso = require("../lib/iso.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|\/\/)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("carries accessibility attributes and a derived description", () => {
  const out = render(fixture);
  assert.match(out, /role="img"/);
  const desc = (out.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [])[1] || "";
  assert.match(desc, /53 weeks|day/i);
  assert.ok(desc.length > 20, "desc too short: " + JSON.stringify(desc));
});

test("draws one cube per day in the series", () => {
  const out = render(fixture);
  const days = fixture.contributions.days.length;
  const groups = (out.match(/<g transform="translate\(/g) || []).length;
  assert.strictEqual(groups, days, `expected ${days} cubes, got ${groups}`);
});

test("the city total matches the snapshot total", () => {
  // The regression guard for the defect that started this work: a frame saying
  // one number above a city saying another. The renderer derives its own figures
  // from the same series, so they cannot drift.
  const out = render(fixture);
  const desc = (out.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [])[1] || "";
  assert.ok(
    desc.includes(String(fixture.contributions.total)),
    `desc must state ${fixture.contributions.total}; got ${JSON.stringify(desc)}`
  );
});

test("active days are visibly taller than empty days", () => {
  const active = render({ ...fixture, contributions: {
    ...fixture.contributions,
    days: [{ date: "2026-01-01", count: 9 }, { date: "2026-01-02", count: 0 }],
  }});
  // Count cube faces only: the panel chrome adds its own rects, so counting all
  // <rect> would be measuring the wrong thing.
  const tops = (active.match(/skewY\(-30\) skewX\(40\.89\)/g) || []).length;
  const sides = (active.match(/skewY\(30\) scale/g) || []).length;
  assert.strictEqual(tops, 2, "expected 2 floor/top faces, got " + tops);
  assert.strictEqual(sides, 1, "expected exactly 1 tower with sides, got " + sides);
});

test("buildings rise above the ground plane, not below it", () => {
  // The city read as upside down once: side faces were drawn downward from the
  // cube's origin, so towers hung under the grid. A tower's translate y must be
  // ABOVE its own ground line, i.e. smaller than the y of a flat tile in the
  // same grid slot. Compare one active and one empty day drawn at the same
  // position by rendering each alone.
  const yOf = (count) => {
    const svg = render({ ...fixture, contributions: {
      ...fixture.contributions,
      days: [{ date: "2026-01-01", count }],
    }});
    const m = svg.match(/<g transform="translate\(([-\d.]+) ([-\d.]+)\)">/);
    assert.ok(m, "no cube emitted");
    return Number(m[2]);
  };

  const flatY = yOf(0);
  const tallY = yOf(9);
  assert.ok(
    tallY < flatY,
    `tower must rise: flat cube y=${flatY}, tower y=${tallY} (tower should be smaller)`
  );
  // And the lift must equal the tower's height, so the base stays on the grid.
  const lift = flatY - tallY;
  assert.ok(Math.abs(lift - iso.heightFor(iso.levelFor(9)) * 1) < 30,
    "lift " + lift + " does not match the tower height");
});

test("an empty series still produces a valid panel", () => {
  const out = render({ ...fixture, contributions: { total: 0, activeDays: 0, busiestDay: 0, days: [] } });
  assert.match(out, /width="820"/);
  assert.match(out, /role="img"/);
});

test("survives a snapshot with no contributions key at all", () => {
  const out = render({ profile: {}, languages: [], repos: [] });
  assert.match(out, /width="820"/);
});

test("does not embed or reference the old 3D asset", () => {
  const out = render(fixture);
  assert.doesNotMatch(out, /<image/i);
  assert.doesNotMatch(out, /profile-gitblock/);
});
