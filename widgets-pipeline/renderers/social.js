// SOCIAL widget: the handle and the links worth surfacing.
//
// Pure: same snapshot in, byte-identical SVG out. No clock, no randomness.
//
// This is the one widget where an outbound link is intended, so its own test
// scopes the self-contained assertion to exclude the profile href rather than
// banning all URLs. Everything else stays local.

const { COLORS, PANEL, WIDTH, esc, panel } = require("../lib/theme.js");

const PAD = PANEL.pad;
const HEAD_Y = 62;
const HANDLE_Y = 124;
const ROW_Y = 172;

// Only render a link when the snapshot actually carries one. A null blog must
// produce a panel without a broken link, not a crash and not an empty anchor.
function link(href, label) {
  if (!href) return "";
  return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;
}

function render(snapshot) {
  const p = snapshot.profile || {};
  const login = p.login || "";

  // The handle always links to the profile: it is the one destination that
  // always exists, and an unlinked handle invites a click that does nothing.
  const handle = login
    ? `<a href="https://github.com/${esc(login)}" target="_blank" rel="noopener">@${esc(login)}</a>`
    : "";

  const blog = link(
    p.blog,
    // Strip the scheme for the label, and the trailing slash too: a visible
    // "example.com/" reads as a typo rather than a URL.
    p.blog ? p.blog.replace(/^https?:\/\//, "").replace(/\/$/, "") : ""
  );
  const twitter = p.twitter_username
    ? link("https://twitter.com/" + p.twitter_username, "@" + p.twitter_username)
    : "";

  // Separator only when both entries exist, so a missing one leaves no
  // dangling middot.
  const row = [blog, twitter].filter(Boolean).join(
    ` <tspan fill="${COLORS.dim}"> · </tspan> `
  );

  const height = 206;

  const inner = [
    `  <title id="ttl">Social</title>`,
    `  <desc id="dsc">Links for ${esc(login)}${p.blog ? ", website and social profile" : ""}.</desc>`,
    `  <text x="${PAD}" y="${HEAD_Y}" font-size="15" letter-spacing="1.4" fill="${COLORS.accent}">CONNECT</text>`,
    `  <text x="${WIDTH - PAD}" y="${HEAD_Y}" font-size="12" text-anchor="end" fill="${COLORS.dim}">&gt; whoami --links</text>`,
    `  <text x="${WIDTH / 2}" y="${HANDLE_Y}" font-size="26" text-anchor="middle" fill="${COLORS.accentCool}">${handle}</text>`,
    row ? `  <text x="${WIDTH / 2}" y="${ROW_Y}" font-size="13" text-anchor="middle" fill="${COLORS.body}" fill-opacity="0.9">${row}</text>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return panel(inner, height);
}

module.exports = { render };
