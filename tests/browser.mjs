import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import ganache from "ganache";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";

// Bounded foreground preview: this script owns and closes the server and browser.
const root = resolve("dist");
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  if (!pathname.startsWith("/preview/")) {
    res.writeHead(404).end();
    return;
  }
  const file = resolve(root, pathname.slice(9) || "index.html");
  if (!file.startsWith(`${root}/`)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
    };
    res.setHeader(
      "Content-Type",
      types[extname(file)] ?? "application/octet-stream",
    );
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const output = {
  previewSubpath: "/preview/",
  viewports: [],
  assertions: [],
  accessibility: [],
  consoleErrors: [],
  resourceFailures: [],
  wallet: {},
};
const check = (condition, text) => {
  assert.ok(condition, text);
  output.assertions.push(text);
};
await mkdir("artifacts", { recursive: true });
let rpc;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => output.consoleErrors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") output.consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) =>
    output.resourceFailures.push(`${req.url()}: ${req.failure()?.errorText}`),
  );
  page.on("response", (res) => {
    if (res.status() >= 400)
      output.resourceFailures.push(`${res.status()}: ${res.url()}`);
  });
  await page.addInitScript(() => {
    crypto.getRandomValues = (array) => {
      array.fill(0);
      return array;
    };
  });
  await page.goto(url);
  await page.locator(".square").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  check(
    (await page.locator(".square").count()) === 24,
    "24 explorable board squares",
  );
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 768 ? 1100 : 844 });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      boardScrolls:
        document.querySelector(".board-scroll").scrollWidth >
        document.querySelector(".board-scroll").clientWidth,
      smallestSquare: Math.min(
        ...Array.from(
          document.querySelectorAll(".square"),
          (el) => el.getBoundingClientRect().width,
        ),
      ),
      fontsLoaded:
        document.fonts.check("600 16px Outfit") &&
        document.fonts.check('400 16px "DM Sans"'),
    }));
    check(layout.scrollWidth <= width, `no page overflow at ${width}px`);
    check(layout.smallestSquare >= 24, `board targets >=24px at ${width}px`);
    output.viewports.push(layout);
    if ([1440, 768, 390, 320].includes(width))
      await page.screenshot({
        path: `artifacts/${width === 1440 ? "desktop" : `mobile-${width}`}.jpg`,
        fullPage: true,
        type: "jpeg",
        quality: 85,
      });
    if (width === 1440 || width === 320) {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      output.accessibility.push({
        width,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  output.contrast = await page.evaluate(() => {
    const luminance = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    return ['.intro p', '.button.primary', '.center-overline', '.deck-chance', '.deck-chest', '.chain-promo p', '.footer-brand'].map(selector => {
      const element = document.querySelector(selector);
      const color = getComputedStyle(element).color;
      let ancestor = element, background;
      while (ancestor) { background = getComputedStyle(ancestor).backgroundColor; if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') break; ancestor = ancestor.parentElement; }
      const fg = luminance(color.match(/[\d.]+/g).slice(0, 3).map(Number));
      const bg = luminance(background.match(/[\d.]+/g).slice(0, 3).map(Number));
      return { selector, color, background, ratio: +((Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05)).toFixed(2) };
    });
  });
  check(output.contrast.every(pair => pair.ratio >= 4.5), 'measured rendered text pairs meet 4.5:1 contrast');
  await page.getByRole("button", { name: /Mis propiedades/ }).click();
  check(
    await page.getByText("Todo imperio empieza por algo").isVisible(),
    "properties empty state and return path",
  );
  await page.getByRole("button", { name: "Volver al tablero" }).click();
  const help = page.getByRole("button", { name: "Cómo jugar", exact: true });
  await help.focus();
  await page.keyboard.press("Enter");
  check(await page.getByRole("dialog").isVisible(), "help opens with keyboard");
  await page.keyboard.press("Tab");
  check(
    await page.evaluate(() =>
      document.querySelector("dialog").contains(document.activeElement),
    ),
    "dialog keyboard focus remains inside",
  );
  await page.keyboard.press("Escape");
  check(
    await help.evaluate((el) => el === document.activeElement),
    "Escape closes help and restores trigger focus",
  );
  await page.screenshot({
    path: "artifacts/keyboard-focus.jpg",
    fullPage: true,
    type: "jpeg",
    quality: 80,
  });
  await page.getByRole("button", { name: "Lanzar dados" }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole("button", { name: "Comprar · 100" }).waitFor();
  check(
    await page.getByRole("button", { name: "Lanzar dados" }).isDisabled(),
    "second roll prevented",
  );
  await page.getByRole("button", { name: "Comprar · 100" }).focus();
  await page.keyboard.press('Space');
  check(
    (await page
      .locator(".big-balance")
      .textContent()
      .then((s) => s.replace(/\s/g, ""))) === "1400plátanos",
    "purchase debits 100 bananas",
  );
  await page.getByRole("button", { name: /Mis propiedades/ }).click();
  check(
    (await page.locator(".property-card").count()) === 1,
    "purchased property appears in portfolio",
  );
  await page.getByRole("button", { name: "Terminar turno" }).focus();
  await page.keyboard.press('Enter');
  await page
    .getByRole("button", { name: "Lanzar dados" })
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("mono-poly-practice-v1")).round === 2,
  );
  check(
    (await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("mono-poly-practice-v1")).balances[0],
    )) === 1420,
    "Coco lands on player property and pays rent",
  );
  await page.reload();
  await page.locator(".square").first().waitFor();
  check(
    (await page
      .locator(".big-balance")
      .textContent()
      .then((s) => s.replace(/\s/g, ""))) === "1420plátanos",
    "practice survives reload",
  );
  await page.getByRole("button", { name: "Ver todo", exact: true }).click();
  check(
    (await page
      .getByRole("dialog")
      .getByText(/paga 20 plátanos de alquiler/)
      .count()) === 1,
    "history records rent",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Conectar cartera", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Conectar cartera", exact: true })
    .click();
  check(
    await page
      .getByRole("dialog")
      .getByRole("alert")
      .innerText()
      .then((text) => text.includes("No encontramos una cartera")),
    "missing wallet has actionable recovery instructions",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Empezar una nueva partida", exact: true })
    .click();
  await page.getByRole("button", { name: "Seguir jugando" }).click();
  check(
    (await page
      .locator(".big-balance")
      .textContent()
      .then((s) => s.replace(/\s/g, ""))) === "1420plátanos",
    "reset cancellation preserves game",
  );
  await page
    .getByRole("button", { name: "Empezar una nueva partida", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Empezar nueva práctica", exact: true })
    .click();
  check(
    (await page
      .locator(".big-balance")
      .textContent()
      .then((s) => s.replace(/\s/g, ""))) === "1500plátanos",
    "confirmed reset creates fresh practice",
  );
  await page
    .getByRole("button", { name: /Suerte salvaje/ })
    .first()
    .click();
  check(
    await page
      .getByRole("dialog")
      .getByText(/gana 150, paga 75/)
      .isVisible(),
    "chance square exposes card rules",
  );
  await page.keyboard.press("Escape");
  check(
    (await page.evaluate(
      () => getComputedStyle(document.querySelector(".die")).animationName,
    )) === "none",
    "reduced motion has no dice animation",
  );

  // Real contract execution with an emulated injected wallet on a local EVM.
  // No keys, faucet requests, funds, or public transactions are used here.
  rpc = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 11155111, hardfork: "shanghai" },
    wallet: { deterministic: true },
    miner: { defaultTransactionGasLimit: "estimate" },
  });
  const chainPage = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  chainPage.on("pageerror", (e) => output.consoleErrors.push(e.message));
  await chainPage.exposeFunction(
    "localWalletRequest",
    async ({ method, params }) => {
      if (method === "eth_requestAccounts")
        return rpc.request({ method: "eth_accounts", params: [] });
      if (method === "wallet_switchEthereumChain") return null;
      return rpc.request({ method, params: params ?? [] });
    },
  );
  await chainPage.addInitScript(() => {
    window.walletListeners = {};
    window.ethereum = {
      request: async (args) => {
        if (window.rejectConnection && args.method === 'eth_requestAccounts') {
          window.rejectConnection = false;
          throw Object.assign(new Error('User rejected the request'), { code: 4001 });
        }
        if (window.blockReceipts && args.method === 'eth_getTransactionReceipt') return null;
        return window.localWalletRequest(args);
      },
      on: (name, handler) => {
        window.walletListeners[name] = handler;
      },
      removeListener: (name) => {
        delete window.walletListeners[name];
      },
    };
  });
  await chainPage.goto(url);
  await chainPage.locator(".square").first().waitFor();
  await chainPage.evaluate(() => { window.rejectConnection = true; });
  await chainPage
    .getByRole("button", { name: "Conectar cartera", exact: true })
    .click();
  await chainPage
    .getByRole("dialog")
    .getByRole("button", { name: "Conectar cartera", exact: true })
    .click();
  check(await chainPage.getByRole('dialog').getByRole('alert').innerText().then(t => t.includes('Solicitud cancelada')), 'wallet rejection is recoverable');
  await chainPage.getByRole('dialog').getByRole('button', { name: 'Conectar cartera', exact: true }).click();
  await chainPage
    .getByRole("button", { name: "Crear nueva partida en Sepolia" })
    .click();
  await chainPage
    .getByText("En Sepolia", { exact: true })
    .waitFor({ timeout: 30000 });
  check(
    (await chainPage.getByRole("dialog").count()) === 0,
    "wallet connection and confirmed contract deployment",
  );
  await chainPage.evaluate(() => { window.blockReceipts = true; });
  await chainPage.getByRole("button", { name: "Lanzar dados" }).click();
  await chainPage.getByRole('link', { name: 'Ver jugada pendiente' }).waitFor();
  check(await chainPage.getByRole('button', { name: 'Terminar turno' }).isDisabled(), 'pending transaction blocks further actions');
  await chainPage.reload();
  await chainPage.getByRole('button', { name: 'Conectar cartera', exact: true }).click();
  await chainPage.getByRole('dialog').getByRole('button', { name: 'Conectar cartera', exact: true }).click();
  await chainPage.getByRole('button', { name: 'Comprobar jugada pendiente', exact: true }).click();
  await chainPage.waitForFunction(
    () =>
      !document.querySelector(".pending") &&
      [...document.querySelectorAll("button")].some(
        (el) => el.textContent.includes("Terminar turno") && !el.disabled,
      ),
  );
  check(
    await chainPage.getByRole("button", { name: "Lanzar dados" }).isDisabled(),
    "pending transaction survives reload and confirmed on-chain roll updates phase",
  );
  await chainPage.getByRole("button", { name: "Terminar turno" }).click();
  await chainPage.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (el) => el.textContent.includes("Lanzar dados") && !el.disabled,
    ),
  );
  check(
    await chainPage
      .locator(".turn-heading")
      .innerText()
      .then((t) => t.includes("Ronda 2")),
    "on-chain Coco turn and round persisted",
  );
  await chainPage.screenshot({
    path: "artifacts/on-chain-local-evm.jpg",
    fullPage: true,
    type: "jpeg",
    quality: 80,
  });
  await chainPage.reload();
  await chainPage
    .getByRole("button", { name: "Conectar cartera", exact: true })
    .click();
  await chainPage
    .getByRole("dialog")
    .getByRole("button", { name: "Conectar cartera", exact: true })
    .click();
  await chainPage
    .getByRole("button", { name: "Recuperar partida de Sepolia", exact: true })
    .click();
  await chainPage.getByText("En Sepolia", { exact: true }).waitFor();
  check(
    await chainPage
      .locator(".turn-heading")
      .innerText()
      .then((t) => t.includes("Ronda 2")),
    "contract state recovered after reload",
  );
  await chainPage.evaluate(() => window.walletListeners.accountsChanged?.([]));
  check(
    await chainPage.getByText("Modo práctica", { exact: true }).isVisible(),
    "account change exits chain mode and restores practice",
  );
  output.wallet = {
    transport: "injected wallet emulation",
    chain: "real local Ganache EVM with Sepolia chain ID",
    publicSepoliaTested: false,
  };
  check(output.consoleErrors.length === 0, "no browser console errors");
  check(
    output.resourceFailures.length === 0,
    "no resource failures under /preview/",
  );
  output.status = output.accessibility.some((a) => a.violations.length)
    ? "INTERACTIONS PASS; ACCESSIBILITY FINDINGS REQUIRE REVIEW"
    : "PASS";
  await writeFile(
    "artifacts/browser-results.json",
    JSON.stringify(output, null, 2),
  );
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  output.status = "FAIL";
  output.failure = String(error);
  await writeFile(
    "artifacts/browser-results.json",
    JSON.stringify(output, null, 2),
  );
  throw error;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
  await rpc?.disconnect();
}
