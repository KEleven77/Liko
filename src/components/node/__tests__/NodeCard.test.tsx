import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MiniNodeCard } from "../MiniNodeCard";

vi.mock("../CompactNodeCard", () => ({
  CompactNodeCard: (props: { uuid: string; size?: string; showTodayTraffic?: boolean }) => (
    <div data-uuid={props.uuid} data-size={props.size} data-traffic={String(props.showTodayTraffic)} />
  ),
}));

describe("mini card shared layout", () => {
  it("uses the mini layout and preserves the today-traffic setting", () => {
    const html = renderToStaticMarkup(<MiniNodeCard uuid="mini-node" showTodayTraffic={false} />);
    expect(html).toContain('data-uuid="mini-node"');
    expect(html).toContain('data-size="mini"');
    expect(html).toContain('data-traffic="false"');
  });
});
