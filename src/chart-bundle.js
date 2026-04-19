// Minimal Chart.js bundle — registers only the primitives actually used
// by this app (bar charts with category + linear scales, plus tooltip
// and legend plugins). Eliminates the ~80KB of unused chart types
// that ship with the default chart.umd.min.js build.
//
// Exposed as window.Chart so the existing index.html call-sites
// (new Chart(...), Chart.getChart(ctx), Chart.defaults, etc.) all work
// unchanged.

import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

if (typeof window !== 'undefined') {
  window.Chart = Chart;
}
