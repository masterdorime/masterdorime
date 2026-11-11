// STATS widget: four headline figures.
//
// Pure: same snapshot in, byte-identical SVG out. No clock, no randomness.
//
// Note on honesty: at this scale (0 stars, 1 follower) the numbers are small.
// They are printed truthfully with no padding or invented context — a "0" is
// a real figure, not an empty state to be hidden, and the test suite pins
// that behaviour so a later refactor cannot quietly drop it.

const { COLORS, PANEL, WIDTH, esc, panel } = require("../lib/theme.js");

const PAD = PANEL.pad;
const HEAD_Y = 62;
const VALUE_Y = 126;
const LABEL_Y = 150;
const SUBLABEL_Y = 184;
const COL_W = (WIDTH - PAD * 2) / 4;

const n = (v) => Number(v || 0).toLocaleString("en-US");

function render(snapshot) {
  const p = snapshot.profile || {};
  const c = snapshot.contributions || {};

  // Stars summed across the repos actually present in the snapshot.
  const stars = (snapshot.repos || []).reduce((sum, r) => sum + (r.stars || 0), 0);

  const metrics = [
    { label: "Stars", value: n(stars) },
    { label: "Contributions", value: n(c.total) },
    { label: "Repos", value: n(p.public_repos) },
    { label: "Followers", value: n(p.followers) },
  ];

  const cols = metrics
    .map((m, i) => {
      const cx = PAD + i * COL_W + COL_W / 2;
      return [
        `  <text x="${cx}" y="${VALUE_Y}" font-size="34" text-anchor="middle" fill="${COLORS.accent}">${esc(m.value)}</text>`,
        `  <text x="${cx}" y="${LABEL_Y}" font-size="11.5" letter-spacing="1.2" text-anchor="middle" fill="${COLORS.muted}" fill-opacity="0.9">${esc(m.label.toUpperCase())}</text>`,
      ].join("\n");
    })
    .join("\n");

  const height = 214;

  const desc =
    `Live GitHub figures: ${stars} stars across ${n(p.public_repos)} public ` +
    `repositories, ${n(c.total)} contributions in the last year, ` +
    `${n(p.followers)} ${p.followers === 1 ? "follower" : "followers"}.`;

  const inner = [
    `  <title id="ttl">Profile signal</title>`,
    `  <desc id="dsc">${esc(desc)}</desc>`,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="15" letter-spacing="1.4" fill="${COLORS.accent}">PROFILE SIGNAL</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">&gt; stats.feed</text>`,
    cols,
    `  <text x="${WIDTH / 2}" y="${SUBLABEL_Y}" font-size="11.5" text-anchor="middle" fill="${COLORS.dim}">Live GitHub stats, self-hosted</text>`,
  ].join("\n");

  return panel(inner, height);
}

module.exports = { render };
