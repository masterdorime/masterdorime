const test = require("node:test");
const assert = require("node:assert");
const iso = require("../lib/iso.js");

test("a cube emits exactly three faces", () => {
  const out = iso.cube(0, 0, 1, 1);
  const rects = (out.match(/<rect/g) || []).length;
  assert.strictEqual(rects, 3, "expected top/left/right, got " + rects);
});

test("cube faces keep the isometric transforms", () => {
  const out = iso.cube(0, 0, 1, 1);
  assert.match(out, /skewY\(-30\) skewX\(40\.89\) scale\(1 1\.15\)/, "top face transform");
  assert.match(out, /skewY\(30\) scale\(1 1\.15\)/, "left face transform");
  assert.match(out, /translate\(18 10\.39\) skewY\(-30\) scale\(1 1\.15\)/, "right face transform");
});

test("height grows monotonically with level", () => {
  const hs = [1, 2, 3, 4].map((lv) => iso.heightFor(lv));
  for (let i = 1; i < hs.length; i++) {
    assert.ok(hs[i] > hs[i - 1], `level ${i + 1} (${hs[i]}) is not taller than level ${i} (${hs[i - 1]})`);
  }
});

test("level 0 is a flat floor tile, not a tower", () => {
  assert.strictEqual(iso.heightFor(0), 0, "level 0 must have zero height so the ground reads flat");
});

test("levels above the top clamp instead of scaling the ramp", () => {
  assert.strictEqual(iso.heightFor(99), iso.heightFor(4));
  assert.strictEqual(iso.cube(0, 0, 99, 1), iso.cube(0, 0, 4, 1));
});

test("shades differ per level and per face", () => {
  const a = iso.shadeFor(1);
  const b = iso.shadeFor(2);
  assert.notStrictEqual(a.top, b.top, "level 1 and 2 top faces must not look the same");
  assert.strictEqual(new Set([a.top, a.left, a.right]).size, 3, "three faces need three distinct shades");
});

test("scale shrinks every dimension together", () => {
  const full = iso.heightFor(2) * 1;
  const half = iso.heightFor(2) * 0.5;
  assert.ok(Math.abs(half - full * 0.5) < 1e-9);
  // And the emitted geometry honours it: the left face height must halve.
  const leftH = (svg, face) => {
    const m = svg.match(new RegExp(`height="([\\d.]+)" transform="${face}"`));
    return m ? Number(m[1]) : NaN;
  };
  const atFull = leftH(iso.cube(0, 0, 2, 1), "skewY\\(30\\) scale\\(1 1\\.15\\)");
  const atHalf = leftH(iso.cube(0, 0, 2, 0.5), "skewY\\(30\\) scale\\(1 1\\.15\\)");
  assert.ok(Math.abs(atHalf - atFull * 0.5) < 0.02, `left face did not scale: ${atFull} -> ${atHalf}`);
});

test("count maps to a level, capped at 4", () => {
  assert.strictEqual(iso.levelFor(0), 0);
  assert.strictEqual(iso.levelFor(1), 1);
  assert.strictEqual(iso.levelFor(1000), 4);
  let prev = 0;
  for (const c of [0, 1, 2, 3, 5, 8, 13, 21, 40]) {
    const l = iso.levelFor(c);
    assert.ok(l >= prev, "level went backwards at count " + c);
    prev = l;
  }
});

test("the night palette keeps level 0 dimmer than level 1", () => {
  // Level 0 is the ground plane: it must recede, or 311 empty days would
  // dominate the 58 that carry the story.
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
  };
  assert.ok(lum(iso.shadeFor(0).top) < lum(iso.shadeFor(1).top), "level 0 is not dimmer than level 1");
});
