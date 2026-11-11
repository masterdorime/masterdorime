// The only module in this pipeline that touches the network.
//
// Everything downstream is a pure function of data/profile-data.json, so a
// renderer can never fail because of a network condition. That is what makes
// the daily Action safe to run unattended.
//
// Usage:
//   node widgets-pipeline/fetch-data.js
//
// Writes ../data/profile-data.json atomically. On ANY failure it exits
// non-zero WITHOUT touching the existing snapshot: a stale-but-correct
// snapshot beats a fresh-but-wrong one, because the renderers would faithfully
// draw the wrong numbers.

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const OUT_PATH = path.join(__dirname, "..", "data", "profile-data.json");
const AVATAR_PATH = path.join(__dirname, "..", "assets", "avatar.png");
const LOGIN = "masterdorime";

// gh JSON helper. Throws on API failure, which is what we want: the caller
// aborts before writing.
function gh(args) {
  const out = execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
}

const round = (n) => Math.round(n);

// Derive the three contribution figures from the calendar.
// `weeks` is an array of { contributionDays: [{ date, contributionCount }] }.
function deriveContributions(cal) {
  const days = (cal.weeks || []).flatMap((w) => w.contributionDays || []);
  const counts = days.map((d) => d.contributionCount || 0);
  return {
    total: cal.totalContributions || 0,
    activeDays: counts.filter((c) => c > 0).length,
    busiestDay: counts.length ? Math.max(...counts) : 0,
  };
}

// Byte-weighted language mix across non-fork repos.
// Mirrors how GitSkins weighted it (repo-size-weighted bytes, forks excluded).
function deriveLanguages(repos) {
  const totals = new Map();
  let sum = 0;
  for (const r of repos) {
    if (r.fork) continue;
    for (const [name, bytes] of Object.entries(r.languages || {})) {
      if (!bytes) continue;
      totals.set(name, (totals.get(name) || 0) + bytes);
      sum += bytes;
    }
  }
  if (!sum) return [];
  return [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes, pct: round((bytes / sum) * 100) }))
    .sort((a, b) => b.bytes - a.bytes);
}

// Shape already-fetched data into the committed snapshot. Pure.
// `null` must survive as `null` rather than becoming "" or throwing: several
// repos genuinely have no description and the renderers must handle that.
function buildSnapshot(raw) {
  const p = raw.profile || {};
  const repos = (raw.repos || [])
    .filter((r) => !r.fork)
    .map((r) => ({
      name: r.name,
      description: r.description ?? null,
      language: r.language ?? null,
      topics: Array.isArray(r.topics) ? r.topics : [],
      stars: r.stargazers_count || 0,
      pushedAt: r.pushedAt || r.pushed_at || "",
      homepage: r.homepage ?? null,
      languages: r.languages || {},
    }))
    .sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt)));

  return {
    fetchedAt: raw.fetchedAt || new Date().toISOString(),
    profile: {
      login: p.login || "",
      name: p.name ?? null,
      bio: p.bio ?? null,
      blog: p.blog ?? null,
      twitter_username: p.twitter_username ?? null,
      followers: p.followers || 0,
      following: p.following || 0,
      public_repos: p.public_repos || 0,
      avatar_url: p.avatar_url || "",
    },
    contributions: deriveContributions(raw.contributions || {}),
    languages: deriveLanguages(raw.repos || []),
    repos,
  };
}

// ---- network layer ----

function fetchRaw() {
  const profile = gh(["api", "user"]);

  // The profile repo itself is non-fork and would otherwise appear as a
  // project. Keep it out of the repo list; the README is not a project.
  const repos = gh([
    "api",
    "user/repos?per_page=100&affiliation=owner&sort=pushed",
  ]).filter((r) => r.name !== LOGIN);

  // Languages are per-repo, so this is one call per repo. Attach them.
  for (const r of repos) {
    try {
      r.languages = gh(["api", `repos/${LOGIN}/${r.name}/languages`]);
    } catch {
      r.languages = {};
    }
  }

  const query =
    "query { viewer { contributionsCollection { contributionCalendar { " +
    "totalContributions weeks { contributionDays { date contributionCount } } " +
    "} } } }";
  const gql = gh(["api", "graphql", "-f", "query=" + query]);
  const contributions =
    gql.data && gql.data.viewer && gql.data.viewer.contributionsCollection
      ? gql.data.viewer.contributionsCollection.contributionCalendar
      : {};

  return {
    fetchedAt: new Date().toISOString(),
    profile,
    repos,
    contributions,
  };
}

// The hero embeds the avatar inline as a data URI, so it must be a local file
// rather than a remote reference. Download it here, where network access
// already lives. A failure is not fatal: the hero omits the image.
//
// Size: the hero draws the avatar in a 104px circle, so 208px is exactly 2x for
// crisp rendering on a retina display and nothing more. GitHub serves avatars at
// an arbitrary size via ?s=N, which avoids needing an image library to resize.
// Without this the source 460x460 comes to ~198KB of base64, more than the whole
// rest of the widget set.
const AVATAR_PX = 208;

function fetchAvatar(profile) {
  const url = profile && profile.avatar_url;
  if (!url) return false;
  try {
    fs.mkdirSync(path.dirname(AVATAR_PATH), { recursive: true });
    const base = url.split("?")[0];
    const sized = `${base}?s=${AVATAR_PX}&v=4`;
    const buf = execFileSync("curl", ["-sSL", "--fail", sized], {
      maxBuffer: 32 * 1024 * 1024,
    });
    if (!buf || buf.length < 100) return false;
    fs.writeFileSync(AVATAR_PATH, buf);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const raw = fetchRaw();
  const snapshot = buildSnapshot(raw);

  const gotAvatar = fetchAvatar(raw.profile);

  // Atomic write: temp file then rename. A crash between the two leaves the
  // previous snapshot intact rather than a truncated one.
  const tmp = OUT_PATH + ".tmp";
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, OUT_PATH);

  const top = snapshot.languages
    .slice(0, 3)
    .map((l) => `${l.name} ${l.pct}%`)
    .join(", ");
  console.error(
    `wrote ${OUT_PATH}: ${snapshot.repos.length} repos, ${snapshot.contributions.total} contributions, ${top}` +
      (gotAvatar ? `, avatar ${fs.statSync(AVATAR_PATH).size}b` : ", no avatar")
  );
}

module.exports = { buildSnapshot, deriveContributions, deriveLanguages };

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error("fetch-data failed, snapshot left untouched:", err.message);
    process.exit(1);
  }
}
