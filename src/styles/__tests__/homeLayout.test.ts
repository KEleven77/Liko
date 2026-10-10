import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeCss = readFileSync(new URL("../home.css", import.meta.url), "utf8");
const surfaceCss = readFileSync(new URL("../surface.css", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../../pages/Home.tsx", import.meta.url), "utf8");
const controlsSource = readFileSync(
  new URL("../../components/shell/FloatingControls.tsx", import.meta.url),
  "utf8",
);
const miniSource = readFileSync(
  new URL("../../components/node/MiniNodeCard.tsx", import.meta.url),
  "utf8",
);
const sharedCardSource = readFileSync(
  new URL("../../components/node/CompactNodeCard.tsx", import.meta.url),
  "utf8",
);
const nodeGridSource = readFileSync(
  new URL("../../components/node/NodeGrid.tsx", import.meta.url),
  "utf8",
);
const appShellSource = readFileSync(
  new URL("../../components/shell/AppShell.tsx", import.meta.url),
  "utf8",
);
const routerSource = readFileSync(new URL("../../router.tsx", import.meta.url), "utf8");

describe("home responsive layout contracts", () => {
  it("spans group tabs across the grid instead of a single card column", () => {
    expect(homeCss).toMatch(/\.home-group-tabs \{[\s\S]*?width: 100%;[\s\S]*?flex: 1 1 0;/);
    expect(homeCss).toMatch(/\.home-group-tabs button \{[\s\S]*?flex: 1 0 0;/);
    expect(nodeGridSource).toContain('className="home-controls-bar"');
    expect(nodeGridSource).not.toContain("borrowControlsGrid");
  });

  it("uses one spacing source between cluster filters and cards", () => {
    expect(homeCss).toMatch(/\.mao-cluster-card \{[^}]*gap: 12px;/);
    expect(homeCss).toMatch(/\.mao-section-header \{[^}]*gap: 12px;[^}]*margin: 0;/);
    expect(homeCss).toMatch(/\.home-region-bar \{[^}]*margin-bottom: 0;/);
    expect(nodeGridSource).not.toContain('className="home-controls-bar mb-4"');
  });

  it("uses an explicit expanded state through tablet widths without :has()", () => {
    expect(homeCss).not.toContain(":has(");
    expect(homeCss).toMatch(/@media \(max-width: 1023px\)[\s\S]*\.home-dashboard\.is-controls-expanded \.home-brand/);
    expect(homeSource).toContain("onExpandedChange={setControlsExpanded}");
  });

  it("keeps both horizontal edges inside viewport safe areas", () => {
    expect(surfaceCss).toContain("env(safe-area-inset-left, 0px)");
    expect(surfaceCss).toContain("env(safe-area-inset-right, 0px)");
    expect(surfaceCss).toMatch(/padding-left:\s*max\(var\(--app-gutter\)/);
    expect(surfaceCss).toMatch(/padding-right:\s*max\(var\(--app-gutter\)/);
  });

  it("enforces the mini card width floor before adding another fixed column", () => {
    expect(homeCss).toContain("minmax(var(--mini-card-min-width, 260px), 1fr)");
    for (const breakpoint of [1440, 1150, 860, 580]) {
      expect(homeCss).toContain(`@media (max-width: ${breakpoint}px)`);
    }
  });

  it("resets child panels on collapse and keeps home-only routing out of controls", () => {
    expect(controlsSource).toContain("if (nextCollapsed) setColorsOpen(false)");
    expect(controlsSource).not.toContain("useLocation");
    expect(controlsSource).not.toContain("useSearchParams");
    expect(controlsSource).not.toContain("usePublicConfig");
  });

  it("shares the mini card layout and URL-encodes its detail route", () => {
    expect(miniSource).toContain('size="mini"');
    expect(sharedCardSource).not.toMatch(
      /from\s+["']\.\/(?:MetricBar|LatencyBars|QualityBars|CanvasStrip)["']/,
    );
    expect(sharedCardSource).not.toContain("<canvas");
    expect(sharedCardSource).toContain("encodeURIComponent(node.uuid)");
  });

  it("does not render zero-value overview cards before the node store is hydrated", () => {
    expect(nodeGridSource).toContain("hydrated: storeHydrated");
    expect(nodeGridSource).toContain("!themeSettings.isReady || !storeHydrated");
    expect(nodeGridSource.indexOf("!themeSettings.isReady || !storeHydrated")).toBeLessThan(
      nodeGridSource.indexOf("const homeHeader"),
    );
    const loadingBranch = nodeGridSource.slice(
      nodeGridSource.indexOf("!themeSettings.isReady || !storeHydrated"),
      nodeGridSource.indexOf("const homeHeader"),
    );
    expect(loadingBranch).not.toContain("<HomeBrand");
    expect(loadingBranch).not.toContain("<Spinner");
    expect(homeSource).toContain("const homeReady = themeSettings.isReady && storeHydrated");
    expect(homeSource).toContain("{homeReady && <FloatingControls");
  });

  it("keeps access and initial home hydration behind one shell-owned spinner", () => {
    expect(appShellSource).toContain("useNodeStoreStatus(canHydrateHome)");
    expect(appShellSource).toContain("isCheckingAccess || isCheckingHomeData");
    expect(appShellSource).toContain("isCheckingShell ?");
    expect(routerSource).toContain('import { Home } from "@/pages/Home"');
    expect(routerSource).not.toMatch(/const Home\s*=\s*lazy/);
    expect(routerSource).toContain("element: <Home />");
  });
});
