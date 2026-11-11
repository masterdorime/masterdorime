// Shared chrome for every generated profile widget.
//
// These values are copied from ascii-namecard.svg so the six widgets look like
// they came from the same hand as the portrait and the name card. Renderers must
// import from here rather than hard-coding a colour, or the set will drift.

const COLORS = {
  bg: "#080e16",
  accent: "#5eead4",
  accentAlt: "#2dd4bf",
  accentCool: "#22d3ee",
  body: "#7fe7d6",
  muted: "#a8b6c4",
  dim: "#5a6b7a",
  dotRed: "#f87171",
  dotAmber: "#fbbf24",
  dotGreen: "#34d399",
  track: "#16302f",
};

const PANEL = {
  radius: 16,
  pad: 30,
  chrome: 34,
  dotY: 40,
  dotR: 4.6,
  dotXs: [36, 52, 68],
};

const WIDTH = 820;

const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Identity block, matching the name card exactly. The profile API returns
// name: null and bio: "masih belajar", which would contradict the name card, so
// the hero prefers these until real profile fields are set.
const IDENTITY = {
  name: "TRISTAN EDGINA",
  lines: [
    "Computer Engineering Student at Telkom University",
    "AI / Robotics / Embedded Systems / Game Dev",
    "masih belajar",
  ],
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// panel(inner, height) wraps rendered content in the shared chrome:
// background, bloom, edge gradient, three window dots, then `inner`.
// `height` is the TOTAL panel height, and so is the viewBox height.
function panel(inner, height) {
  const h = height;
  const w = WIDTH;
  const dots = PANEL.dotXs
    .map((cx, i) => {
      const fill = [COLORS.dotRed, COLORS.dotAmber, COLORS.dotGreen][i];
      return `    <circle cx="${cx}" cy="${PANEL.dotY}" r="${PANEL.dotR}" fill="${fill}" fill-opacity="0.85"/>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xml:space="preserve" role="img" aria-labelledby="ttl dsc">
  <defs>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COLORS.accentAlt}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${COLORS.accentCool}" stop-opacity="0.18"/>
    </linearGradient>
    <radialGradient id="bloom" cx="0.18" cy="0.12" r="0.9">
      <stop offset="0" stop-color="${COLORS.accentAlt}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${COLORS.accentAlt}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    text { font-family: ${FONT_STACK}; white-space: pre; }
  </style>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${PANEL.radius}" fill="${COLORS.bg}"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${PANEL.radius}" fill="url(#bloom)"/>
${dots}
${inner}
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${PANEL.radius}" fill="none" stroke="url(#edge)" stroke-width="1.4"/>
</svg>
`;
}

module.exports = { COLORS, PANEL, WIDTH, FONT_STACK, IDENTITY, esc, panel };
