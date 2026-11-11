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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const built = buildAll(snapshot);
  let missing = [];
  for (const [name, svg] of Object.entries(built)) {
    if (/not yet implemented/.test(svg)) missing.push(name);
    fs.writeFileSync(path.join(OUT_DIR, name + ".svg"), svg, "utf8");
  }
  console.error(
    `wrote ${Object.keys(built).length} widgets to ${OUT_DIR}` +
      (missing.length ? ` (STUBS: ${missing.join(", ")})` : "")
  );
  if (missing.length) process.exitCode = 1;
}

const OUT_DIR = path.join(__dirname, "..", "widgets");

module.exports = { buildAll, NAMES, WIDGETS };

if (require.main === module) {
  main();
}
