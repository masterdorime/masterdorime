const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/stats.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|\/\/)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("shows all four metrics", () => {
  const out = render(fixture);
  // Labels are rendered uppercase; match case-insensitively so the assertion
  // tests presence of the metric, not its casing.
  const hay = out.toLowerCase();
  for (const label of ["Stars", "Contributions", "Repos", "Followers"]) {
    assert.ok(hay.includes(label.toLowerCase()), "missing " + label);
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
