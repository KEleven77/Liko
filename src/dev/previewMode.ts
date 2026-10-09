const PREVIEW_SESSION_KEY = "sao-dev-preview";
const PREVIEW_OPTIONS = ["mock", "admin", "customPing", "multiPing", "morePing"] as const;

export function getDevPreviewParams(): URLSearchParams {
  const current = new URLSearchParams(window.location.search);
  if (!import.meta.env.DEV) return current;
  try {
    if (current.get("mock") === "0") {
      sessionStorage.removeItem(PREVIEW_SESSION_KEY);
      return current;
    }
    const saved = new URLSearchParams(sessionStorage.getItem(PREVIEW_SESSION_KEY) ?? "");
    for (const key of PREVIEW_OPTIONS) {
      if (current.has(key)) saved.set(key, current.get(key)!);
    }
    if (saved.get("mock") === "1") {
      sessionStorage.setItem(PREVIEW_SESSION_KEY, saved.toString());
      return saved;
    }
  } catch {
    // 禁用存储时仍可通过 URL 显式启用预览。
  }
  return current;
}
