import { describe, expect, it } from "vitest";
import {
  assignHomepageMultiPingTask,
  HOMEPAGE_MULTI_PING_MAX_COUNT,
  HOMEPAGE_MULTI_PING_MIN_COUNT,
  isHomepageMultiPingConfigured,
  normalizeHomepageMultiPingTaskIds,
  invertHomepagePingTaskBindings,
  hasHomepagePingTaskBinding,
  normalizeHomepagePingTaskBindings,
  resolveHomepagePingSelections,
  resolveIpv6HomepageTaskIds,
  resolveHomepagePingTaskIdsByClient,
} from "@/utils/pingTasks";

describe("IPv6 homepage defaults", () => {
  const tasks = [
    { id: 11, target: "1.1.1.1", name: "v4", clients: ["node"], weight: 1 },
    { id: 12, target: "8.8.8.8", name: "v4", clients: ["node"], weight: 2 },
    { id: 13, target: "9.9.9.9:80", name: "v4", clients: ["node"], weight: 3 },
    { id: 14, target: "1.0.0.1", name: "backup", clients: ["node"], weight: 4 },
    { id: 61, target: "2001:db8::1", name: "v6", clients: ["node"], weight: 6 },
    { id: 62, target: "v6.example.com", name: "联通V6", clients: ["node"], weight: 7 },
    { id: 63, target: "2001:db8::3", name: "v6", clients: ["node"], weight: 8 },
    { id: 64, target: "2001:db8::4", name: "v6", clients: ["other"], weight: 0 },
  ];
  it("selects three IPv4 and three assigned IPv6 tasks using actual task IDs", () => {
    expect(resolveIpv6HomepageTaskIds("node", "2001:db8::10", [12, 11, 13], tasks))
      .toEqual([12, 11, 13, 61, 62, 63]);
  });
  it("keeps defaults without an IPv6 address or an assigned IPv6 monitor", () => {
    const defaults = [11, 12, 13];
    expect(resolveIpv6HomepageTaskIds("node", "", defaults, tasks)).toBe(defaults);
    expect(resolveIpv6HomepageTaskIds("unbound", "2001:db8::10", defaults, tasks)).toBe(defaults);
  });
  it("only includes available monitors when fewer than six are assigned", () => {
    expect(resolveIpv6HomepageTaskIds("node", "2001:db8::10", [11, 12, 13], [tasks[0]!, tasks[4]!]))
      .toEqual([11, 61]);
  });
  it("uses configured IPv6 order and reserves explicit slots during automatic selection", () => {
    expect(resolveIpv6HomepageTaskIds("node", "2001:db8::10", [11, 12, 13], tasks, [63, 61, 62]))
      .toEqual([11, 12, 13, 63, 61, 62]);
    expect(resolveIpv6HomepageTaskIds("node", "2001:db8::10", [11, 12, 13], tasks, [0, 61, 0]))
      .toEqual([11, 12, 13, 62, 61, 63]);
  });
  it("does not replace an unavailable explicitly configured IPv6 task", () => {
    expect(resolveIpv6HomepageTaskIds("node", "2001:db8::10", [11, 12, 13], tasks, [64, 63, 62]))
      .toEqual([11, 12, 13, 63, 62]);
  });
});

