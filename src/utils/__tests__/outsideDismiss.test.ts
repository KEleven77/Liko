import { describe, expect, it, vi } from "vitest";
import { listenForOutsideDismiss } from "../outsideDismiss";

describe("outside dismissal", () => {
  it("consumes the outside press and click before closing, even when closing removes listeners", () => {
    const target = new EventTarget();
    const dismiss = vi.fn(() => cleanup());
    const cleanup = listenForOutsideDismiss({ target, isInside: () => false, onDismiss: dismiss });
    const underlying = vi.fn();
    target.addEventListener("click", underlying);
    const press = new Event("pointerdown", { cancelable: true });
    target.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    expect(dismiss).not.toHaveBeenCalled();
    const click = new Event("click", { cancelable: true });
    target.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(dismiss).toHaveBeenCalledOnce();
    expect(underlying).not.toHaveBeenCalled();
    target.dispatchEvent(new Event("click"));
    expect(underlying).toHaveBeenCalledOnce();
  });

  it("leaves interactions inside the card untouched", () => {
    const target = new EventTarget();
    const dismiss = vi.fn();
    const cleanup = listenForOutsideDismiss({ target, isInside: () => true, onDismiss: dismiss });
    const click = new Event("click", { cancelable: true });
    target.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    expect(dismiss).not.toHaveBeenCalled();
    cleanup();
  });

  it("also consumes secondary clicks", () => {
    const target = new EventTarget();
    const dismiss = vi.fn();
    const cleanup = listenForOutsideDismiss({ target, isInside: () => false, onDismiss: dismiss });
    const click = new Event("auxclick", { cancelable: true });
    target.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(dismiss).toHaveBeenCalledOnce();
    cleanup();
  });
});
