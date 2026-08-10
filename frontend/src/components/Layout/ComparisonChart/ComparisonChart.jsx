import React, {
    useEffect,
    useState
} from "react";

import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    Paper
} from "@mui/material";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

import {
    prepareComparisonData
} from "../../../utils/chartDataProcessor";


function ComparisonChart({
    datasetData,
    datasetName
}) {

    const [category, setCategory] =
        useState("");

    const [measures, setMeasures] =
        useState([]);


    // ============================================================
    // RESET COMPARISON WHEN DATASET CHANGES
    //
    // Important:
    // ComparisonChart remains mounted when Dashboard changes
    // datasets, so its local state would otherwise remain.
    // ============================================================

    useEffect(() => {

        setCategory("");
        setMeasures([]);

    }, [
        datasetName
    ]);


    // ============================================================
    // NO DATA
    // ============================================================

    if (
        !datasetData ||
        datasetData.length === 0
    ) {

        return null;

    }


    // ============================================================
    // COLUMNS
    // ============================================================

    const columns =
        Object.keys(
            datasetData[0]
        );


    // ============================================================
    // DETECT NUMERIC FIELDS
    // ============================================================

    const numericColumns =
        columns.filter(
            column => {

                const values =
                    datasetData
                        .slice(0, 30)
                        .map(
                            row =>
                                row[column]
                        );


                // Ignore completely empty columns
                const nonEmptyValues =
                    values.filter(
                        value =>
                            value !== "" &&
                            value !== null &&
                            value !== undefined
                    );


                if (
                    nonEmptyValues.length === 0
                ) {

                    return false;

                }


                return nonEmptyValues.every(
                    value =>
                        !isNaN(
                            Number(value)
                        )
                );

            }
        );


    // ============================================================
    // DETECT CATEGORY FIELDS
    // ============================================================

    const categoryColumns =
        columns.filter(
            column => {

                const values =
                    datasetData
                        .slice(0, 30)
                        .map(
                            row =>
                                row[column]
                        )
                        .filter(
                            value =>
                                value !== null &&
                                value !== undefined &&
                                value !== ""
                        );


                if (
                    values.length === 0
                ) {

                    return false;

                }


                const uniqueValues =
                    new Set(
                        values
                    ).size;


                return (
                    typeof values[0] === "string" &&
                    uniqueValues <
                        datasetData.length
                );

            }
        );


    // ============================================================
    // MAKE SURE OLD SELECTIONS CANNOT SURVIVE
    //
    // This is an additional safety check in case the dataset
    // changes before the reset effect runs.
    // ============================================================

    const validMeasures =
        measures.filter(
            measure =>
                numericColumns.includes(
                    measure
                )
        );


    const validCategory =
        categoryColumns.includes(
            category
        )
            ? category
            : "";


    // ============================================================
    // CHART DATA
    // ============================================================

    const chartData =
        validCategory &&
        validMeasures.length > 0

            ? prepareComparisonData(
                datasetData,
                validCategory,
                validMeasures
            )

            : [];


    // ============================================================
    // COLORS
    // ============================================================

    const colors = [

        "#2563EB",

        "#16A34A",

        "#DC2626",

        "#9333EA",

        "#EA580C",

        "#0891B2"

    ];


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Paper
            sx={{
                padding: 3,
                marginTop: 3,
                borderRadius: 4
            }}
        >

            <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                    mb: 3
                }}
            >
                Compare Multiple Metrics
            </Typography>


            {/* ================================================= */}
            {/* CATEGORY */}
            {/* ================================================= */}

            <FormControl
                fullWidth
                sx={{
                    mb: 3
                }}
            >

                <InputLabel>
                    Category
                </InputLabel>


                <Select
                    value={validCategory}
                    label="Category"
                    onChange={
                        event => {

                            setCategory(
                                event.target.value
                            );

                        }
                    }
                >

                    {categoryColumns.map(
                        column => (

                            <MenuItem
                                key={column}
                                value={column}
                            >
                                {column}
                            </MenuItem>

                        )
                    )}

                </Select>

            </FormControl>


            {/* ================================================= */}
            {/* MEASURES */}
            {/* ================================================= */}

            <FormControl
                fullWidth
            >

                <InputLabel>
                    Measures
                </InputLabel>


                <Select
                    multiple
                    value={validMeasures}
                    label="Measures"
                    onChange={
                        event => {

                            const value =
                                event.target.value;

                            setMeasures(
                                typeof value === "string"
                                    ? value.split(",")
                                    : value
                            );

                        }
                    }
                    renderValue={
                        selected =>
                            selected.join(", ")
                    }
                >

                    {numericColumns.map(
                        column => (

                            <MenuItem
                                key={column}
                                value={column}
                            >

                                <Checkbox
                                    checked={
                                        validMeasures.includes(
                                            column
                                        )
                                    }
                                />

                                <ListItemText
                                    primary={
                                        column
                                    }
                                />

                            </MenuItem>

                        )
                    )}

                </Select>

            </FormControl>


            {/* ================================================= */}
            {/* CHART */}
            {/* ================================================= */}

            {validCategory &&
                validMeasures.length > 0 && (

                <Box
                    sx={{
                        height: 420,
                        mt: 4
                    }}
                >

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20
                            }}
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="name"
                            />

                            <YAxis />

                            <Tooltip
                                formatter={
                                    value =>
                                        Number(
                                            value
                                        ).toLocaleString()
                                }
                            />

                            <Legend />


                            {validMeasures.map(
                                (
                                    measure,
                                    index
                                ) => (

                                    <Bar
                                        key={
                                            measure
                                        }
                                        dataKey={
                                            measure
                                        }
                                        fill={
                                            colors[
                                                index %
                                                colors.length
                                            ]
                                        }
                                        radius={[
                                            8,
                                            8,
                                            0,
                                            0
                                        ]}
                                    />

                                )
                            )}

                        </BarChart>

                    </ResponsiveContainer>

                </Box>

            )}

        </Paper>

    );

}


export default ComparisonChart;