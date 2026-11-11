// CITY widget: a short header frame for the 3D contribution city.
//
// Pure: same snapshot in, byte-identical SVG out. No clock, no randomness.
//
// Frame only. The 3D geometry is drawn by city3d.js into widgets/city-3d.svg and
// placed directly below this panel; this supplies the labels and totals, so the
// two read as one block. It deliberately contains no <image> reference and no
// geometry of its own — the test suite pins that.
//
// Both panels read the same snapshot, so their numbers cannot drift apart. That
// was the defect that prompted this whole rebuild: a frame saying one total
// above an image saying another.

const { COLORS, PANEL, WIDTH, esc, panel } = require("../lib/theme.js");

const PAD = PANEL.pad;
const HEAD_Y = 62;
const TOTAL_Y = 136;
const UNIT_Y = 162;
const SUB_Y = 196;

const n = (v) => Number(v || 0).toLocaleString("en-US");

function render(snapshot) {
  const c = snapshot.contributions || {};

  // Small figures on one line, separated only when present.
  const subs = [
    `${n(c.activeDays)} ${Number(c.activeDays) === 1 ? "active day" : "active days"}`,
    `Busiest day: ${n(c.busiestDay)}`,
  ].join("  ·  ");

  const height = 214;

  // "ALL ACTIVITY" is the scope label. It is accurate: this total comes from the
  // GraphQL contribution calendar for the authenticated owner, and it is the
  // same figure the panels below show. It previously had to disambiguate from a
  // third-party city that counted differently; that city is gone, but the label
  // still tells a reader what is being counted, so it stays.
  const desc =
    `All contribution activity in the last year: ${n(c.total)} contributions ` +
    `across ${n(c.activeDays)} active days, busiest day ${n(c.busiestDay)}.`;

  const inner = [
    `  <title id="ttl">Contribution city</title>`,
    `  <desc id="dsc">${esc(desc)}</desc>`,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="15" letter-spacing="1.4" fill="${COLORS.accent}">CONTRIBUTION CITY</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">&gt; city.render --3d</text>`,
    `  <text x="${WIDTH / 2}" y="${TOTAL_Y}" font-size="40" text-anchor="middle" fill="${COLORS.accentCool}">${esc(n(c.total))}</text>`,
    `  <text x="${WIDTH / 2}" y="${UNIT_Y}" font-size="12" letter-spacing="1.2" text-anchor="middle" fill="${COLORS.muted}" fill-opacity="0.9">CONTRIBUTIONS, ALL ACTIVITY</text>`,
    `  <text x="${WIDTH / 2}" y="${SUB_Y}" font-size="11.5" text-anchor="middle" fill="${COLORS.dim}">${esc(subs)}</text>`,
  ].join("\n");

  return panel(inner, height);
}

module.exports = { render };
