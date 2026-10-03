// Regression check for the "NaN id" hang: floods every id-taking route with
// malformed ids and confirms the server rejects them with 400 and still
// serves normal requests afterwards.
//
// Usage: start the server, then
//   BASE_URL=http://localhost:5000 npm run test:nan
// Only sends requests with invalid ids, so it never modifies data.

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const ROUNDS = Number(process.env.ROUNDS || 25);
const TIMEOUT_MS = 5000;

const BAD_IDS = ["NaN", "undefined", "null", "abc", "0", "-1", "1.5", "1e3", "99999999999"];

const routes: Array<{ method: string; path: (id: string) => string; body?: unknown }> = [
  { method: "GET", path: (id) => `/api/discussion-items/${id}` },
  { method: "PATCH", path: (id) => `/api/discussion-items/${id}`, body: { notes: "x" } },
  { method: "DELETE", path: (id) => `/api/discussion-items/${id}` },
  { method: "GET", path: (id) => `/api/discussion-items?colleagueId=${id}` },
  { method: "GET", path: (id) => `/api/todos/${id}` },
  { method: "PATCH", path: (id) => `/api/todos/${id}`, body: { title: "x" } },
  { method: "DELETE", path: (id) => `/api/todos/${id}` },
  { method: "GET", path: (id) => `/api/colleagues/${id}` },
  { method: "PATCH", path: (id) => `/api/colleagues/${id}`, body: { name: "x" } },
  { method: "DELETE", path: (id) => `/api/colleagues/${id}` },
  { method: "DELETE", path: (id) => `/api/settings/${id}` },
  { method: "GET", path: (id) => `/api/task-relationships?taskId=${id}` },
  { method: "DELETE", path: (id) => `/api/task-relationships/${id}` },
  { method: "GET", path: (id) => `/api/task-discussion-links?taskId=${id}` },
  { method: "GET", path: (id) => `/api/task-discussion-links?discussionItemId=${id}` },
  { method: "DELETE", path: (id) => `/api/task-discussion-links/${id}` },
];

async function send(method: string, path: string, body?: unknown) {
  const started = Date.now();
  const res = await fetch(BASE_URL + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  await res.text();
  return { status: res.status, ms: Date.now() - started };
}

const failures: string[] = [];
let sent = 0;

async function expectStatus(expected: number, method: string, path: string, body?: unknown) {
  sent++;
  try {
    const { status } = await send(method, path, body);
    if (status !== expected) failures.push(`${method} ${path}: expected ${expected}, got ${status}`);
  } catch (err) {
    failures.push(`${method} ${path}: ${(err as Error).name === "TimeoutError" ? `no response in ${TIMEOUT_MS}ms (hang)` : (err as Error).message}`);
  }
}

async function main() {
  console.log(`Target: ${BASE_URL}, ${ROUNDS} rounds`);

  // Sequential: the primary NaN case, ROUNDS times.
  for (let i = 0; i < ROUNDS; i++) {
    await expectStatus(400, "PATCH", "/api/discussion-items/NaN", { notes: "x" });
    await expectStatus(400, "GET", "/api/discussion-items/NaN");
  }

  // Every route × every malformed id.
  for (const r of routes) {
    for (const id of BAD_IDS) {
      await expectStatus(400, r.method, r.path(encodeURIComponent(id)), r.body);
    }
  }

  // Concurrent burst well above the pool size (max 10).
  await Promise.all(
    Array.from({ length: ROUNDS * 4 }, () =>
      expectStatus(400, "PATCH", "/api/discussion-items/NaN", { notes: "x" })
    )
  );

  // The server must still answer real requests promptly.
  for (const path of ["/api/colleagues", "/api/todos", "/api/discussion-items", "/api/stats"]) {
    try {
      const { status, ms } = await send("GET", path);
      console.log(`  after flood: GET ${path} -> ${status} in ${ms}ms`);
      if (status !== 200) failures.push(`after flood: GET ${path} returned ${status}`);
    } catch (err) {
      failures.push(`after flood: GET ${path} failed: ${(err as Error).message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\nFAIL: ${failures.length} problem(s) out of ${sent} bad-id requests`);
    for (const f of failures.slice(0, 30)) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`\nPASS: ${sent} bad-id requests all returned 400; server still healthy.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
