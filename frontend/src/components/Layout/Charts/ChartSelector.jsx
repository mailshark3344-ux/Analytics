import React, {
    useCallback,
    useMemo
} from "react";

import {
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography
} from "@mui/material";

import {
    recommendCharts
} from "../../../utils/chartRecommendation";


function ChartSelector({
    chart,
    index,
    updateChart,
    datasetData
}) {

    const columns = useMemo(
        () => {

            if (
                !datasetData ||
                datasetData.length === 0
            ) {
                return [];
            }

            return Object.keys(
                datasetData[0]
            );

        },
        [datasetData]
    );


    const isNumericColumn =
        useCallback(
            (
                columnName
            ) => {

                if (
                    !datasetData ||
                    datasetData.length === 0
                ) {
                    return false;
                }

                const values =
                    datasetData
                        .slice(0, 20)
                        .map(
                            row =>
                                row[columnName]
                        );

                return values.every(
                    value =>
                        value !== "" &&
                        value !== null &&
                        !isNaN(
                            Number(value)
                        )
                );

            },
            [datasetData]
        );


    const chartTypes =
        recommendCharts(
            datasetData,
            chart.x,
            chart.y
        );


    const handleDragOver =
        useCallback(
            event => {
                event.preventDefault();
            },
            []
        );


    const handleDrop =
        useCallback(
            axis => event => {

                event.preventDefault();

                const columnName =
                    event.dataTransfer.getData(
                        "text/plain"
                    );

                if (
                    !columnName ||
                    !columns.includes(
                        columnName
                    )
                ) {
                    return;
                }


                const newX =
                    axis === "x"
                        ? columnName
                        : chart.x;

                const newY =
                    axis === "y"
                        ? columnName
                        : chart.y;


                if (
                    axis === "y" &&
                    !isNumericColumn(
                        columnName
                    )
                ) {

                    const rec =
                        recommendCharts(
                            datasetData,
                            newX,
                            newY
                        );

                    const allowedTypes = [
                        "Grouped Bar Chart",
                        "Heatmap",
                        "Treemap"
                    ];

                    if (
                        !allowedTypes.some(
                            type =>
                                rec.includes(
                                    type
                                )
                        )
                    ) {
                        return;
                    }

                }


                updateChart(
                    index,
                    axis,
                    columnName
                );


                const recommended =
                    recommendCharts(
                        datasetData,
                        newX,
                        newY
                    );


                if (
                    recommended.length > 0
                ) {

                    const currentType =
                        chart.type || "";

                    if (
                        !currentType ||
                        !recommended.includes(
                            currentType
                        )
                    ) {

                        updateChart(
                            index,
                            "type",
                            recommended[0]
                        );

                    }

                }

            },
            [
                chart.x,
                chart.y,
                chart.type,
                columns,
                datasetData,
                index,
                isNumericColumn,
                updateChart
            ]
        );


    if (
        !datasetData ||
        datasetData.length === 0
    ) {
        return null;
    }


    return (

        <Box
            sx={{
                display: "grid",

                gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr 1fr"
                },

                gap: 1.5,

                width: "100%"
            }}
        >

            {/* CHART TYPE */}

            <FormControl
                size="small"
                fullWidth
            >

                <InputLabel>
                    Visualization
                </InputLabel>

                <Select
                    value={
                        chart.type || ""
                    }

                    label="Visualization"

                    onChange={
                        event =>
                            updateChart(
                                index,
                                "type",
                                event.target.value
                            )
                    }

                    disabled={
                        !chart.x ||
                        !chart.y
                    }

                    sx={{
                        background:
                            "#FFFFFF",

                        borderRadius: 2
                    }}
                >

                    {chartTypes.map(
                        type => (

                            <MenuItem
                                key={type}
                                value={type}
                            >
                                {type}
                            </MenuItem>

                        )
                    )}

                </Select>

            </FormControl>


            {/* X AXIS */}

            <Box>

                <Typography
                    fontSize={10}
                    fontWeight={800}
                    color="#64748B"
                    sx={{
                        mb: 0.5,
                        textTransform:
                            "uppercase",
                        letterSpacing: .7
                    }}
                >
                    X Axis
                </Typography>

                <Box
                    onDragOver={
                        handleDragOver
                    }

                    onDrop={
                        handleDrop("x")
                    }

                    sx={{
                        height: 40,

                        px: 1.5,

                        border:
                            chart.x
                                ? "1px solid #A5B4FC"
                                : "1px dashed #CBD5E1",

                        borderRadius: 2,

                        background:
                            chart.x
                                ? "#EEF2FF"
                                : "#F8FAFC",

                        display: "flex",

                        alignItems: "center",

                        transition:
                            ".2s",

                        "&:hover": {
                            borderColor:
                                "#6366F1"
                        }
                    }}
                >

                    <Typography
                        fontSize={12}
                        fontWeight={
                            chart.x
                                ? 700
                                : 500
                        }

                        color={
                            chart.x
                                ? "#4338CA"
                                : "#94A3B8"
                        }

                        noWrap
                    >
                        {chart.x ||
                            "Drop column here"}
                    </Typography>

                </Box>

            </Box>


            {/* Y AXIS */}

            <Box>

                <Typography
                    fontSize={10}
                    fontWeight={800}
                    color="#64748B"
                    sx={{
                        mb: 0.5,
                        textTransform:
                            "uppercase",
                        letterSpacing: .7
                    }}
                >
                    Y Axis
                </Typography>

                <Box
                    onDragOver={
                        handleDragOver
                    }

                    onDrop={
                        handleDrop("y")
                    }

                    sx={{
                        height: 40,

                        px: 1.5,

                        border:
                            chart.y
                                ? "1px solid #A5B4FC"
                                : "1px dashed #CBD5E1",

                        borderRadius: 2,

                        background:
                            chart.y
                                ? "#EEF2FF"
                                : "#F8FAFC",

                        display: "flex",

                        alignItems: "center",

                        transition:
                            ".2s",

                        "&:hover": {
                            borderColor:
                                "#6366F1"
                        }
                    }}
                >

                    <Typography
                        fontSize={12}
                        fontWeight={
                            chart.y
                                ? 700
                                : 500
                        }

                        color={
                            chart.y
                                ? "#4338CA"
                                : "#94A3B8"
                        }

                        noWrap
                    >
                        {chart.y ||
                            "Drop column here"}
                    </Typography>

                </Box>

            </Box>

        </Box>

    );
}

export default ChartSelector;
