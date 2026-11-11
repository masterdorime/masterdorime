// Isometric cube geometry for the contribution city.
//
// Pure maths: no knowledge of GitHub, the snapshot, or the panel. Kept separate
// from the renderer so the shape can be tested without drawing anything, and so
// a layout change cannot accidentally alter the shading model.
//
// The geometry is not invented — it is decoded from the asset this replaces
// (profile-3d-contrib/profile-night-green.svg). One cube is a group holding
// three rects:
//
//   top    skewY(-30) skewX(40.89) scale(1 1.15)     18 x 18
//   left   skewY(30) scale(1 1.15)                   18 x height
//   right  translate(18 10.39) skewY(-30) scale(1 1.15)  18 x height
//
// The left and right face heights carry the skyline: a heavier day is a taller
// tower. That is the whole effect that makes this read as a city.

const { COLORS } = require("./theme.js");

// Base unit of the original asset. Everything scales from these numbers so the
// isometric angle and cube proportions are preserved at any size.
const UNIT = 18;
const RISE = 10.39;
const TOP_H = 18;

// Tower heights per level, in original units. Level 0 is zero: an empty day is
// a flat floor tile, so 311 empty days recede and the 58 active ones read as a
// skyline rather than as a field of stubble.
const HEIGHTS = [0, 7, 16, 30, 52];

// Thresholds are fixed constants, not data-derived quartiles. A personal best
// must not silently redraw every other cube in the grid.
const THRESHOLDS = [1, 3, 7, 15]; // count >= threshold[i] -> level i+1

// Aurora ramp. Each level needs three distinct shades so the cubes keep their
// 3D lighting; the top is brightest (it catches the light), then left, then
// right.
const RAMP = [
  { top: "#16302f", left: "#0f2323", right: "#0a1a1a" }, // 0 — ground plane
  { top: "#1f5b57", left: "#174743", right: "#113634" }, // 1 — low
  { top: "#2dd4bf", left: "#22a396", right: "#1a7d73" }, // 2 — moderate
  { top: "#5eead4", left: "#47b8a7", right: "#358a7e" }, // 3 — high
  { top: "#22d3ee", left: "#1aa5bb", right: "#14788a" }, // 4 — highest
];

// Contribution count -> level 0..4, clamped. More contributions never lower the
// level, and anything past the top threshold saturates rather than stretching
// the ramp.
function levelFor(count) {
  const c = Number(count) || 0;
  if (c <= 0) return 0;
  let level = 1;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (c >= THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

function clampLevel(level) {
  const l = Math.round(Number(level) || 0);
  return Math.max(0, Math.min(HEIGHTS.length - 1, l));
}

// Tower height in original units for a level.
function heightFor(level) {
  return HEIGHTS[clampLevel(level)];
}

// The three face shades for a level.
function shadeFor(level) {
  return RAMP[clampLevel(level)];
}

const r2 = (n) => Math.round(n * 100) / 100;

// cube(x, y, level, scale) -> one isometric cube as SVG.
//
// `scale` multiplies every dimension together, so shrinking the grid to fit the
// panel width never distorts the cube or changes the isometric angle.
function cube(x, y, level, scale = 1) {
  const s = Number(scale) || 1;
  const lv = clampLevel(level);
  const h = heightFor(lv);
  const shades = shadeFor(lv);

  const unit = r2(UNIT * s);
  const rise = r2(RISE * s);
  const topH = r2(TOP_H * s);
  const faceH = r2(h * s);
  const tx = r2(Number(x) || 0);
  const ty = r2(Number(y) || 0);

  const parts = [
    `  <g transform="translate(${tx} ${ty})">`,
    `    <rect width="${unit}" height="${topH}" transform="skewY(-30) skewX(40.89) scale(1 1.15)" fill="${shades.top}"/>`,
  ];

  // A flat tile needs no sides. Emitting zero-height rects would still be three
  // nodes but draws nothing, so skip them for level 0 rather than clutter the
  // output — the top face alone is the floor.
  if (faceH > 0) {
    parts.push(
      `    <rect width="${unit}" height="${faceH}" transform="skewY(30) scale(1 1.15)" fill="${shades.left}"/>`,
      `    <rect width="${unit}" height="${faceH}" transform="translate(${unit} ${rise}) skewY(-30) scale(1 1.15)" fill="${shades.right}"/>`
    );
  }

  parts.push("  </g>");
  return parts.join("\n");
}

module.exports = {
  cube,
  levelFor,
  heightFor,
  shadeFor,
  UNIT,
  RISE,
  TOP_H,
  HEIGHTS,
  THRESHOLDS,
  RAMP,
};
