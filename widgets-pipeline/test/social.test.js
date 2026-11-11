const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/social.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("shows the login handle with an at-sign", () => {
  assert.ok(render(fixture).includes("@" + fixture.profile.login));
});

test("the handle is a link to the profile", () => {
  const out = render(fixture);
  assert.match(out, /<a [^>]*href="https:\/\/github\.com\/masterdorime/);
});
