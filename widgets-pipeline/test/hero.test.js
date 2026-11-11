const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/hero.js");

test("renders self-contained svg at fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
});

test("shows the identity block consistent with the name card", () => {
  const out = render(fixture);
  assert.ok(out.includes("Tristan Edgina"));
  assert.ok(out.includes("Telkom University"));
});

test("embeds the avatar as inline data, not a remote URL", () => {
  const out = render(fixture);
  // Assert the image is actually present AND inline. Asserting only "no remote
  // URL" passes vacuously when no image is emitted at all, which is how a
  // broken avatar path slipped through once already.
  assert.match(out, /<image href="data:image\/png;base64,[A-Za-z0-9+/=]+"/);
  assert.doesNotMatch(out, /<image[^>]*https?:\/\//i);
});

test("survives a null avatar", () => {
  const p = JSON.parse(JSON.stringify(fixture));
  p.profile.avatar_url = null;
  const out = render(p);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<image/i);
});

test("renders zero top-languages without crashing", () => {
  const out = render({ ...fixture, languages: [] });
  assert.match(out, /width="820"/);
});
