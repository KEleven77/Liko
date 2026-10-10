import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompactNodeCard } from "../CompactNodeCard";

const model = vi.hoisted(() => vi.fn(() => ({ node: undefined })));
vi.mock("@/hooks/useNodeCardModel", () => ({ useNodeCardModel: model }));
vi.mock("@/hooks/useThemeSettings", () => ({ useThemeSettings: () => ({ isReady: true }) }));

describe("card task limits", () => {
  beforeEach(() => model.mockClear());

  it.each(["mini", "compact", "large"] as const)("limits %s card tasks before deriving buckets", (size) => {
    renderToStaticMarkup(<MemoryRouter><CompactNodeCard uuid="node" size={size} /></MemoryRouter>);
    expect(model).toHaveBeenCalledWith("node", {
      pingBucketCount: 20,
      includeMultiPing: true,
      multiPingLimit: size === "mini" ? 1 : 6,
    });
  });
});
