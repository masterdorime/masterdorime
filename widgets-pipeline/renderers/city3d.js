// CITY 3D widget: the contribution year drawn as an isometric city.
//
// Pure: same snapshot in, byte-identical SVG out. No clock, no randomness.
//
// Replaces the third-party action whose own figure disagreed with the frame
// above it. This draws from the SAME snapshot as every other panel, so the
// totals cannot drift apart again.
//
// Layout: one cube per day, 53 week-columns x 7 day-rows, projected
// isometrically by stepping x down-and-right per week and y down per day. The
// step is derived from the panel width rather than fixed, so a full year always
// fits the column without GitHub scaling the result.

const { COLORS, PANEL, WIDTH, esc, panel } = require("../lib/theme.js");
const iso = require("../lib/iso.js");

const PAD = PANEL.pad;
const HEAD_Y = 62;

// The grid is 53 columns wide and each column advances by one cube plus the
// isometric skew, so the usable width decides the step. 20 is the original
// asset's step and is the ceiling; below that everything scales together.
const COLS = 53;
const ROWS = 7;
const BASE_STEP = 20;
const ROW_RATIO = 0.5775; // 11.55 / 20, preserved from the original asset

// Exact horizontal reach of one cube, in units, derived from the face transforms
// rather than guessed. The top face is skewY(-30) skewX(40.89) scale(1 1.15)
// applied right-to-left, so a point (u,v) lands at x = u + 1.15v*tan(40.89).
// A cube's left edge is its translate x; its right edge is that reach.
const TOP_REACH = iso.TOP_H * 1.15 * Math.tan((40.89 * Math.PI) / 180);
const CUBE_W = iso.UNIT + TOP_REACH; // ~35.9 units

const LABEL_BAND = 26;


const n = (v) => Number(v || 0).toLocaleString("en-US");

// Project a (week, day) grid position to screen space.
//
// Weeks step right-and-down, days step left-and-down, which is what produces
// the diagonal ribbon. The span of (week - day) is what has to fit the width.
function layout(days) {
  const dated = days
    .map((d) => ({ ...d, t: Date.parse(d.date) }))
    .filter((d) => !Number.isNaN(d.t));
  if (!dated.length) return { cells: [], step: BASE_STEP, scale: 1, width: 0, height: 0 };

  // Align the grid to real weekdays rather than assuming the array starts on a
  // Sunday: consecutive 7-day chunks of a padded series drift out of alignment.
  const first = dated[0].t;
  const firstDow = new Date(first).getUTCDay(); // 0 = Sunday
  const origin = first - firstDow * 86400000;

  const cells = dated.map((d) => {
    const col = Math.floor((d.t - origin) / (7 * 86400000));
    const row = new Date(d.t).getUTCDay();
    return { col, row, count: d.count };
  });

  const minCol = Math.min(...cells.map((c) => c.col));
  const maxCol = Math.max(...cells.map((c) => c.col));
  const cols = maxCol - minCol + 1;

  // Horizontal extent of the ribbon: (cols-1) steps along the week axis plus
  // (ROWS-1) steps back along the day axis, plus one cube's reach. Solving this
  // exactly — rather than estimating a footprint — is what keeps the block
  // centred: a cube's left edge is its translate x, but its skewed top face
  // reaches well past one step to the right.
  const avail = WIDTH - PAD * 2;
  const spans = cols - 1 + (ROWS - 1);
  const step = Math.min(BASE_STEP, avail / (spans + CUBE_W / BASE_STEP));
  const scale = step / BASE_STEP;

  return { cells, step, scale, minCol, cols, origin };
}

function render(snapshot) {
  const c = snapshot.contributions || {};
  const days = Array.isArray(c.days) ? c.days : [];
  const total = c.total || 0;

  const lay = layout(days);
  const step = lay.step || BASE_STEP;
  const scale = lay.scale || 1;
  const rowStep = step * ROW_RATIO;

  // Place the ribbon so its leftmost cube starts exactly at the padding. The
  // width was solved to that same budget, so the right edge lands on the
  // opposite padding and the block is centred without any fudge factor.
  const x0 = PAD + (ROWS - 1) * step;

  // Towers rise UP from the grid, so the tallest one needs headroom above the
  // first row rather than space below the last.
  const maxTower = iso.heightFor(4) * scale;
  const gridTop = HEAD_Y + 40 + maxTower;

  const cubes = lay.cells
    .map((cell) => {
      const x = x0 + (cell.col - (lay.minCol || 0)) * step - cell.row * step;
      const y = gridTop + (cell.col - (lay.minCol || 0)) * rowStep + cell.row * rowStep;
      return iso.cube(x, y, iso.levelFor(cell.count), scale);
    })
    .join("\n");

  // Grid height: just the ribbon's vertical extent. The tallest tower now grows
  // upward into headroom already reserved above gridTop, so adding its height
  // again here would leave dead space at the bottom.
  const colSpan = Math.max(0, (lay.cols || 1) - 1);
  const gridH = colSpan * rowStep + (ROWS - 1) * rowStep + step * 0.6;
  const height = Math.max(260, Math.ceil(gridTop + gridH + 22));

  // The panel directly above already says CONTRIBUTION CITY and states the
  // total, so repeating either here would read as a duplicate header. What this
  // panel can add is the span it actually covers.
  const first = days.length ? days[0].date : "";
  const last = days.length ? days[days.length - 1].date : "";
  const span = first && last ? `${first} → ${last}` : "no data";

  const desc =
    `Contribution city: ${n(total)} ${Number(total) === 1 ? "contribution" : "contributions"} ` +
    `in the last year across ${n(c.activeDays)} ${Number(c.activeDays) === 1 ? "active day" : "active days"}, ` +
    `busiest day ${n(c.busiestDay)}. Each building is one day; taller means more contributions.`;

  const inner = [
    `  <title id="ttl">Contribution city, one year</title>`,
    `  <desc id="dsc">${esc(desc)}</desc>`,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="13" letter-spacing="1.4" fill="${COLORS.muted}" fill-opacity="0.85">ONE YEAR · ${esc(String((lay.cols || 0)))} WEEKS</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">${esc(span)}</text>`,
    cubes,
  ]
    .filter(Boolean)
    .join("\n");

  return panel(inner, height);
}

module.exports = { render, layout, COLS, ROWS };
