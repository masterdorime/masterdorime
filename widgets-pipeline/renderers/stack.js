// STACK widget: the top five languages by byte weight.
//
// Pure: same snapshot in, byte-identical SVG out. No clock, no randomness.

const { COLORS, PANEL, WIDTH, esc, panel } = require("../lib/theme.js");
const { bar } = require("../lib/svg.js");

const TOP_N = 5;
const PAD = PANEL.pad;
const ROW_H = 34;
const HEAD_Y = 62;
const FIRST_ROW_Y = 108;
const BAR_X = 200;
const BAR_W = 480;
const BAR_H = 10;
const NAME_X = PAD;
const PCT_X = WIDTH - PAD;

// Bar colour cycles so five rows stay distinguishable without ever leaving
// the aurora palette.
const BAR_COLORS = [
  COLORS.accent,
  COLORS.accentAlt,
  COLORS.accentCool,
  COLORS.body,
  COLORS.muted,
];

function render(snapshot) {
  const langs = (snapshot.languages || []).slice(0, TOP_N);

  const rows = langs
    .map((l, i) => {
      const y = FIRST_ROW_Y + i * ROW_H;
      const color = BAR_COLORS[i % BAR_COLORS.length];
      return [
        `  <text class="lang-name" x="${NAME_X}" y="${y}" font-size="13.5" fill="${COLORS.body}" fill-opacity="0.92">${esc(l.name)}</text>`,
        bar(BAR_X, y - BAR_H + 3, BAR_W, l.pct, color, BAR_H),
        `  <text x="${PCT_X}" y="${y}" font-size="13.5" text-anchor="end" fill="${COLORS.accent}">${esc(l.pct)}%</text>`,
      ].join("\n");
    })
    .join("\n");

  // Height derives from the row count so an empty snapshot still yields a
  // sane panel rather than a fixed 820xN box with dead space.
  const bodyBottom = FIRST_ROW_Y + Math.max(langs.length, 1) * ROW_H;
  const height = bodyBottom + 12;

  const summary = langs.length
    ? langs.map((l) => `${l.name} ${l.pct}%`).join(", ")
    : "no language data available";

  const inner = [
    `  <title id="ttl">Language stack</title>`,
    `  <desc id="dsc">Byte-weighted language mix across public repositories: ${esc(summary)}.</desc>`,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="15" letter-spacing="1.4" fill="${COLORS.accent}">LANGUAGE STACK</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">&gt; stack.scan</text>`,
    rows,
  ].join("\n");

  return panel(inner, height);
}

module.exports = { render };
