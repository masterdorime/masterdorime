const test = require("node:test");
const assert = require("node:assert");
const theme = require("../lib/theme.js");
const svg = require("../lib/svg.js");

test("panel width is exactly the README column width", () => {
  assert.strictEqual(theme.WIDTH, 820);
});

test("panel emits a self-contained svg at the fixed width", () => {
  const out = theme.panel("<text>hi</text>", 100);
  assert.match(out, /<svg[^>]*width="820"/);
  assert.match(out, /viewBox="0 0 820 100"/);
  assert.match(out, /role="img"/);
  // The xmlns declaration is the required SVG namespace, not a fetch. Ban every
  // way a self-contained SVG could reach the network instead: scripts, inline
  // handlers, javascript: URLs, foreignObject, and external href/src references.
  assert.doesNotMatch(out, /<script|on[a-z]+\s*=|javascript:|<foreignObject/i);
  assert.doesNotMatch(out, /(?:href|src)\s*=\s*["']https?:/i);
  assert.doesNotMatch(out, /url\(\s*["']?https?:/i);
});

test("esc escapes the five xml-significant characters", () => {
  assert.strictEqual(svg.esc(`<a & b "c" 'd'>`), "&lt;a &amp; b &quot;c&quot; &#39;d&#39;&gt;");
});

test("bar width is proportional to percentage", () => {
  const half = svg.bar(0, 0, 100, 50, "#5eead4");
  assert.match(half, /width="50/);
});

test("bar clamps out-of-range percentages", () => {
  assert.match(svg.bar(0, 0, 100, 150, "#5eead4"), /width="100/);
  assert.match(svg.bar(0, 0, 100, -20, "#5eead4"), /width="0/);
});
