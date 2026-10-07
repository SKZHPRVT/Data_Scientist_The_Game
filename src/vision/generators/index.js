import { lineTrend } from './lineTrend.js';
import { linePeak } from './linePeak.js';
import { lineCrossing } from './lineCrossing.js';
import { lineSeasonal } from './lineSeasonal.js';
import { barCompare } from './barCompare.js';
import { barTop } from './barTop.js';
import { barDistribution } from './barDistribution.js';
import { scatterCorr } from './scatterCorr.js';
import { scatterOutlier } from './scatterOutlier.js';
import { histShape } from './histShape.js';
import { histCompare } from './histCompare.js';
import { boxplotMedian } from './boxplotMedian.js';
import { boxplotOutlier } from './boxplotOutlier.js';
import { pieProportion } from './pieProportion.js';
import { pieChange } from './pieChange.js';
import { heatmapPeak } from './heatmapPeak.js';
import { heatmapPattern } from './heatmapPattern.js';

export const GENERATORS = {
  line_trend: lineTrend,
  line_peak: linePeak,
  line_crossing: lineCrossing,
  line_seasonal: lineSeasonal,
  bar_compare: barCompare,
  bar_top: barTop,
  bar_distribution: barDistribution,
  scatter_corr: scatterCorr,
  scatter_outlier: scatterOutlier,
  hist_shape: histShape,
  hist_compare: histCompare,
  boxplot_median: boxplotMedian,
  boxplot_outlier: boxplotOutlier,
  pie_proportion: pieProportion,
  pie_change: pieChange,
  heatmap_peak: heatmapPeak,
  heatmap_pattern: heatmapPattern,
};

export const GENERATORS_BY_TYPE = {
  line: [lineTrend, linePeak, lineCrossing, lineSeasonal],
  bar: [barCompare, barTop, barDistribution],
  scatter: [scatterCorr, scatterOutlier],
  histogram: [histShape, histCompare],
  boxplot: [boxplotMedian, boxplotOutlier],
  pie: [pieProportion, pieChange],
  heatmap: [heatmapPeak, heatmapPattern],
};

export function getGenerator(id) {
  return GENERATORS[id] || null;
}

export function getAllGenerators() {
  return Object.values(GENERATORS);
}
