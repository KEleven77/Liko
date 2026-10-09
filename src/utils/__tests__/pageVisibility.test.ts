import { afterEach, describe, expect, it, vi } from "vitest";
import { isPageVisible, subscribePageVisibility } from "../pageVisibility";

afterEach(() => vi.unstubAllGlobals());

describe("shared page visibility subscription", () => {
  it("shares one browser listener and removes it after the last subscriber", () => {
    const page = Object.assign(new EventTarget(), { visibilityState: "visible" });
    vi.stubGlobal("document", page);
    const add = vi.spyOn(page, "addEventListener");
    const remove = vi.spyOn(page, "removeEventListener");
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = subscribePageVisibility(first);
    const stopSecond = subscribePageVisibility(second);
    expect(add).toHaveBeenCalledTimes(1);
    expect(isPageVisible()).toBe(true);
    page.visibilityState = "hidden";
    page.dispatchEvent(new Event("visibilitychange"));
    expect(isPageVisible()).toBe(false);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    stopFirst();
    expect(remove).not.toHaveBeenCalled();
    page.visibilityState = "visible";
    page.dispatchEvent(new Event("visibilitychange"));
    expect(isPageVisible()).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    stopSecond();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("is safe without a browser document", () => {
    vi.stubGlobal("document", undefined);
    expect(isPageVisible()).toBe(true);
    subscribePageVisibility(vi.fn())();
  });
});
