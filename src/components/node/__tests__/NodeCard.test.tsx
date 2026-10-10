import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NodeCard } from "../NodeCard";
import { MiniNodeCard } from "../MiniNodeCard";

vi.mock("../CompactNodeCard", () => ({
  CompactNodeCard: (props: { uuid: string; size?: string; showTodayTraffic?: boolean }) => (
    <div data-uuid={props.uuid} data-size={props.size} data-traffic={String(props.showTodayTraffic)} />
  ),
}));

describe("large card shared layout", () => {
  it("uses the large layout and preserves the today-traffic setting", () => {
    const html = renderToStaticMarkup(<NodeCard uuid="test-node" showTodayTraffic={false} />);
    expect(html).toContain('data-uuid="test-node"');
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-traffic="false"');
  });
  it("uses the mini layout and preserves the today-traffic setting", () => {
    const html = renderToStaticMarkup(<MiniNodeCard uuid="mini-node" showTodayTraffic={false} />);
    expect(html).toContain('data-uuid="mini-node"');
    expect(html).toContain('data-size="mini"');
    expect(html).toContain('data-traffic="false"');
  });
});
