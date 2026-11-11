// Runs every renderer and writes widgets/*.svg.
//
// Renderers that do not exist yet fall back to a minimal valid panel. All six
// are implemented now, so the fallback only matters if a future renderer is
// added to NAMES before its file is written.

const fs = require("node:fs");
const path = require("node:path");
const theme = require("./lib/theme.js");

const NAMES = ["stack", "stats", "social", "projects", "city", "hero"];
const OUT_DIR = path.join(__dirname, "..", "widgets");

// Load a real renderer if it exists, otherwise fall back to a stub panel.
// require() is cached, so each renderer is loaded at most once per process.
function loadRenderer(name) {
  const file = path.join(__dirname, "renderers", name + ".js");
  if (fs.existsSync(file)) {
    return require(file).render;
  }
  return (snapshot) =>
    theme.panel(
      `  <title id="ttl">${name}</title>\n  <desc id="dsc">${name} widget not yet implemented.</desc>\n`,
      120
    );
}

// buildAll(snapshot) -> { stack: "<svg...>", stats: "<svg...>", ... }
function buildAll(snapshot) {
  const out = {};
  for (const name of NAMES) {
    out[name] = loadRenderer(name)(snapshot);
  }
  return out;
}

function main() {
  const snapshot = require("../data/profile-data.json");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const built = buildAll(snapshot);
  for (const [name, svg] of Object.entries(built)) {
    fs.writeFileSync(path.join(OUT_DIR, name + ".svg"), svg, "utf8");
  }
  console.error(
    `wrote ${Object.keys(built).length} widgets to ${OUT_DIR}`
  );
}

module.exports = { buildAll, NAMES };

if (require.main === module) {
  main();
}
