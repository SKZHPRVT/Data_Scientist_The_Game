import { lineTrend } from './lineTrend.js';
import { linePeak } from './linePeak.js';
import { lineCrossing } from './lineCrossing.js';
import { lineSeasonal } from './lineSeasonal.js';

export const GENERATORS = {
  line_trend: lineTrend,
  line_peak: linePeak,
  line_crossing: lineCrossing,
  line_seasonal: lineSeasonal,
};

export const GENERATORS_BY_TYPE = {
  line: [lineTrend, linePeak, lineCrossing, lineSeasonal],
  bar: [],
  scatter: [],
  histogram: [],
  boxplot: [],
  pie: [],
  heatmap: [],
};

export function getGenerator(id) {
  return GENERATORS[id] || null;
}

export function getAllGenerators() {
  return Object.values(GENERATORS);
}
