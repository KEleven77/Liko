const listeners = new Set<() => void>();

export function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribePageVisibility(listener: () => void) {
  if (typeof document === "undefined") return () => undefined;
  const target = document;
  if (listeners.size === 0) target.addEventListener("visibilitychange", notify);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) target.removeEventListener("visibilitychange", notify);
  };
}
