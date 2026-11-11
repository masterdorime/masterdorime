const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/city.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|\/\/)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("contains no embedded or referenced 3D asset", () => {
  const out = render(fixture);
  assert.doesNotMatch(out, /<image/i);
  assert.doesNotMatch(out, /profile-gitblock/);
});

test("shows the three contribution figures", () => {
  const c = fixture.contributions;
  const out = render(fixture);
  assert.ok(out.includes(String(c.total)));
  assert.ok(out.includes(String(c.activeDays)));
  assert.ok(out.includes(String(c.busiestDay)));
  assert.match(out, /CONTRIBUTION CITY/);
});
