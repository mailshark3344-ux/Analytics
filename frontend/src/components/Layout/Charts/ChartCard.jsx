import React from "react";

import {
    Paper,
    Typography,
    Box,
    Chip
} from "@mui/material";

import {
    DragIndicatorRounded,
    TuneRounded
} from "@mui/icons-material";

import ChartSelector from "./ChartSelector";
import ChartRenderer from "./ChartRenderer";


function ChartCard({
    chart,
    index,
    updateChart,
    datasetData
}) {

    return (

        <Paper
            elevation={0}
            sx={{
                height: 560,

                borderRadius: 4,

                background: "#FFFFFF",

                border:
                    "1px solid #E8ECF3",

                overflow: "hidden",

                display: "flex",

                flexDirection: "column",

                transition:
                    "all .25s ease",

                "&:hover": {
                    borderColor:
                        "#C7D2FE",

                    boxShadow:
                        "0 16px 40px rgba(15,23,42,.08)"
                }
            }}
        >

            {/* HEADER */}

            <Box
                sx={{
                    px: 2.5,
                    py: 2,

                    display: "flex",

                    alignItems: "center",

                    justifyContent:
                        "space-between",

                    borderBottom:
                        "1px solid #EEF2F7",

                    background:
                        "linear-gradient(180deg,#FFFFFF,#FAFBFF)"
                }}
            >

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        minWidth: 0
                    }}
                >

                    <Box
                        sx={{
                            width: 34,
                            height: 34,

                            borderRadius: 2,

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            background:
                                "#EEF2FF",

                            color:
                                "#6366F1"
                        }}
                    >

                        <DragIndicatorRounded
                            fontSize="small"
                        />

                    </Box>


                    <Box
                        sx={{
                            minWidth: 0
                        }}
                    >

                        <Typography
                            fontWeight={800}
                            fontSize={15}
                            noWrap
                            color="#0F172A"
                        >
                            {chart.title ||
                                `Visualization ${index + 1}`}
                        </Typography>

                        <Typography
                            fontSize={11}
                            color="#94A3B8"
                        >
                            Interactive visualization
                        </Typography>

                    </Box>

                </Box>


                <Chip
                    icon={
                        <TuneRounded
                            sx={{
                                fontSize:
                                    "14px !important"
                            }}
                        />
                    }
                    label={
                        chart.type ||
                        "Chart"
                    }
                    size="small"
                    sx={{
                        display: {
                            xs: "none",
                            sm: "flex"
                        },

                        background:
                            "#F8FAFC",

                        border:
                            "1px solid #E2E8F0",

                        color:
                            "#475569",

                        fontWeight: 600,

                        fontSize: 10
                    }}
                />

            </Box>


            {/* CONTROLS */}

            <Box
                sx={{
                    px: 2.5,
                    py: 2,

                    background:
                        "#FAFBFF",

                    borderBottom:
                        "1px solid #EEF2F7"
                }}
            >

                <ChartSelector
                    chart={chart}
                    index={index}
                    updateChart={updateChart}
                    datasetData={datasetData}
                />

            </Box>


            {/* CHART */}

            <Box
                sx={{
                    flexGrow: 1,

                    minHeight: 0,

                    p: 2.5
                }}
            >

                <Box
                    sx={{
                        width: "100%",
                        height: "100%"
                    }}
                >

                    <ChartRenderer
                        chart={chart}
                        data={datasetData}
                    />

                </Box>

            </Box>

        </Paper>

    );
}

export default ChartCard;
