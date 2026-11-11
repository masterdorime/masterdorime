const test = require("node:test");
const assert = require("node:assert");
const fixture = require("../fixtures/snapshot.json");
const { render } = require("../renderers/stack.js");

test("renders a self-contained svg at the fixed width", () => {
  const out = render(fixture);
  assert.match(out, /width="820"/);
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*"(?:https?|\/\/)/i);
  assert.doesNotMatch(out, /url\(https?:/i);
});

test("shows at most five languages", () => {
  const names = [...render(fixture).matchAll(/class="lang-name"[^>]*>([^<]+)</g)]
    .map(m => m[1]);
  assert.ok(names.length <= 5, "got " + names.length);
  assert.ok(names.includes("ShaderLab"));
});

test("describes itself from the rendered data", () => {
  const out = render(fixture);
  const desc = (out.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [])[1] || "";
  assert.match(desc, /ShaderLab/);
  assert.ok(desc.length > 20);
});

test("survives a snapshot with no languages", () => {
  const out = render({ ...fixture, languages: [] });
  assert.match(out, /width="820"/);
});