describe("homepage ping task bindings", () => {
  it("accepts only positive decimal safe integers", () => {
    expect(
      normalizeHomepagePingTaskBindings({
        "1e3": ["exponent"],
        "1.5": ["fraction"],
        "0x10": ["hex"],
        "9007199254740992": ["unsafe"],
        "42": ["valid"],
      }),
    ).toEqual({ "42": ["valid"] });
  });

  it("merges IDs that normalize to the same decimal integer", () => {
    expect(
      normalizeHomepagePingTaskBindings({
        "01": ["node-a", "node-b"],
        "1": ["node-b", "node-c"],
      }),
    ).toEqual({ "1": ["node-b", "node-c", "node-a"] });
  });

  it("inverts normalized bindings and gives the lowest task ID precedence", () => {
    expect(
      invertHomepagePingTaskBindings({
        "02": ["node-a"],
        "1": ["node-a", "node-b"],
      }),
    ).toEqual(
      new Map([
        ["node-a", 1],
        ["node-b", 1],
      ]),
    );
  });

  it("reuses the inverted binding index for a stable bindings object", () => {
    const bindings = { "8": ["node-a"], "9": ["node-b"] };
    expect(invertHomepagePingTaskBindings(bindings)).toBe(
      invertHomepagePingTaskBindings(bindings),
    );
  });

  it("reports a binding before overview data has loaded", () => {
    const bindings = { "8": ["node-a"], "9": ["node-b"] };
    expect(hasHomepagePingTaskBinding("node-a", bindings)).toBe(true);
    expect(hasHomepagePingTaskBinding("node-c", bindings)).toBe(false);
  });

  it("normalizes the multi-task selection up to max count in display order", () => {
    expect(normalizeHomepageMultiPingTaskIds(["3", 1, 3, 2, 4])).toEqual([3, 1, 2, 4]);
    expect(
      normalizeHomepageMultiPingTaskIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(HOMEPAGE_MULTI_PING_MAX_COUNT).toBe(8);
    expect(HOMEPAGE_MULTI_PING_MIN_COUNT).toBe(1);
  });

  it("checks whether homepage multi-ping is configured", () => {
    expect(isHomepageMultiPingConfigured([])).toBe(false);
    expect(isHomepageMultiPingConfigured([1])).toBe(true);
    expect(isHomepageMultiPingConfigured([1, 2, 3, 4, 5, 6])).toBe(true);
  });

  it("assigns tasks to slots and swaps when selecting an already chosen task", () => {
    expect(assignHomepageMultiPingTask([1, 2, 3], 1, 4)).toEqual([1, 4, 3]);
    expect(assignHomepageMultiPingTask([1, 2, 3], 0, 2)).toEqual([2, 1, 3]);
    expect(assignHomepageMultiPingTask([1, 2, 3], 5, 4)).toEqual([1, 2, 3]);
  });

  it("uses the same three global tasks for every node and otherwise keeps single bindings", () => {
    const bindings = { "8": ["node-a"], "9": ["node-b"] };
    expect(
      resolveHomepagePingTaskIdsByClient(["node-a", "node-b"], bindings, [3, 1, 2]),
    ).toEqual(
      new Map([
        ["node-a", [3, 1, 2]],
        ["node-b", [3, 1, 2]],
      ]),
    );
    expect(resolveHomepagePingTaskIdsByClient(["node-a", "node-b"], bindings)).toEqual(
      new Map([
        ["node-a", [8]],
        ["node-b", [9]],
      ]),
    );
  });

  it("requests the selected tasks for both global and single binding modes", () => {
    const multiSelections = resolveHomepagePingSelections(
      ["node-a", "node-b"],
      { "8": ["node-a"], "9": ["node-b"] },
      [3, 1, 2],
    );

    expect(multiSelections.singleTaskIdsByClient).toEqual(new Map());
    expect(multiSelections.multiTaskIdsByClient).toEqual(
      new Map([
        ["node-a", [3, 1, 2]],
        ["node-b", [3, 1, 2]],
      ]),
    );
    expect(multiSelections.requestedTaskIdsByClient).toEqual(
      multiSelections.multiTaskIdsByClient,
    );

    const singleSelections = resolveHomepagePingSelections(
      ["node-a", "node-b"],
      { "8": ["node-a"], "9": ["node-b"] },
    );
    expect(singleSelections.singleTaskIdsByClient).toEqual(
      new Map([
        ["node-a", [8]],
        ["node-b", [9]],
      ]),
    );
    expect(singleSelections.multiTaskIdsByClient).toEqual(new Map());
    expect(singleSelections.requestedTaskIdsByClient).toEqual(
      singleSelections.singleTaskIdsByClient,
    );
  });
  it("inherits three defaults unless a server has its own selection", () => {
    const selections = resolveHomepagePingSelections(
      ["default", "single", "four", "hidden"], {}, [1, 2, 3],
      { single: [4], four: [1, 2, 3, 4], hidden: [] },
    );
    expect(selections.requestedTaskIdsByClient).toEqual(new Map([
      ["default", [1, 2, 3]], ["single", [4]],
      ["four", [1, 2, 3, 4]], ["hidden", []],
    ]));
  });

  it("includes both legacy bindings and server overrides in requests", () => {
    const selections = resolveHomepagePingSelections(
      ["legacy", "custom"], { "8": ["legacy"] }, [], { custom: [1, 4] },
    );
    expect(selections.singleTaskIdsByClient).toEqual(new Map([["legacy", [8]]]));
    expect(selections.multiTaskIdsByClient).toEqual(new Map([["custom", [1, 4]]]));
    expect(selections.requestedTaskIdsByClient).toEqual(new Map([
      ["legacy", [8]], ["custom", [1, 4]],
    ]));
  });
});
