// src/utils/chartRecommendation.js

export function recommendCharts(datasetData, xColumn, yColumn) {
  if (!datasetData || datasetData.length === 0 || !xColumn || !yColumn) {
    return ["Table"];
  }

  const sample = datasetData.slice(0, 50);

  const xValues = sample.map((row) => row[xColumn]);
  const yValues = sample.map((row) => row[yColumn]);

  const checkNumeric = (values) =>
    values.every(
      (value) =>
        value !== "" &&
        value !== null &&
        !isNaN(Number(value))
    );

  // Updated date detection
  const checkDate = (values) =>
    values.every((value) => {
      // Only strings can be dates
      if (typeof value !== "string") {
        return false;
      }

      // Numeric strings are NOT dates
      if (!isNaN(Number(value))) {
        return false;
      }

      const date = new Date(value);
      return !isNaN(date.getTime());
    });

  const xNumeric = checkNumeric(xValues);
  const yNumeric = checkNumeric(yValues);
  const xDate = checkDate(xValues);

  const xUnique = new Set(xValues).size;

  // Category + Numeric
  if (!xNumeric && yNumeric && !xDate) {
    const charts = [
      "Treemap",
      "Bar Chart",
      "Column Chart",
      "Table"
    ];

    if (xUnique <= 10) {
      charts.splice(3, 0, "Pie Chart");
    }

    return charts;
  }

  // Date + Numeric
  if (xDate && yNumeric) {
    return [
      "Line Chart",
      "Area Chart",
      "Column Chart",
      "Table"
    ];
  }

  // Numeric + Numeric
  if (xNumeric && yNumeric) {
    return [
      "Scatter Chart",
      "Line Chart",
      "Table"
    ];
  }

  // Text + Text
  if (!xNumeric && !yNumeric) {
    return [
      "Heatmap",
      "Treemap",
      "Grouped Bar Chart",
      "Table"
    ];
  }

  return ["Table"];
}
