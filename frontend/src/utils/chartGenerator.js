// src/utils/chartGenerator.js

import { analyzeDataset } from "./dataAnalyzer";

export function generateDefaultCharts(datasetData) {
  if (!datasetData || datasetData.length === 0) return [];

  const { numericColumns, textColumns, dateColumns } = analyzeDataset(datasetData);

  const charts = [];
  const pushChart = (c) => {
    const exists = charts.some((ch) => ch.title === c.title && ch.x === c.x && ch.y === c.y);
    if (!exists) charts.push(c);
  };

  // Heuristics: look for business-like columns
  const amountColumn = numericColumns.find((col) => ["amount", "sales", "goals", "value"].some(k => col.toLowerCase().includes(k)));
  const profitColumn = numericColumns.find((col) => col.toLowerCase().includes("profit"));
  const categoryColumn = textColumns.find((col) => !col.toLowerCase().includes("id"));

  // 1. amount/category
  if (categoryColumn && amountColumn) {
    pushChart({ title: `${amountColumn} by ${categoryColumn}`, type: "Column Chart", x: categoryColumn, y: amountColumn, size: "medium" });
    const uniqueCount = new Set(datasetData.map(r => r[categoryColumn])).size;
    if (uniqueCount <= 10) pushChart({ title: `${amountColumn} Distribution`, type: "Pie Chart", x: categoryColumn, y: amountColumn, size: "small" });
  }

  // 2. profit/category
  if (categoryColumn && profitColumn) {
    pushChart({ title: `Profit by ${categoryColumn}`, type: "Bar Chart", x: categoryColumn, y: profitColumn, size: "medium" });
  }

  // 3. time series
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    pushChart({ title: `${numericColumns[0]} Trend Over Time`, type: "Line Chart", x: dateColumns[0], y: numericColumns[0], size: "large" });
  }

  // 4. numeric vs numeric
  if (numericColumns.length >= 2) {
    pushChart({ title: `${numericColumns[0]} vs ${numericColumns[1]}`, type: "Scatter Chart", x: numericColumns[0], y: numericColumns[1], size: "medium" });
    if (textColumns.length > 0) {
      pushChart({ title: `${numericColumns[0]} by ${textColumns[0]}`, type: "Column Chart", x: textColumns[0], y: numericColumns[0], size: "medium" });
      pushChart({ title: `${numericColumns[0]} by ${textColumns[0]} (Treemap)`, type: "Treemap", x: textColumns[0], y: numericColumns[0], size: "medium" });
    }
  }

  // 5. any text + numeric pair may also work as a treemap
  if (textColumns.length > 0 && numericColumns.length > 0) {
    pushChart({ title: `${numericColumns[0]} by ${textColumns[0]} (Treemap)`, type: "Treemap", x: textColumns[0], y: numericColumns[0], size: "medium" });
  }

  // 6. text vs text -> grouped bar (counts)
  if (textColumns.length >= 2) {
    // determine cardinalities
    const xVals = new Set(datasetData.map(r => r[textColumns[0]]));
    const yVals = new Set(datasetData.map(r => r[textColumns[1]]));

    // prefer heatmap when both sides are not too large
    if (xVals.size <= 30 && yVals.size <= 30) {
      pushChart({ title: `${textColumns[1]} by ${textColumns[0]} (Heatmap)`, type: "Heatmap", x: textColumns[0], y: textColumns[1], size: "large" });
    } else {
      pushChart({ title: `${textColumns[1]} counts by ${textColumns[0]}`, type: "Grouped Bar Chart", x: textColumns[0], y: textColumns[1], size: "medium" });
    }
  }

  // 5. Fallbacks: create charts for top numeric columns
  if (charts.length === 0) {
    if (textColumns.length > 0 && numericColumns.length > 0) {
      pushChart({ title: `${numericColumns[0]} by ${textColumns[0]}`, type: "Column Chart", x: textColumns[0], y: numericColumns[0], size: "medium" });
    }
  }

  // Always include a dataset preview table (last)
  pushChart({ title: "Dataset Preview", type: "Table", x: null, y: null, size: "large" });

  // limit to first 6 charts
  return charts.slice(0, 6);
}
