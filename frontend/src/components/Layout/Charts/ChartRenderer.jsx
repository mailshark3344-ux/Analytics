import React from "react";

import {
  ResponsiveContainer,

  BarChart,
  Bar,

  LineChart,
  Line,

  AreaChart,
  Area,

  ScatterChart,
  Scatter,

  PieChart,
  Pie,
  Cell,

  Treemap,

  XAxis,
  YAxis,

  Tooltip,
  Legend,

  CartesianGrid
} from "recharts";

import {
  prepareSingleMeasureChart,
  prepareCrossTab,
  prepareTreemapData
} from "../../../utils/chartDataProcessor";

function ChartRenderer({ chart, data }) {

  if (!data || data.length === 0) {
    return null;
  }

  let chartData = [];

  if (chart.x && chart.y) {
    if (chart.type === "Treemap") {
      chartData = prepareTreemapData(data, chart.x, chart.y);
    } else {
      chartData = prepareSingleMeasureChart(
        data,
        chart.x,
        chart.y
      );
    }
  }

  const colors = [
    "#2563EB",
    "#16A34A",
    "#DC2626",
    "#9333EA",
    "#EA580C",
    "#0891B2",
    "#DB2777"
  ];

  const commonProps = {
    margin: {
      top: 20,
      right: 20,
      left: 10,
      bottom: 20
    }
  };

  const palette = [
    "#DCEAFE",
    "#DBEAFE",
    "#D9F99D",
    "#BBF7D0",
    "#BFDBFE",
    "#FED7AA",
    "#FECACA",
    "#FDE68A",
    "#C7D2FE",
    "#E9D5FF"
  ];

  const renderTreemapContent = (props) => {
    const {
      x,
      y,
      width,
      height,
      index,
      name,
      value
    } = props;

    const fill = palette[index % palette.length];

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          stroke="#fff"
          fill={fill}
        />
        {width > 60 && height > 20 && (
          <text
            x={x + 6}
            y={y + 18}
            fill="#0f172a"
            fontSize={12}
            fontWeight="600"
          >
            {name}
          </text>
        )}
        {width > 60 && height > 36 && (
          <text
            x={x + 6}
            y={y + 34}
            fill="#334155"
            fontSize={11}
          >
            {value}
          </text>
        )}
      </g>
    );
  };

  // ---------------- TABLE ----------------

  if (chart.type === "Table") {
    return (
      <div
        style={{
          height: "100%",
          overflow: "auto"
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >
          <thead>
            <tr>
              {Object.keys(data[0]).map((column) => (
                <th
                  key={column}
                  style={{
                    padding: 12,
                    background: "#F3F4F6",
                    position: "sticky",
                    top: 0,
                    textAlign: "left",
                    borderBottom: "1px solid #ddd"
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.slice(0, 50).map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td
                    key={i}
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #eee"
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // No chart data for chart types that rely on single-measure aggregation
  const chartDataTypes = ["Bar Chart", "Column Chart", "Line Chart", "Area Chart", "Pie Chart", "Scatter Chart", "Treemap"];

  if (chartDataTypes.includes(chart.type) && chartData.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#777"
        }}
      >
        No data available
      </div>
    );
  }

  if (chart.type === "Heatmap") {
    const cross = prepareCrossTab(data, chart.x, chart.y);
    if (!cross || cross.length === 0) {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#777"
          }}
        >
          No data available
        </div>
      );
    }

    const yCategories = new Set();
    cross.forEach((r) => Object.keys(r).forEach((k) => { if (k !== "name") yCategories.add(k); }));
    const yList = Array.from(yCategories);

    if (yList.length === 0) {
      const seriesKeys = Object.keys(cross[0]).filter((k) => k !== "name");
      return (
        <div style={{ height: '100%' }}>
          <div style={{ padding: 8, color: '#555' }}>Heatmap had no categorical buckets — showing grouped-bar instead</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cross} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {seriesKeys.map((key, i) => (
                <Bar key={key} dataKey={key} stackId={null} fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    let maxVal = 0;
    cross.forEach((row) => {
      yList.forEach((k) => {
        const v = Number(row[k]) || 0;
        if (v > maxVal) maxVal = v;
      });
    });

    return (
      <div style={{ overflow: "auto", height: "100%" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: 8, background: "#F3F4F6", borderBottom: "1px solid #ddd" }}>{chart.x} \ {chart.y}</th>
              {yList.map((y) => (
                <th key={y} style={{ padding: 8, background: "#F3F4F6", borderBottom: "1px solid #ddd", textAlign: "center" }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cross.map((row, ri) => (
              <tr key={ri}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.name}</td>
                {yList.map((yc, ci) => {
                  const val = Number(row[yc]) || 0;
                  const intensity = maxVal > 0 ? (val / maxVal) : 0;
                  const bg = `rgba(37,99,235,${0.15 + 0.85 * intensity})`;
                  return (
                    <td key={ci} style={{ padding: 8, textAlign: "center", background: bg, borderBottom: "1px solid #eee" }}>{val}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">

      {/* GROUPED BAR CHART (categorical X + categorical Y -> counts) */}

      {chart.type === "Grouped Bar Chart" && (() => {
        const cross = prepareCrossTab(data, chart.x, chart.y);
        if (!cross || cross.length === 0) return (
          <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "#777" }}>No data available</div>
        );

        // determine series keys (all keys except 'name')
        const seriesKeys = Object.keys(cross[0]).filter(k => k !== 'name');

        return (
          <BarChart data={cross} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId={null} fill={colors[i % colors.length]} />
            ))}
          </BarChart>
        );
      })()}

        {/* HEATMAP (categorical X vs categorical Y counts) */}

{chart.type === "Heatmap" && (() => {
  const cross = prepareCrossTab(data, chart.x, chart.y);
  if (!cross || cross.length === 0) return (
    <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "#777" }}>No data available</div>
  );

  // collect ordered y categories
  const yCategories = new Set();
  cross.forEach(r => Object.keys(r).forEach(k => { if (k !== 'name') yCategories.add(k); }));
  const yList = Array.from(yCategories);

  // If there's no cross-tab y categories, fall back to grouped-bar rendering
  if (yList.length === 0) {
    const seriesKeys = Object.keys(cross[0]).filter(k => k !== 'name');
    return (
      <div style={{ height: '100%' }}>
        <div style={{ padding: 8, color: '#555' }}>Heatmap had no categorical buckets — showing grouped-bar instead</div>
        <BarChart data={cross} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {seriesKeys.map((key, i) => (
            <Bar key={key} dataKey={key} stackId={null} fill={colors[i % colors.length]} />
          ))}
        </BarChart>
      </div>
    );
  }

  // compute max for scaling
  let maxVal = 0;
  cross.forEach(r => {
    yList.forEach(k => {
      const v = Number(r[k]) || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: 8, background: '#F3F4F6', borderBottom: '1px solid #ddd' }}>{chart.x} \ {chart.y}</th>
            {yList.map(y => (
              <th key={y} style={{ padding: 8, background: '#F3F4F6', borderBottom: '1px solid #ddd', textAlign: 'center' }}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cross.map((row, ri) => (
            <tr key={ri}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.name}</td>
              {yList.map((yc, ci) => {
                const val = Number(row[yc]) || 0;
                const intensity = maxVal > 0 ? (val / maxVal) : 0;
                const bg = `rgba(37,99,235,${0.15 + 0.85 * intensity})`;
                return (
                  <td key={ci} style={{ padding: 8, textAlign: 'center', background: bg, borderBottom: '1px solid #eee' }}>{val}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
})}

      {/* BAR CHART */}

      {chart.type === "Bar Chart" && (
        <BarChart data={chartData} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Bar
            dataKey={chart.y}
            fill="#2563EB"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      )}

      {/* COLUMN CHART */}

      {chart.type === "Column Chart" && (
        <BarChart data={chartData} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Bar
            dataKey={chart.y}
            fill="#16A34A"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      )}

      {/* LINE CHART */}

      {chart.type === "Line Chart" && (
        <LineChart data={chartData} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey={chart.y}
            stroke="#9333EA"
            strokeWidth={3}
          />
        </LineChart>
      )}

      {/* AREA CHART */}

      {chart.type === "Area Chart" && (
        <AreaChart data={chartData} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />

          <Area
            type="monotone"
            dataKey={chart.y}
            stroke="#2563EB"
            fill="#93C5FD"
          />
        </AreaChart>
      )}

      {/* PIE CHART */}

      {chart.type === "Pie Chart" && (
        <PieChart>
          <Pie
            data={chartData}
            dataKey={chart.y}
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label
          >
            {chartData.map((item, index) => (
              <Cell
                key={index}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      )}

      {/* SCATTER CHART */}

      {chart.type === "Scatter Chart" && (
        <ScatterChart margin={commonProps.margin}>
          <CartesianGrid />

          <XAxis dataKey="name" />

          <YAxis dataKey={chart.y} />

          <Tooltip />

          <Scatter
            data={chartData}
            dataKey={chart.y}
            fill="#DC2626"
          />
        </ScatterChart>
      )}

      {/* TREEMAP */}

      {chart.type === "Treemap" && (
        <Treemap
          data={chartData}
          dataKey="value"
          nameKey="name"
          content={renderTreemapContent}
          aspectRatio={4 / 3}
        />
      )}

    </ResponsiveContainer>
  );
}

export default ChartRenderer;