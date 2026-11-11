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

// One scan across every generated widget, rather than trusting each renderer's
// own suite: three of the per-renderer tests were weaker than they looked.
test("every widget is self-contained and accessible", () => {
  const out = buildAll(fixture);
  for (const [name, svg] of Object.entries(out)) {
    assert.doesNotMatch(svg, /<script/i, name + ": script");
    assert.doesNotMatch(svg, /<foreignObject/i, name + ": foreignObject");
    assert.doesNotMatch(svg, /javascript:/i, name + ": javascript: URI");
    assert.doesNotMatch(svg, /\son[a-z]+\s*=/i, name + ": inline handler");
    assert.doesNotMatch(svg, /url\(\s*["']?https?:/i, name + ": remote url()");
    assert.match(svg, /<svg[^>]*width="820"/, name + ": wrong natural width");
    assert.match(svg, /role="img"/, name + ": no role");
    assert.match(svg, /<title[^>]*>[^<]+<\/title>/, name + ": no title");
    assert.match(svg, /<desc[^>]*>[^<]+<\/desc>/, name + ": no desc");
    assert.doesNotMatch(svg, /\uFFFD/, name + ": broken character");
  }
});

test("only the social panel carries external links, and only the known ones", () => {
  const out = buildAll(fixture);
  for (const [name, svg] of Object.entries(out)) {
    const hrefs = [...svg.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]);
    if (name === "social") {
      // Bounded on purpose: these come straight from API data, so an unbounded
      // count would be an unbounded external surface.
      assert.ok(hrefs.length <= 3, "social has " + hrefs.length + " external links");
      for (const h of hrefs) {
        assert.match(h, /^https:\/\/(github\.com\/masterdorime|tristanedgina-portofolio\.vercel\.app|twitter\.com\/tristanerdd)/,
          "unexpected social link: " + h);
      }
    } else {
      assert.strictEqual(hrefs.length, 0, name + " has an external href: " + hrefs.join(", "));
    }
  }
});

test("the fixture's day series agrees with its own total", () => {
  // Guards the invariant against REAL data, not just the hand-built synthetic
  // input in fetch-data.test.js (which starts from agreement and therefore
  // cannot detect a live API that disagrees).
  const sum = fixture.contributions.days.reduce((s, d) => s + d.count, 0);
  assert.strictEqual(sum, fixture.contributions.total,
    "fixture days sum " + sum + " != total " + fixture.contributions.total);
});
