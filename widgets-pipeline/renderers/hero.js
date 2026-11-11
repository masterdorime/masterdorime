// HERO widget: the identity block at the top of the page.
//
// Pure with respect to the snapshot: same snapshot in, byte-identical SVG out.
// The avatar is the one exception — it is a local asset on disk, refreshed by
// fetch-data.js, and read here so the SVG can embed it inline. If it is absent
// the renderer omits the image entirely rather than emitting a broken one.
//
// The identity block is drawn from IDENTITY in lib/theme.js, the same constants
// the name card uses, so the two panels cannot contradict each other.

const fs = require("node:fs");
const path = require("node:path");
const { COLORS, PANEL, WIDTH, IDENTITY, esc, panel } = require("../lib/theme.js");

const PAD = PANEL.pad;
const HEAD_Y = 62;
const AVA_Y = 150;          // vertical centre of the avatar circle
const AVA_R = 52;
const AVA_CX = PAD + AVA_R;
const TEXT_X = AVA_CX + AVA_R + 26;
const NAME_Y = 112;
const LINE_Y0 = 140;
const LINE_STEP = 22;
const CHIP_Y = 250;
const CHIP_H = 26;
const CHIP_GAP = 10;

const AVATAR_PATH = path.join(__dirname, "..", "..", "assets", "avatar.png");

// Read the avatar and return a data URI, or "" when unavailable. Keeping this
// local is what makes the widget self-contained: an <image href="https://...">
// is a network fetch and is banned by the test suite.
//
// The snapshot is the source of truth for whether an avatar exists at all. A
// cached file on disk must not keep rendering after the account no longer has
// one, so an empty avatar_url means "no avatar" regardless of what is cached.
function avatarDataUri(profile) {
  if (!profile || !profile.avatar_url) return "";
  try {
    const buf = fs.readFileSync(AVATAR_PATH);
    return "data:image/png;base64," + buf.toString("base64");
  } catch {
    return "";
  }
}

function render(snapshot) {
  const p = snapshot.profile || {};
  const langs = (snapshot.languages || []).slice(0, 5);

  // Prefer real profile fields once the account owner sets them; fall back to
  // the shared identity so the panel always says something true.
  const name = p.name || IDENTITY.name;
  const lines = IDENTITY.lines;

  const dataUri = avatarDataUri(p);

  // Avatar with a circular clip. When there is no image the text simply starts
  // further left, so the panel stays balanced instead of showing an empty ring.
  const avatar = dataUri
    ? [
        `  <defs><clipPath id="ava"><circle cx="${AVA_CX}" cy="${AVA_Y}" r="${AVA_R}"/></clipPath></defs>`,
        `  <image href="${dataUri}" x="${AVA_CX - AVA_R}" y="${AVA_Y - AVA_R}" width="${AVA_R * 2}" height="${AVA_R * 2}" clip-path="url(#ava)" preserveAspectRatio="xMidYMid slice"/>`,
        `  <circle cx="${AVA_CX}" cy="${AVA_Y}" r="${AVA_R}" fill="none" stroke="${COLORS.accentAlt}" stroke-opacity="0.55" stroke-width="1.6"/>`,
      ].join("\n")
    : "";

  const identity = lines
    .map(
      (l, i) =>
        `  <text x="${dataUri ? TEXT_X : PAD}" y="${LINE_Y0 + i * LINE_STEP}" font-size="13" fill="${COLORS.body}" fill-opacity="0.85">${esc(l)}</text>`
    )
    .join("\n");

  // Language chips, measured by character count so a long name cannot run past
  // its pill. Laid left to right with a fixed gap.
  const CHAR_W = 7.6;
  let cx = PAD;
  const chips = langs
    .map((l) => {
      const label = `${l.name} ${l.pct}%`;
      const w = label.length * CHAR_W + 22;
      const svg = [
        `  <rect x="${cx}" y="${CHIP_Y}" width="${w.toFixed(1)}" height="${CHIP_H}" rx="${CHIP_H / 2}" fill="${COLORS.accentAlt}" fill-opacity="0.10" stroke="${COLORS.accentAlt}" stroke-opacity="0.35"/>`,
        `  <text x="${(cx + w / 2).toFixed(1)}" y="${CHIP_Y + CHIP_H / 2 + 4}" font-size="11.5" text-anchor="middle" fill="${COLORS.body}">${esc(label)}</text>`,
      ].join("\n");
      cx += w + CHIP_GAP;
      return svg;
    })
    .join("\n");

  const height = CHIP_Y + CHIP_H + 34;

  const summary = langs.length
    ? langs.map((l) => `${l.name} ${l.pct}%`).join(", ")
    : "no language data";
  const desc = `${name}. ${lines.join(" ")} Top languages: ${summary}.`;

  const inner = [
    `  <title id="ttl">${esc(name)}</title>`,
    `  <desc id="dsc">${esc(desc)}</desc>`,
    avatar,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="15" letter-spacing="1.4" fill="${COLORS.accent}">README</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">&gt; ./run --profile</text>`,
    `  <text x="${dataUri ? TEXT_X : PAD}" y="${NAME_Y}" font-size="28" fill="${COLORS.accentCool}">${esc(name)}</text>`,
    identity,
    chips,
  ].join("\n");

  return panel(inner, height);
}

module.exports = { render };
