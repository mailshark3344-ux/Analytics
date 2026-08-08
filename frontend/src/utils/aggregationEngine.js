export const aggregationFunctions = {
  SUM: "Sum",
  AVERAGE: "Average",
  COUNT: "Count",
  COUNT_DISTINCT: "Count Distinct",
  MINIMUM: "Minimum",
  MAXIMUM: "Maximum"
};

function getNumericValues(rows, columnName) {
  return rows
    .map((row) => row[columnName])
    .filter((value) => value !== undefined && value !== null && value !== "");
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

export function applyAggregation(rows, columnName, aggregation) {
  if (!rows || rows.length === 0 || !columnName) {
    return 0;
  }

  const values = getNumericValues(rows, columnName);

  switch (aggregation) {
    case aggregationFunctions.SUM:
      return values.reduce((total, value) => total + toNumber(value), 0);
    case aggregationFunctions.AVERAGE:
      if (values.length === 0) return 0;
      return values.reduce((total, value) => total + toNumber(value), 0) / values.length;
    case aggregationFunctions.COUNT:
      return values.length;
    case aggregationFunctions.COUNT_DISTINCT:
      return new Set(values).size;
    case aggregationFunctions.MINIMUM:
      if (values.length === 0) return 0;
      return Math.min(...values.map((value) => toNumber(value)));
    case aggregationFunctions.MAXIMUM:
      if (values.length === 0) return 0;
      return Math.max(...values.map((value) => toNumber(value)));
    default:
      return 0;
  }
}
