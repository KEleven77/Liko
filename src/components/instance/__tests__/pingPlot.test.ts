import type uPlot from "uplot";
import { expect, it, vi } from "vitest";
import { updatePingPlot } from "../pingPlot";

it("updates visibility, gaps and the y range without replacing the plot or data", () => {
  const series = [{}, { show: true, spanGaps: false }, { show: true, spanGaps: false }];
  const setSeries = vi.fn((index: number, { show }: { show: boolean }) => { series[index].show = show; });
  const setScale = vi.fn();
  const redraw = vi.fn();
  const plot = { series, setSeries, setScale, redraw, batch: (run: () => void) => run() } as unknown as uPlot;
  const tasks = [{ id: 12 }, { id: 34 }];
  updatePingPlot(plot, tasks, { hiddenTasks: new Set([34]), connectNulls: true, yRange: [10, 80] });
  expect(setSeries).toHaveBeenCalledExactlyOnceWith(2, { show: false });
  expect(series[1].spanGaps).toBe(true);
  expect(series[2].spanGaps).toBe(true);
  expect(setScale).toHaveBeenCalledWith("y", { min: 10, max: 80 });
  expect(setScale).not.toHaveBeenCalledWith("x", expect.anything());
  expect(redraw).toHaveBeenCalledWith(true, false);
  setSeries.mockClear();
  updatePingPlot(plot, tasks, { hiddenTasks: new Set([34]), connectNulls: false, yRange: [20, 50] });
  expect(setSeries).not.toHaveBeenCalled();
  expect(series[1].spanGaps).toBe(false);
});
