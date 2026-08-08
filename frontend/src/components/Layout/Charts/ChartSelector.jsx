import React, { useCallback, useMemo } from "react";

import {
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography
} from "@mui/material";

import { recommendCharts } from "../../../utils/chartRecommendation";

function ChartSelector({
    chart,
    index,
    updateChart,
    datasetData
}) {
    // compute safe columns/numericColumns before hooks so hooks are called
    // in the same order on every render (avoids react-hooks/rules-of-hooks ESLint errors)
    const columns = useMemo(() => {
        return datasetData && datasetData.length > 0 ? Object.keys(datasetData[0]) : [];
    }, [datasetData]);

    const isNumericColumn = useCallback((columnName) => {
        if (!datasetData || datasetData.length === 0) return false;
        const values = datasetData
            .slice(0, 20)
            .map((row) => row[columnName]);

        return values.every(
            (value) =>
                value !== "" &&
                value !== null &&
                !isNaN(Number(value))
        );
    }, [datasetData]);

    const chartTypes = recommendCharts(
        datasetData,
        chart.x,
        chart.y
    );

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);

    const handleDrop = useCallback(
        (axis) => (event) => {
            event.preventDefault();
            const columnName = event.dataTransfer.getData("text/plain");
            if (!columnName || !columns.includes(columnName)) {
                return;
            }

            const newX = axis === "x" ? columnName : chart.x;
            const newY = axis === "y" ? columnName : chart.y;

            // If dropping onto Y: allow non-numeric if recommendations support it
            if (axis === "y" && !isNumericColumn(columnName)) {
                const rec = recommendCharts(datasetData, newX, newY);
                const allowedTypes = ["Grouped Bar Chart", "Heatmap", "Treemap"];
                if (!allowedTypes.some((type) => rec.includes(type))) {
                    return;
                }
            }

            // update the axis value
            updateChart(index, axis, columnName);

            // compute recommendations for the new axis combination
            const recommended = recommendCharts(datasetData, newX, newY);

            // If we have recommendations, ensure the chart's type is one of them.
            // If the current type is missing or empty, set to the first recommended type.
            if (recommended.length > 0) {
                const currentType = chart.type || "";
                if (!currentType || !recommended.includes(currentType)) {
                    updateChart(index, "type", recommended[0]);
                }
            }
        },
        [chart.x, chart.y, chart.type, columns, datasetData, index, isNumericColumn, updateChart]
    );

    return (
        // if no data available, render nothing
        (datasetData && datasetData.length > 0) && (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                width: "100%",
                flexWrap: "wrap"
            }}
        >
            <FormControl
                sx={{
                    flex: 1,
                    minWidth: 180
                }}
            >
                <InputLabel>Chart Type</InputLabel>
                <Select
                    value={chart.type || ""}
                    label="Chart Type"
                    onChange={(e) => updateChart(index, "type", e.target.value)}
                    disabled={!chart.x || !chart.y}
                >
                    {chartTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                            {type}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    X Axis
                </Typography>
                <Box
                    onDragOver={handleDragOver}
                    onDrop={handleDrop("x")}
                    sx={{
                        minHeight: 56,
                        p: 2,
                        border: "1px dashed #9CA3AF",
                        borderRadius: 2,
                        bgcolor: chart.x ? "#ECFDF5" : "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {chart.x || "Drag a column here"}
                </Box>
            </Box>

            <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Y Axis
                </Typography>
                <Box
                    onDragOver={handleDragOver}
                    onDrop={handleDrop("y")}
                    sx={{
                        minHeight: 56,
                        p: 2,
                        border: "1px dashed #9CA3AF",
                        borderRadius: 2,
                        bgcolor: chart.y ? "#ECFDF5" : "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                            {chart.y || "Drag a column here"}
                </Box>
            </Box>
        </Box>
        )
    );
}

export default ChartSelector;
