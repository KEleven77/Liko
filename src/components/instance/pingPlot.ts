import type uPlot from "uplot";

export function updatePingPlot(
  plot: uPlot,
  tasks: { id: number }[],
  { hiddenTasks, connectNulls, yRange }: {
    hiddenTasks: Set<number>;
    connectNulls: boolean;
    yRange: [number, number];
  },
) {
  plot.batch(() => {
    tasks.forEach((task, index) => {
      const series = plot.series[index + 1];
      if (!series) return;
      const show = !hiddenTasks.has(task.id);
      if (series.show !== show) plot.setSeries(index + 1, { show });
      // setSeries only supports show/focus; rebuild paths after changing spanGaps.
      series.spanGaps = connectNulls;
    });
    plot.setScale("y", { min: yRange[0], max: yRange[1] });
    plot.redraw(true, false);
  });
}
