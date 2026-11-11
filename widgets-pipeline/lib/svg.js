// Layout primitives for generated profile widgets.
//
// Pure string builders. No I/O, no clock, no randomness — a renderer given the
// same input must emit byte-identical output so the daily Action can diff it.

const { COLORS } = require("./theme.js");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// bar(x, y, w, pct, color) -> a track rect plus a value rect.
// pct is clamped to 0..100. Value width is (w * pct / 100), rounded to 2dp so
// the output stays stable across platforms.
function bar(x, y, w, pct, color, height = 8) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  const valueW = Math.round(((w * p) / 100) * 100) / 100;
  return [
    `    <rect x="${x}" y="${y}" width="${w}" height="${height}" rx="${height / 2}" fill="${COLORS.track}"/>`,
    `    <rect x="${x}" y="${y}" width="${valueW}" height="${height}" rx="${height / 2}" fill="${color}"/>`,
  ].join("\n");
}

module.exports = { esc, bar };
