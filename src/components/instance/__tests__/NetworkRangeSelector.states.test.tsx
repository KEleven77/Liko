import { isValidElement, type ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { NetworkRangeSelector } from "../NetworkRangeSelector";
import { buildPingTimeRangeOptions } from "../chartShared";

const hooks = vi.hoisted(() => ({
  states: [] as unknown[],
  cursor: 0,
  effects: [] as (() => void)[],
  deps: [] as unknown[],
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useId: () => "range-error",
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.states)) hooks.states[index] = initial;
    return [hooks.states[index], (value: unknown) => { hooks.states[index] = value; }];
  },
  useEffect: (effect: () => void, deps: unknown[]) => {
    if (deps.some((value, index) => !Object.is(value, hooks.deps[index]))) hooks.effects.push(effect);
    hooks.deps = deps;
  },
}));

const onChange = vi.fn();
function render(value = 48, retention = 168) {
  hooks.cursor = 0;
  const tree = NetworkRangeSelector({ ranges: buildPingTimeRangeOptions(retention), value, onChange });
  hooks.effects.splice(0).forEach((effect) => effect());
  return tree;
}

function input(node: ReactNode): Record<string, unknown> | undefined {
  if (Array.isArray(node)) return node.map(input).find(Boolean);
  if (!isValidElement<{ children?: ReactNode }>(node)) return;
  if (node.type === "input") return node.props;
  return input(node.props.children);
}

function changeDraft(draft: string, value = 48, retention = 168) {
  const props = input(render(value, retention))!;
  (props.onChange as (event: unknown) => void)({ target: { value: draft } });
  return input(render(value, retention))!;
}

beforeEach(() => {
  hooks.states = []; hooks.cursor = 0; hooks.effects = []; hooks.deps = [];
  onChange.mockClear();
});

it("refreshes the custom input when the parent changes its duration", () => {
  render();
  changeDraft("72");
  render(6, 12);
  expect(input(render(6, 12))).toMatchObject({ value: "6", max: 12, "aria-invalid": false });
});

it("validates a draft against the latest retention before committing", () => {
  render(48, 48);
  const invalid = changeDraft("49", 48, 48);
  (invalid.onBlur as () => void)();
  expect(onChange).not.toHaveBeenCalled();
  expect(input(render(48, 48))).toMatchObject({ "aria-invalid": true, "aria-describedby": "range-error" });
  const valid = changeDraft("36", 48, 48);
  (valid.onBlur as () => void)();
  expect(onChange).toHaveBeenCalledExactlyOnceWith(36);
});

it("does not submit the committed duration again on blur after Enter", () => {
  render();
  const props = changeDraft("72");
  const preventDefault = vi.fn();
  (props.onKeyDown as (event: unknown) => void)({ key: "Enter", preventDefault });
  expect(preventDefault).toHaveBeenCalledOnce();
  render(72);
  (input(render(72))!.onBlur as () => void)();
  expect(onChange).toHaveBeenCalledExactlyOnceWith(72);
});
