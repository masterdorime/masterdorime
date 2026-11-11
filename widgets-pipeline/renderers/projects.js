// PROJECTS widget: the four pinned repositories.
//
// Pure: same snapshot in, byte-identical SVG out.
//
// Relative ages are computed against `snapshot.fetchedAt`, NEVER Date.now().
// That keeps renders deterministic and testable, and it is also more honest:
// the age shown is the age as of the data the panel was built from, not as of
// whenever someone happens to view the file.

const { COLORS, PANEL, WIDTH, esc, panel } = require("../lib/theme.js");

const PINNED = [
  "opendump-v2",
  "hobyd-hackathon",
  "portofolio-websites",
  "Flying-Fih-Remaster",
];

const PAD = PANEL.pad;
const HEAD_Y = 62;
const ENTRY_TOP = 104;
const ENTRY_H = 96;
const NAME_Y_OFF = 0;       // relative to entry top
const DESC_Y_OFF = 26;
const META_Y_OFF = 50;
const MAX_DESC = 78;        // measured character budget for the desc line
const MAX_TOPICS = 3;

// A relative age from two ISO strings. Pure; no clock.
function relAge(fromIso, toIso) {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return "updated --";
  const days = Math.floor((b - a) / 86400000);
  if (days <= 0) return "updated today";
  if (days === 1) return "updated 1d ago";
  if (days < 30) return `updated ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `updated ${months}mo ago`;
  return `updated ${Math.floor(months / 12)}y ago`;
}

// Clamp to a character budget on a word boundary where possible, so the line
// never overruns the panel and never cuts mid-word unless it must.
function clamp(s, max) {
  const t = String(s || "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + "…";
}

function render(snapshot) {
  const repos = snapshot.repos || [];
  const byName = new Map(repos.map((r) => [r.name, r]));

  const entries = PINNED.map((name) => byName.get(name)).filter(Boolean);

  const body = entries
    .map((r, i) => {
      const top = ENTRY_TOP + i * ENTRY_H;
      const desc = r.description === null || r.description === undefined || r.description === ""
        ? "-- no description --"
        : clamp(r.description, MAX_DESC);
      const topics = (r.topics || []).slice(0, MAX_TOPICS);
      const lang = r.language || "--";
      const age = relAge(r.pushedAt, snapshot.fetchedAt);

      const metaBits = [lang, `${r.stars}★`, age];
      if (r.homepage) metaBits.push(r.homepage.replace(/^https?:\/\//, ""));

      return [
        `  <text class="proj-name" x="${PAD}" y="${top + NAME_Y_OFF}" font-size="16" fill="${COLORS.accent}">${esc(r.name)}</text>`,
        `  <text x="${PAD}" y="${top + DESC_Y_OFF}" font-size="12.5" fill="${COLORS.muted}" fill-opacity="0.82">${esc(desc)}</text>`,
        `  <text x="${PAD}" y="${top + META_Y_OFF}" font-size="11.5" fill="${COLORS.body}" fill-opacity="0.72">${esc(metaBits.join("  ·  "))}</text>`,
        topics.length
          ? `  <text x="${WIDTH - PAD}" y="${top + META_Y_OFF}" font-size="11.5" text-anchor="end" fill="${COLORS.dim}">${esc(topics.map((t) => "#" + t).join(" "))}</text>`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const height = ENTRY_TOP + Math.max(entries.length, 1) * ENTRY_H - 18;

  const desc =
    `Pinned repositories: ${entries.map((r) => r.name).join(", ") || "none available"}.`;

  const inner = [
    `  <title id="ttl">Pinned projects</title>`,
    `  <desc id="dsc">${esc(desc)}</desc>`,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="15" letter-spacing="1.4" fill="${COLORS.accent}">PROJECTS.LIST</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">&gt; ./projects.sh --all</text>`,
    body,
  ].join("\n");

  return panel(inner, height);
}

module.exports = { render, PINNED };
