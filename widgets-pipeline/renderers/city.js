// CITY widget: a short header frame for the 3D contribution city.
//
// Pure: same snapshot in, byte-identical SVG out. No clock, no randomness.
//
// Frame only. The 3D geometry is generated separately by profile-3d.yml into
// profile-3d-contrib/profile-gitblock.svg and stays untouched; this panel sits
// directly above that image and supplies the labels and totals, so the two
// read as one block. It deliberately contains no <image> reference and no
// geometry of its own — the test suite pins that.

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
    `${n(c.activeDays)} active days`,
    `Busiest day: ${n(c.busiestDay)}`,
  ].join("  ·  ");

  const height = 214;

  // Scope label matters: the 3D city rendered below this frame is produced by
  // a separate action that counts by its own rule and window, and the two
  // totals do NOT match (530 here vs 396 there). Saying "all activity" makes
  // the frame self-describing, so a viewer comparing the two numbers sees two
  // deliberately different measures rather than a contradiction.
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
