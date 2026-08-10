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

    const [columns, setColumns] =
        useState([]);

    const [datasetData, setDatasetData] =
        useState([]);

    const [datasetName, setDatasetName] =
        useState("");

    const [, setSelectedColumns] =
        useState([]);


    // ============================================================
    // UPLOAD / DATASET SELECTOR SYNCHRONIZATION
    // ============================================================

    const [
        uploadedDatasetName,
        setUploadedDatasetName
    ] = useState("");


    const [
        datasetRefreshKey,
        setDatasetRefreshKey
    ] = useState(0);


    // ============================================================
    // SQL CHANGES
    // ============================================================

    const [
        changes,
        setChanges
    ] = useState(null);


    // ============================================================
    // CALCULATED FIELDS
    // ============================================================

    const [
        calculatedFields,
        setCalculatedFields
    ] = useState([]);


    const calculatedFieldManagerRef =
        useRef(
            createCalculatedFieldManager()
        );


    // ============================================================
    // CHARTS
    // ============================================================

    const [
        charts,
        setCharts
    ] = useState([]);


    // ============================================================
    // RESET CALCULATED FIELDS ONLY
    //
    // This is used when the USER actually changes dataset.
    //
    // It is NOT called after upload as a separate callback.
    // ============================================================

    const resetCalculatedFields = () => {

        calculatedFieldManagerRef.current =
            createCalculatedFieldManager();

        setCalculatedFields([]);

    };


    // ============================================================
    // HANDLE DATASET LOADED
    //
    // This is the SINGLE source of truth for changing the
    // active dataset.
    // ============================================================

    const handleDatasetLoaded = (
        analysis
    ) => {

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


            setDatasetName("");

            setUploadedDatasetName("");

            setColumns([]);

            setDatasetData([]);

            setChanges(null);

            resetCalculatedFields();

            return;

        }


        // ========================================================
        // FILENAME
        // ========================================================

        const filename =
            analysis.filename ||
            analysis.name ||
            "";


        console.log(
            "ACTIVE DATASET:",
            filename
        );


        setDatasetName(
            filename
        );


        // ========================================================
        // COLUMNS
        // ========================================================

        setColumns(
            Array.isArray(
                analysis.columns
            )
                ? analysis.columns
                : []
        );


        // ========================================================
        // DATA
        // ========================================================

        setDatasetData(
            Array.isArray(
                analysis.data
            )
                ? analysis.data
                : []
        );


        // ========================================================
        // SQL CHANGES
        // ========================================================

        if (
            analysis.changes &&
            typeof analysis.changes ===
            "object"
        ) {

            setChanges(
                analysis.changes
            );

        }
        else {

            setChanges(null);

        }


        // ========================================================
        // REMEMBER ACTIVE DATASET
        // ========================================================

        if (filename) {

            setUploadedDatasetName(
                filename
            );

        }


        // ========================================================
        // RESET CALCULATED FIELDS
        //
        // This is okay because this function means:
        //
        // "The active dataset has changed."
        //
        // It happens exactly once per actual dataset load.
        // ========================================================

        resetCalculatedFields();

    };


    // ============================================================
    // HANDLE DATASET RESET
    // ============================================================

    const handleDatasetReset = () => {

        console.log(
            "DATASET RESET"
        );


        setDatasetName("");

        setUploadedDatasetName("");

        setColumns([]);

        setDatasetData([]);

        setSelectedColumns([]);

        setChanges(null);

        resetCalculatedFields();

    };


    // ============================================================
    // HANDLE UPLOAD REFRESH
    //
    // IMPORTANT:
    //
    // This DOES NOT load the dataset.
    //
    // Upload.jsx has already called handleDatasetLoaded().
    //
    // This only tells DatasetSelector:
    //
    // "Update your MinIO list and select this filename."
    // ============================================================

    const handleUploadRefresh = (
        uploadedFilename
    ) => {

        console.log(
            "===================================="
        );

        console.log(
            "UPLOAD REFRESH"
        );

        console.log(
            "Uploaded filename:",
            uploadedFilename
        );

        console.log(
            "===================================="
        );


        if (!uploadedFilename) {

            return;

        }


        setUploadedDatasetName(
            uploadedFilename
        );


        setDatasetName(
            uploadedFilename
        );


        setDatasetRefreshKey(
            previous =>
                previous + 1
        );

    };


    // ============================================================
    // UPLOAD COMPLETE
    //
    // DO NOTHING HERE.
    //
    // The dataset was already loaded by handleDatasetLoaded().
    //
    // In particular, DO NOT:
    //
    // setCharts([])
    //
    // because that causes the visible chart refresh.
    // ============================================================

    const handleUploadComplete = () => {

        console.log(
            "Upload complete."
        );

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

                value:
                    applyAggregation(
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
    // ENHANCED DATASET
    // ============================================================

    const enhancedDatasetData =
        useMemo(() => {

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
                (
                    row
                ) => {

                    const nextRow = {
                        ...row
                    };


                    fieldDefinitions.forEach(
                        (
                            field
                        ) => {

                            nextRow[
                                field.name
                            ] =
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
    //
    // Charts regenerate only when actual dataset data changes.
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
        catch (
            error
        ) {

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
    // FORMAT SQL CHANGE COLUMN
    // ============================================================

    const formatChangeColumns = (
        value
    ) => {

        if (
            !Array.isArray(value)
        ) {

            return "";

        }


        return value
            .map(
                (
                    item
                ) => {

                    if (
                        typeof item ===
                            "string" ||
                        typeof item ===
                            "number"
                    ) {

                        return String(
                            item
                        );

                    }


                    if (
                        item &&
                        typeof item ===
                            "object"
                    ) {

                        return (
                            item.name ||
                            item.column ||
                            item.column_name ||
                            item.field ||
                            item.field_name ||
                            JSON.stringify(
                                item
                            )
                        );

                    }


                    return "";

                }
            )
            .filter(Boolean)
            .join(", ");

    };


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
                    handleUploadComplete
                }

                onDatasetLoaded={
                    handleDatasetLoaded
                }

                onUploadRefresh={
                    handleUploadRefresh
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

                datasets={[]}

                datasetsLoading={false}

                onDatasetSelect={
                    null
                }

            />


            {/* ================================================= */}
            {/* MAIN */}
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

                    refreshKey={
                        datasetRefreshKey
                    }

                    uploadedDatasetName={
                        uploadedDatasetName
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
                                key={
                                    index
                                }
                            >

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        background: "#fff",
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
                                                {
                                                    card.title
                                                }
                                            </Typography>


                                            <Typography
                                                variant="h4"
                                                fontWeight="bold"
                                            >
                                                {
                                                    card.value
                                                }
                                            </Typography>

                                        </Box>


                                        <Box
                                            sx={{
                                                color:
                                                    card.color
                                            }}
                                        >

                                            {
                                                card.icon
                                            }

                                        </Box>

                                    </Box>

                                </Paper>

                            </Grid>

                        )
                    )}

                </Grid>


                {/* ================================================= */}
                {/* SQL CHANGES */}
                {/* ================================================= */}

                {changes && (

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 5,
                            borderRadius: 4,
                            background: "#FFFFFF",
                            border:
                                "1px solid #ECECEC"
                        }}
                    >

                        <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                                mb: 3
                            }}
                        >
                            SQL Changes
                        </Typography>


                        <Grid
                            container
                            spacing={2}
                        >

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={3}
                            >

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        background:
                                            "#ECFDF5",
                                        border:
                                            "1px solid #A7F3D0"
                                    }}
                                >

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Inserted
                                    </Typography>

                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        sx={{
                                            color:
                                                "#059669"
                                        }}
                                    >
                                        {
                                            Number(
                                                changes.inserted ||
                                                0
                                            )
                                        }
                                    </Typography>

                                </Paper>

                            </Grid>


                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={3}
                            >

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        background:
                                            "#EFF6FF",
                                        border:
                                            "1px solid #BFDBFE"
                                    }}
                                >

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Updated
                                    </Typography>

                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        sx={{
                                            color:
                                                "#2563EB"
                                        }}
                                    >
                                        {
                                            Number(
                                                changes.updated ||
                                                0
                                            )
                                        }
                                    </Typography>

                                </Paper>

                            </Grid>


                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={3}
                            >

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        background:
                                            "#FEF2F2",
                                        border:
                                            "1px solid #FECACA"
                                    }}
                                >

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Deleted
                                    </Typography>

                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        sx={{
                                            color:
                                                "#DC2626"
                                        }}
                                    >
                                        {
                                            Number(
                                                changes.deleted ||
                                                0
                                            )
                                        }
                                    </Typography>

                                </Paper>

                            </Grid>


                            <Grid
                                item
                                xs={12}
                                sm={6}
                                md={3}
                            >

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        background:
                                            "#F5F3FF",
                                        border:
                                            "1px solid #DDD6FE"
                                    }}
                                >

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Cells Changed
                                    </Typography>

                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        sx={{
                                            color:
                                                "#7C3AED"
                                        }}
                                    >
                                        {
                                            Number(
                                                changes.cells_changed ||
                                                0
                                            )
                                        }
                                    </Typography>

                                </Paper>

                            </Grid>

                        </Grid>


                        {Array.isArray(
                            changes.inserted_rows
                        ) &&
                        changes.inserted_rows.length > 0 && (

                            <Box
                                sx={{
                                    mt: 4
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                        mb: 1
                                    }}
                                >
                                    Inserted Rows
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        changes
                                            .inserted_rows
                                            .length
                                    } rows inserted.
                                </Typography>

                            </Box>

                        )}


                        {Array.isArray(
                            changes.updated_rows
                        ) &&
                        changes.updated_rows.length > 0 && (

                            <Box
                                sx={{
                                    mt: 3
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                        mb: 1
                                    }}
                                >
                                    Updated Rows
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        changes
                                            .updated_rows
                                            .length
                                    } rows updated.
                                </Typography>

                            </Box>

                        )}


                        {Array.isArray(
                            changes.deleted_rows
                        ) &&
                        changes.deleted_rows.length > 0 && (

                            <Box
                                sx={{
                                    mt: 3
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                        mb: 1
                                    }}
                                >
                                    Deleted Rows
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        changes
                                            .deleted_rows
                                            .length
                                    } rows deleted.
                                </Typography>

                            </Box>

                        )}


                        {Array.isArray(
                            changes.added_columns
                        ) &&
                        changes.added_columns.length > 0 && (

                            <Box
                                sx={{
                                    mt: 3
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                        mb: 1
                                    }}
                                >
                                    Added Columns
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        formatChangeColumns(
                                            changes.added_columns
                                        )
                                    }
                                </Typography>

                            </Box>

                        )}


                        {Array.isArray(
                            changes.removed_columns
                        ) &&
                        changes.removed_columns.length > 0 && (

                            <Box
                                sx={{
                                    mt: 3
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                        mb: 1
                                    }}
                                >
                                    Removed Columns
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        formatChangeColumns(
                                            changes.removed_columns
                                        )
                                    }
                                </Typography>

                            </Box>

                        )}

                    </Paper>

                )}


                {/* ================================================= */}
                {/* CHARTS */}
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