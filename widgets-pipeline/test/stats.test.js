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
  // Match the metric VALUE node (font-size 34), not any occurrence of the
  // digits: "12" also appears as font-size="12" in the header, which made an
  // earlier version of this assertion pass with the metric deleted.
  const values = [...out.matchAll(/<text[^>]*font-size="34"[^>]*>([^<]*)<\/text>/g)]
    .map((m) => m[1]);
  assert.ok(values.includes(String(fixture.contributions.total)), "contributions value missing: " + values);
  assert.ok(values.includes(String(fixture.profile.public_repos)), "repos value missing: " + values);
  assert.ok(values.includes(String(fixture.profile.followers)), "followers value missing: " + values);
});

test("renders zero honestly rather than blanking", () => {
  const zeroed = JSON.parse(JSON.stringify(fixture));
  zeroed.profile.followers = 0;
  zeroed.contributions.total = 0;
  const out = render(zeroed);
  assert.match(out, />0</);
});
