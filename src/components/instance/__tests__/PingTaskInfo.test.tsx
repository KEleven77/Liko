import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PingTaskInfo } from "../PingTaskInfo";

it("exposes separate accessible buttons for task information and dismissal", () => {
  const html = renderToStaticMarkup(<PingTaskInfo label="中国电信" text={"当前 20 ms\n样本 120 | 间隔 60s"} />);
  expect(html).toContain('aria-label="查看 中国电信 探测任务信息"');
  expect(html.toLowerCase()).toContain('popovertarget=');
  expect(html).toContain('popover="auto"');
  expect(html).toContain('role="dialog"');
  expect(html.toLowerCase()).toContain('popovertargetaction="hide"');
  expect(html).toContain("样本 120 | 间隔 60s");
});
