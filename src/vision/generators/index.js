import { lineTrend } from './lineTrend.js';

export const GENERATORS = {
  line_trend: lineTrend,
};

export const GENERATORS_BY_TYPE = {
  line: [lineTrend],
};

export function getGenerator(id) {
  return GENERATORS[id] || null;
}

export function getAllGenerators() {
  return Object.values(GENERATORS);
}
