// Line
import { lineTrend } from './lineTrend.js';
import { linePeak } from './linePeak.js';
import { lineCrossing } from './lineCrossing.js';
import { lineSeasonal } from './lineSeasonal.js';
import { lineAnomaly } from './lineAnomaly.js';
import { lineNoTrend } from './lineNoTrend.js';

// Bar
import { barCompare } from './barCompare.js';
import { barTop } from './barTop.js';
import { barDistribution } from './barDistribution.js';
import { barTrend } from './barTrend.js';
import { barOutlier } from './barOutlier.js';

// Scatter
import { scatterCorr } from './scatterCorr.js';
import { scatterOutlier } from './scatterOutlier.js';
import { scatterCluster } from './scatterCluster.js';
import { scatterShape } from './scatterShape.js';

// Histogram
import { histShape } from './histShape.js';
import { histCompare } from './histCompare.js';
import { histCompareShape } from './histCompareShape.js';
import { histTwoModes } from './histTwoModes.js';

// Boxplot
import { boxplotMedian } from './boxplotMedian.js';
import { boxplotOutlier } from './boxplotOutlier.js';
import { boxplotIQR } from './boxplotIQR.js';
import { boxplotCompare } from './boxplotCompare.js';

// Pie
import { pieProportion } from './pieProportion.js';
import { pieChange } from './pieChange.js';
import { pieCompare } from './pieCompare.js';
import { pieMinority } from './pieMinority.js';

// Heatmap
import { heatmapPeak } from './heatmapPeak.js';
import { heatmapPattern } from './heatmapPattern.js';
import { heatmapRow } from './heatmapRow.js';
import { heatmapEmpty } from './heatmapEmpty.js';

export const GENERATORS = {
  // Line
  line_trend: lineTrend, line_peak: linePeak, line_crossing: lineCrossing,
  line_seasonal: lineSeasonal, line_anomaly: lineAnomaly, line_no_trend: lineNoTrend,
  // Bar
  bar_compare: barCompare, bar_top: barTop, bar_distribution: barDistribution,
  bar_trend: barTrend, bar_outlier: barOutlier,
  // Scatter
  scatter_corr: scatterCorr, scatter_outlier: scatterOutlier,
  scatter_cluster: scatterCluster, scatter_shape: scatterShape,
  // Histogram
  hist_shape: histShape, hist_compare: histCompare,
  hist_compare_shape: histCompareShape, hist_two_modes: histTwoModes,
  // Boxplot
  boxplot_median: boxplotMedian, boxplot_outlier: boxplotOutlier,
  boxplot_iqr: boxplotIQR, boxplot_compare: boxplotCompare,
  // Pie
  pie_proportion: pieProportion, pie_change: pieChange,
  pie_compare: pieCompare, pie_minority: pieMinority,
  // Heatmap
  heatmap_peak: heatmapPeak, heatmap_pattern: heatmapPattern,
  heatmap_row: heatmapRow, heatmap_empty: heatmapEmpty,
};

export const GENERATORS_BY_TYPE = {
  line: [lineTrend, linePeak, lineCrossing, lineSeasonal, lineAnomaly, lineNoTrend],
  bar: [barCompare, barTop, barDistribution, barTrend, barOutlier],
  scatter: [scatterCorr, scatterOutlier, scatterCluster, scatterShape],
  histogram: [histShape, histCompare, histCompareShape, histTwoModes],
  boxplot: [boxplotMedian, boxplotOutlier, boxplotIQR, boxplotCompare],
  pie: [pieProportion, pieChange, pieCompare, pieMinority],
  heatmap: [heatmapPeak, heatmapPattern, heatmapRow, heatmapEmpty],
};

export function getGenerator(id) {
  return GENERATORS[id] || null;
}

export function getAllGenerators() {
  return Object.values(GENERATORS);
}
