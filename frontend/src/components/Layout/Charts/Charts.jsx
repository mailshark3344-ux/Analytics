import React from "react";

import {
    Box,
    Grid,
    Paper,
    Typography,
    Chip
} from "@mui/material";

import {
    AutoGraphRounded,
    BarChartRounded
} from "@mui/icons-material";

import ChartCard from "./ChartCard";


function Charts({
    charts,
    setCharts,
    datasetData
}) {

    if (
        !datasetData ||
        datasetData.length === 0
    ) {

        return (

            <Paper
                elevation={0}
                sx={{
                    minHeight: 420,

                    borderRadius: 4,

                    border:
                        "1px solid #E8ECF3",

                    background:
                        "#FFFFFF",

                    display: "flex",

                    flexDirection: "column",

                    alignItems: "center",

                    justifyContent: "center",

                    textAlign: "center",

                    p: 4
                }}
            >

                <Box
                    sx={{
                        width: 70,
                        height: 70,

                        borderRadius: 3,

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        background:
                            "#EEF2FF",

                        color:
                            "#6366F1",

                        mb: 2
                    }}
                >

                    <AutoGraphRounded
                        sx={{
                            fontSize: 34
                        }}
                    />

                </Box>


                <Typography
                    variant="h6"
                    fontWeight={800}
                    color="#0F172A"
                >
                    Your analytics workspace is empty
                </Typography>


                <Typography
                    variant="body2"
                    color="#64748B"
                    sx={{
                        mt: 1,
                        maxWidth: 480
                    }}
                >
                    Upload a CSV or Excel dataset to
                    automatically generate charts and
                    discover patterns in your data.
                </Typography>

            </Paper>

        );

    }


    const updateChart = (
        index,
        key,
        value
    ) => {

        const updatedCharts =
            [...charts];

        updatedCharts[index] = {
            ...updatedCharts[index],
            [key]: value
        };

        setCharts(
            updatedCharts
        );

    };


    return (

        <Box>

            {/* SECTION HEADER */}

            <Box
                sx={{
                    display: "flex",

                    alignItems: {
                        xs: "flex-start",
                        sm: "center"
                    },

                    justifyContent:
                        "space-between",

                    gap: 2,

                    mb: 3,

                    flexDirection: {
                        xs: "column",
                        sm: "row"
                    }
                }}
            >

                <Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                        }}
                    >

                        <AutoGraphRounded
                            sx={{
                                color: "#6366F1"
                            }}
                        />

                        <Typography
                            variant="h5"
                            fontWeight={800}
                            color="#0F172A"
                        >
                            Analytics
                        </Typography>

                    </Box>

                    <Typography
                        variant="body2"
                        color="#64748B"
                        sx={{
                            mt: 0.5
                        }}
                    >
                        Explore automatically generated
                        insights from your dataset.
                    </Typography>

                </Box>


                <Chip
                    icon={
                        <BarChartRounded
                            sx={{
                                fontSize: 17
                            }}
                        />
                    }
                    label={`${charts.length} visualizations`}
                    sx={{
                        background: "#EEF2FF",
                        color: "#4F46E5",
                        fontWeight: 700
                    }}
                />

            </Box>


            {/* CHART GRID */}

            <Grid
                container
                spacing={3}
                alignItems="stretch"
            >

                {charts.map(
                    (
                        chart,
                        index
                    ) => (

                        <Grid
                            item
                            xs={12}
                            lg={6}
                            key={index}
                        >

                            <ChartCard
                                chart={chart}
                                index={index}
                                updateChart={
                                    updateChart
                                }
                                datasetData={
                                    datasetData
                                }
                            />

                        </Grid>

                    )
                )}

            </Grid>

        </Box>

    );
}

export default Charts;
