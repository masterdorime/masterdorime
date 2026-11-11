const test = require("node:test");
const assert = require("node:assert");
const { buildSnapshot } = require("../fetch-data.js");

const raw = {
  profile: { login: "u", followers: 1, following: 2, public_repos: 3, avatar_url: "a" },
  contributions: { totalContributions: 10, weeks: [
    { contributionDays: [ { date: "2026-01-01", contributionCount: 4 },
                          { date: "2026-01-02", contributionCount: 0 } ] },
    { contributionDays: [ { date: "2026-01-08", contributionCount: 6 } ] },
  ]},
  repos: [
    { name: "b", fork: false, pushedAt: "2026-01-02", description: null,
      language: "Rust", topics: [], stargazers_count: 0, homepage: null, languages: { Rust: 100 } },
    { name: "a", fork: false, pushedAt: "2026-03-01", description: "x",
      language: "TS", topics: ["t"], stargazers_count: 2, homepage: "h", languages: { TS: 300 } },
    { name: "f", fork: true,  pushedAt: "2026-05-01", languages: { Go: 999 } },
  ],
};

test("forks are excluded", () => {
  const s = buildSnapshot(raw);
  assert.deepStrictEqual(s.repos.map(r => r.name), ["a", "b"]);
});

test("repos sort by pushedAt descending", () => {
  assert.strictEqual(buildSnapshot(raw).repos[0].name, "a");
});

test("contributions derive total, activeDays and busiestDay", () => {
  const c = buildSnapshot(raw).contributions;
  assert.strictEqual(c.total, 10);
  assert.strictEqual(c.activeDays, 2);
  assert.strictEqual(c.busiestDay, 6);
});

test("languages are byte-weighted, sorted, and sum sensibly", () => {
  const l = buildSnapshot(raw).languages;
  assert.strictEqual(l[0].name, "TS");
  assert.strictEqual(l[0].pct, 75);
  assert.strictEqual(l[1].pct, 25);
});

test("null fields survive as null rather than throwing", () => {
  const b = buildSnapshot(raw).repos.find(r => r.name === "b");
  assert.strictEqual(b.description, null);
  assert.strictEqual(b.homepage, null);
});

// The 3D city draws one cube per day, so the series and the total must agree.
// This is the regression guard for the defect that started this work: a frame
// showing one number above a city showing another.
test("the day series sums to the reported total", () => {
  const c = buildSnapshot(raw).contributions;
  const sum = c.days.reduce((s, d) => s + d.count, 0);
  assert.strictEqual(sum, c.total, "days sum " + sum + " != total " + c.total);
});

test("the day series is in calendar order and non-empty", () => {
  const days = buildSnapshot(raw).contributions.days;
  assert.ok(days.length > 0);
  const dates = days.map((d) => d.date);
  assert.deepStrictEqual([...dates].sort(), dates, "days are not in date order");
});

test("activeDays and busiestDay agree with the series", () => {
  const c = buildSnapshot(raw).contributions;
  assert.strictEqual(c.activeDays, c.days.filter((d) => d.count > 0).length);
  assert.strictEqual(c.busiestDay, Math.max(...c.days.map((d) => d.count)));
});
