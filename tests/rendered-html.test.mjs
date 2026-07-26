import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Gambl Roulette lobby", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Gambl Roulette \| FantomZone<\/title>/i);
  assert.match(html, /FORTUNE/);
  assert.match(html, /FAVORS/);
  assert.match(html, /Start game/i);
  assert.match(html, /How to play/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps responsive game and betting contracts in source", async () => {
  const [page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /WHEEL_ORDER/);
  assert.match(page, /data-testid="dealer-question"/);
  assert.match(page, /data-testid="chip-tray"/);
  assert.match(page, /data-testid="show-board"/);
  assert.match(page, /speechSynthesis/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(orientation: landscape\)/);
  assert.match(css, /\.game-area\.view-board \.wheel-panel/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
