// Runs every renderer and writes widgets/*.svg.
//
// Output name -> renderer module. Kept as an explicit map rather than assuming
// they match: the published file is city-3d.svg (hyphenated, so it sorts beside
// city.svg) while its module is city3d.js. An earlier version derived the module
// name from the output name and silently wrote the placeholder panel instead of
// the real city.

const fs = require("node:fs");
const path = require("node:path");
const theme = require("./lib/theme.js");

const WIDGETS = {
  stack: "stack",
  stats: "stats",
  social: "social",
  projects: "projects",
  city: "city",
  "city-3d": "city3d",
  hero: "hero",
};

const NAMES = Object.keys(WIDGETS);

// Load a real renderer, or fall back to a stub panel if its file is missing.
// require() is cached, so each renderer is loaded at most once per process.
function loadRenderer(moduleName) {
  const file = path.join(__dirname, "renderers", moduleName + ".js");
  if (fs.existsSync(file)) {
    return require(file).render;
  }
  return (snapshot) =>
    theme.panel(
      `  <title id="ttl">${moduleName}</title>\n  <desc id="dsc">${moduleName} widget not yet implemented.</desc>\n`,
      120
    );
}

// buildAll(snapshot) -> { stack: "<svg...>", stats: "<svg...>", ... }
function buildAll(snapshot) {
  const out = {};
  for (const name of NAMES) {
    out[name] = loadRenderer(WIDGETS[name])(snapshot);
  }
  return out;
}

function main() {
  const snapshot = require("../data/profile-data.json");
  const built = buildAll(snapshot);

  // Collect stubs BEFORE writing anything. Writing first and exiting non-zero
  // after would leave placeholder SVGs in the tree that look like real output
  // to the next command that reads them.
  const stubs = Object.entries(built)
    .filter(([, svg]) => /not yet implemented/.test(svg))
    .map(([name]) => name);

  if (stubs.length) {
    console.error(`refusing to write: ${stubs.length} widget(s) are still stubs: ${stubs.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, svg] of Object.entries(built)) {
    fs.writeFileSync(path.join(OUT_DIR, name + ".svg"), svg, "utf8");
  }
  console.error(`wrote ${Object.keys(built).length} widgets to ${OUT_DIR}`);
}

const OUT_DIR = path.join(__dirname, "..", "widgets");

module.exports = { buildAll, NAMES, WIDGETS };

if (require.main === module) {
  main();
}
