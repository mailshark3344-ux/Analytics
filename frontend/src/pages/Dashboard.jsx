import React, {
    useState,
    useEffect,
    useMemo,
    useRef
} from "react";

import Header from "../components/Layout/Header/Header.jsx";
import Sidebar from "../components/Layout/Sidebar/Sidebar.jsx";
import Charts from "../components/Layout/Charts/Charts.jsx";
import ComparisonChart from "../components/Layout/ComparisonChart/ComparisonChart.jsx";
import Chatbot from "../components/Layout/Chatbot/Chatbot.jsx";
import DatasetSelector from "../components/Layout/Header/DatasetSelector.jsx";

import {
    applyAggregation
} from "../utils/aggregationEngine";

import {
    createCalculatedFieldManager
} from "../utils/calculatedFieldManager";

import {
    generateDefaultCharts
} from "../utils/chartGenerator";

import {
    Box,
    Typography,
    Grid,
    Paper,
    Divider
} from "@mui/material";

import {
    TableRows,
    ViewColumn,
    InsertChart,
    SmartToy
} from "@mui/icons-material";


function Dashboard() {

    // ============================================================
    // DATASET
    // ============================================================

    const [columns, setColumns] = useState([]);

    const [datasetData, setDatasetData] = useState([]);

    const [datasetName, setDatasetName] = useState("");

    const [, setSelectedColumns] = useState([]);


    // ============================================================
    // CALCULATED FIELDS
    // ============================================================

    const [
        calculatedFields,
        setCalculatedFields
    ] = useState([]);


    const calculatedFieldManagerRef = useRef(
        createCalculatedFieldManager()
    );


    // ============================================================
    // CHARTS
    // ============================================================

    const [charts, setCharts] = useState([]);


    // ============================================================
    // RESET CALCULATED FIELDS
    // ============================================================

    const resetCalculatedFields = () => {

        calculatedFieldManagerRef.current =
            createCalculatedFieldManager();

        setCalculatedFields([]);

        setCharts([]);

    };


    // ============================================================
    // HANDLE DATASET LOADED
    // ============================================================

    const handleDatasetLoaded = (analysis) => {

        console.log(
            "===================================="
        );

        console.log(
            "DATASET LOADED"
        );

        console.log(
            analysis
        );

        console.log(
            "===================================="
        );


        if (!analysis) {

            console.warn(
                "No dataset analysis received."
            );

            return;

        }


        // --------------------------------------------------------
        // Dataset name
        // --------------------------------------------------------

        if (analysis.filename) {

            setDatasetName(
                analysis.filename
            );

        }
        else {

            setDatasetName("");

        }


        // --------------------------------------------------------
        // Columns
        // --------------------------------------------------------

        if (
            Array.isArray(
                analysis.columns
            )
        ) {

            setColumns(
                analysis.columns
            );

        }
        else {

            setColumns([]);

        }


        // --------------------------------------------------------
        // Dataset data
        // --------------------------------------------------------

        if (
            Array.isArray(
                analysis.data
            )
        ) {

            setDatasetData(
                analysis.data
            );

        }
        else {

            setDatasetData([]);

        }


        // --------------------------------------------------------
        // Reset calculated fields
        // --------------------------------------------------------

        resetCalculatedFields();

    };


    // ============================================================
    // HANDLE DATASET ERROR / RESET
    // ============================================================

    const handleDatasetReset = () => {

        setDatasetName("");

        setColumns([]);

        setDatasetData([]);

        setSelectedColumns([]);

        resetCalculatedFields();

    };


    // ============================================================
    // CREATE CALCULATED FIELD
    // ============================================================

    const handleCalculatedFieldCreate = (
        fieldConfig
    ) => {

        if (!fieldConfig) {

            return;

        }


        if (
            !fieldConfig.name ||
            !fieldConfig.sourceColumn ||
            !fieldConfig.aggregation
        ) {

            return;

        }


        const createdField =
            calculatedFieldManagerRef.current.add({

                ...fieldConfig,

                value: applyAggregation(
                    datasetData,
                    fieldConfig.sourceColumn,
                    fieldConfig.aggregation
                )

            });


        if (createdField) {

            setCalculatedFields(
                calculatedFieldManagerRef
                    .current
                    .getAll()
            );

        }

    };


    // ============================================================
    // ADD CALCULATED FIELDS TO DATASET
    // ============================================================

    const enhancedDatasetData = useMemo(() => {

        if (
            !datasetData ||
            datasetData.length === 0
        ) {

            return [];

        }


        const fieldDefinitions =
            calculatedFieldManagerRef
                .current
                .getAll();


        if (
            fieldDefinitions.length === 0
        ) {

            return datasetData;

        }


        return datasetData.map(
            (row) => {

                const nextRow = {
                    ...row
                };


                fieldDefinitions.forEach(
                    (field) => {

                        nextRow[field.name] =
                            applyAggregation(
                                datasetData,
                                field.sourceColumn,
                                field.aggregation
                            );

                    }
                );


                return nextRow;

            }
        );

    }, [
        datasetData,
        calculatedFields.length
    ]);


    // ============================================================
    // GENERATE DEFAULT CHARTS
    // ============================================================

    useEffect(() => {

        if (
            !enhancedDatasetData ||
            enhancedDatasetData.length === 0
        ) {

            setCharts([]);

            return;

        }


        try {

            const generatedCharts =
                generateDefaultCharts(
                    enhancedDatasetData
                );


            setCharts(
                Array.isArray(
                    generatedCharts
                )
                    ? generatedCharts
                    : []
            );

        }
        catch (error) {

            console.error(
                "Chart generation error:",
                error
            );

            setCharts([]);

        }

    }, [
        enhancedDatasetData
    ]);


    // ============================================================
    // KPI CARDS
    // ============================================================

    const cards = [

        {
            title: "Rows",

            value:
                datasetData.length,

            icon: (
                <TableRows
                    fontSize="large"
                />
            ),

            color: "#2563EB"
        },


        {
            title: "Columns",

            value:
                columns.length +
                calculatedFields.length,

            icon: (
                <ViewColumn
                    fontSize="large"
                />
            ),

            color: "#059669"
        },


        {
            title: "Charts",

            value:
                charts.length,

            icon: (
                <InsertChart
                    fontSize="large"
                />
            ),

            color: "#DC2626"
        },


        {
            title: "AI Ready",

            value:
                datasetData.length > 0
                    ? "Yes"
                    : "No",

            icon: (
                <SmartToy
                    fontSize="large"
                />
            ),

            color: "#7C3AED"
        }

    ];


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                background: "#F4F6F9",
                minHeight: "100vh"
            }}
        >

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <Header

                setColumns={
                    setColumns
                }

                setDatasetData={
                    setDatasetData
                }

                onCalculatedFieldCreate={
                    handleCalculatedFieldCreate
                }

                onUploadComplete={
                    resetCalculatedFields
                }

                columns={
                    columns
                }

            />


            {/* ================================================= */}
            {/* SIDEBAR */}
            {/* ================================================= */}

            <Sidebar

                columns={
                    columns
                }

                calculatedFields={
                    calculatedFields
                }

                datasetName={
                    datasetName
                }

                datasetData={
                    datasetData
                }

                setSelectedColumns={
                    setSelectedColumns
                }

            />


            {/* ================================================= */}
            {/* MAIN CONTENT */}
            {/* ================================================= */}

            <Box
                sx={{
                    ml: "260px",
                    mt: "64px",
                    p: 4
                }}
            >

                {/* ================================================= */}
                {/* MINIO DATASET SELECTOR */}
                {/* ================================================= */}

                <DatasetSelector

                    onDatasetLoaded={
                        handleDatasetLoaded
                    }

                    onDatasetReset={
                        handleDatasetReset
                    }

                />


                {/* ================================================= */}
                {/* TITLE */}
                {/* ================================================= */}

                <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{
                        mt: 4
                    }}
                >
                    Analytics Dashboard
                </Typography>


                <Typography
                    color="text.secondary"
                    sx={{
                        mb: 1
                    }}
                >
                    Interactive business insights
                    from your dataset
                </Typography>


                {/* ================================================= */}
                {/* CURRENT DATASET */}
                {/* ================================================= */}

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 4
                    }}
                >

                    {
                        datasetName
                            ? `Current dataset: ${datasetName}`
                            : "Select a dataset or upload a file to begin"
                    }

                </Typography>


                {/* ================================================= */}
                {/* KPI CARDS */}
                {/* ================================================= */}

                <Grid
                    container
                    spacing={3}
                    sx={{
                        mb: 5
                    }}
                >

                    {cards.map(
                        (
                            card,
                            index
                        ) => (

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={3}
                                key={index}
                            >

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,

                                        borderRadius: 4,

                                        background:
                                            "#fff",

                                        border:
                                            "1px solid #ECECEC",

                                        transition:
                                            "0.3s",

                                        "&:hover": {

                                            transform:
                                                "translateY(-5px)",

                                            boxShadow:
                                                "0px 12px 25px rgba(0,0,0,.08)"

                                        }
                                    }}
                                >

                                    <Box
                                        sx={{
                                            display:
                                                "flex",

                                            justifyContent:
                                                "space-between",

                                            alignItems:
                                                "center"
                                        }}
                                    >

                                        <Box>

                                            <Typography
                                                color="text.secondary"
                                                variant="body2"
                                            >
                                                {card.title}
                                            </Typography>


                                            <Typography
                                                variant="h4"
                                                fontWeight="bold"
                                            >
                                                {card.value}
                                            </Typography>

                                        </Box>


                                        <Box
                                            sx={{
                                                color:
                                                    card.color
                                            }}
                                        >

                                            {card.icon}

                                        </Box>

                                    </Box>

                                </Paper>

                            </Grid>

                        )
                    )}

                </Grid>


                {/* ================================================= */}
                {/* AI GENERATED ANALYTICS */}
                {/* ================================================= */}

                <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                        mb: 2
                    }}
                >
                    AI Generated Analytics
                </Typography>


                <Charts

                    charts={
                        charts
                    }

                    setCharts={
                        setCharts
                    }

                    datasetData={
                        enhancedDatasetData
                    }

                />


                {/* ================================================= */}
                {/* DIVIDER */}
                {/* ================================================= */}

                <Divider
                    sx={{
                        my: 5
                    }}
                />


                {/* ================================================= */}
                {/* COMPARISON */}
                {/* ================================================= */}

                <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                        mb: 2
                    }}
                >
                    Compare Metrics
                </Typography>


                <ComparisonChart

                    datasetData={
                        enhancedDatasetData
                    }

                />

            </Box>


            {/* ================================================= */}
            {/* CHATBOT */}
            {/* ================================================= */}

            <Chatbot />

        </Box>

    );

}


export default Dashboard;