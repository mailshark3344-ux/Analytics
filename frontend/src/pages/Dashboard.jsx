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
    Divider,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from "@mui/material";

import {
    TableRows,
    ViewColumn,
    InsertChart,
    SmartToy,
    AddCircle,
    Edit,
    Delete,
    ChangeCircle,
    ViewList,
    RemoveCircle,
    Close
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
    // UPLOAD / DATASET SELECTOR
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

    const [changes, setChanges] = useState(null);

    const [
        selectedChange,
        setSelectedChange
    ] = useState(null);


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

    };


    // ============================================================
    // HANDLE DATASET LOADED
    // ============================================================

    const handleDatasetLoaded = (analysis) => {

        console.log("====================================");
        console.log("DATASET LOADED");
        console.log(analysis);
        console.log("SQL CHANGES:", analysis?.changes);
        console.log("====================================");


        if (!analysis) {

            setDatasetName("");
            setUploadedDatasetName("");
            setColumns([]);
            setDatasetData([]);
            setChanges(null);
            setSelectedChange(null);

            resetCalculatedFields();

            return;
        }


        // --------------------------------------------------------
        // FILENAME
        // --------------------------------------------------------

        const filename =
            analysis.filename ||
            analysis.name ||
            "";


        setDatasetName(filename);


        // --------------------------------------------------------
        // COLUMNS
        // --------------------------------------------------------

        const nextColumns =
            Array.isArray(analysis.columns)
                ? analysis.columns
                : [];


        setColumns(nextColumns);


        // --------------------------------------------------------
        // DATA
        // --------------------------------------------------------

        const nextData =
            Array.isArray(analysis.data)
                ? analysis.data
                : [];


        setDatasetData(nextData);


        // --------------------------------------------------------
        // SQL CHANGES
        // --------------------------------------------------------

        if (
            analysis.changes &&
            typeof analysis.changes === "object"
        ) {

            setChanges(analysis.changes);

        }
        else {

            setChanges(null);

        }


        // --------------------------------------------------------
        // RESET SELECTED CHANGE
        // --------------------------------------------------------

        setSelectedChange(null);


        // --------------------------------------------------------
        // REMEMBER DATASET
        // --------------------------------------------------------

        if (filename) {

            setUploadedDatasetName(filename);

        }


        // --------------------------------------------------------
        // RESET CALCULATED FIELDS
        // --------------------------------------------------------

        resetCalculatedFields();

    };


    // ============================================================
    // HANDLE DATASET RESET
    // ============================================================

    const handleDatasetReset = () => {

        console.log("DATASET RESET");

        setDatasetName("");

        setUploadedDatasetName("");

        setColumns([]);

        setDatasetData([]);

        setSelectedColumns([]);

        setChanges(null);

        setSelectedChange(null);

        setCharts([]);

        resetCalculatedFields();

    };


    // ============================================================
    // HANDLE UPLOAD REFRESH
    // ============================================================

    const handleUploadRefresh = (uploadedFilename) => {

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
            previous => previous + 1
        );

    };


    // ============================================================
    // UPLOAD COMPLETE
    // ============================================================

    const handleUploadComplete = () => {

        console.log("Upload complete.");

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
    // ENHANCED DATASET
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


        return datasetData.map(row => {

            const nextRow = {
                ...row
            };


            fieldDefinitions.forEach(field => {

                nextRow[field.name] =
                    applyAggregation(
                        datasetData,
                        field.sourceColumn,
                        field.aggregation
                    );

            });


            return nextRow;

        });

    }, [
        datasetData,
        calculatedFields
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
                Array.isArray(generatedCharts)
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
    // FORMAT CHANGE COLUMNS
    // ============================================================

    const formatChangeColumns = (value) => {

        if (!Array.isArray(value)) {
            return [];
        }


        return value
            .map(item => {

                if (
                    typeof item === "string" ||
                    typeof item === "number"
                ) {

                    return String(item);

                }


                if (
                    item &&
                    typeof item === "object"
                ) {

                    return (
                        item.name ||
                        item.column ||
                        item.column_name ||
                        item.field ||
                        item.field_name ||
                        item.key ||
                        ""
                    );

                }


                return "";

            })
            .filter(Boolean);

    };


    // ============================================================
    // GET ROW DETAILS
    // ============================================================

    const getChangeRows = (type) => {

        if (!changes) {
            return [];
        }


        switch (type) {

            case "inserted":

                return (
                    Array.isArray(changes.inserted_rows)
                        ? changes.inserted_rows
                        : Array.isArray(changes.insertedRows)
                            ? changes.insertedRows
                            : []
                );


            case "updated":

                return (
                    Array.isArray(changes.updated_rows)
                        ? changes.updated_rows
                        : Array.isArray(changes.updatedRows)
                            ? changes.updatedRows
                            : []
                );


            case "deleted":

                return (
                    Array.isArray(changes.deleted_rows)
                        ? changes.deleted_rows
                        : Array.isArray(changes.deletedRows)
                            ? changes.deletedRows
                            : []
                );


            default:

                return [];

        }

    };


    // ============================================================
    // GET EXACT CHANGED CELLS
    // ============================================================

    const getChangedCells = () => {

        if (!changes) {
            return [];
        }


        const possibleKeys = [

            "changed_cells",

            "changedCells",

            "cell_changes",

            "cellChanges",

            "updated_cells",

            "updatedCells",

            "cells_changed_details",

            "cellsChangedDetails",

            "cells_changed_rows",

            "cellsChangedRows"

        ];


        for (const key of possibleKeys) {

            if (
                Array.isArray(
                    changes[key]
                )
            ) {

                return changes[key];

            }

        }


        return [];

    };


    // ============================================================
    // HANDLE SQL CARD CLICK
    // ============================================================

    const handleChangeCardClick = (type) => {

        setSelectedChange(previous =>
            previous === type
                ? null
                : type
        );

    };


    // ============================================================
    // CHANGE TITLE
    // ============================================================

    const getChangeTitle = () => {

        switch (selectedChange) {

            case "inserted":
                return "Inserted Rows";

            case "updated":
                return "Updated Rows";

            case "deleted":
                return "Deleted Rows";

            case "cells":
                return "Cells Changed";

            case "added_columns":
                return "Added Columns";

            case "removed_columns":
                return "Removed Columns";

            default:
                return "";

        }

    };


    // ============================================================
    // CHANGE COLOR
    // ============================================================

    const getChangeColor = () => {

        switch (selectedChange) {

            case "inserted":
                return "#059669";

            case "updated":
                return "#2563EB";

            case "deleted":
                return "#DC2626";

            case "cells":
                return "#7C3AED";

            case "added_columns":
                return "#0891B2";

            case "removed_columns":
                return "#EA580C";

            default:
                return "#64748B";

        }

    };


    // ============================================================
    // SELECTED CHANGE DATA
    // ============================================================

    const selectedChangeRows =
        getChangeRows(selectedChange);

    const changedCells =
        getChangedCells();


    // ============================================================
    // SAFE VALUE RENDERER
    // ============================================================

    const renderChangeValue = (value) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "—";

        }


        if (
            typeof value === "object"
        ) {

            try {

                return JSON.stringify(value);

            }
            catch {

                return String(value);

            }

        }


        return String(value);

    };


    // ============================================================
    // GET TABLE COLUMNS
    // ============================================================

    const getTableColumns = (rows) => {

        if (
            !Array.isArray(rows) ||
            rows.length === 0
        ) {

            return [];

        }


        const columnSet = new Set();


        rows.forEach(row => {

            if (
                row &&
                typeof row === "object" &&
                !Array.isArray(row)
            ) {

                Object.keys(row).forEach(key => {
                    columnSet.add(key);
                });

            }

        });


        return Array.from(columnSet);

    };


    const selectedRowColumns =
        getTableColumns(
            selectedChangeRows
        );


    const changedCellColumns =
        getTableColumns(
            changedCells
        );


    // ============================================================
    // COLUMN COUNTS
    // ============================================================

    const addedColumns =
        formatChangeColumns(
            changes?.added_columns ||
            changes?.addedColumns
        );


    const removedColumns =
        formatChangeColumns(
            changes?.removed_columns ||
            changes?.removedColumns
        );


    // ============================================================
    // SQL CHANGE COUNTS
    // ============================================================

    const insertedCount =
        Number(
            changes?.inserted ??
            changes?.inserted_count ??
            changes?.insertedCount ??
            0
        );


    const updatedCount =
        Number(
            changes?.updated ??
            changes?.updated_count ??
            changes?.updatedCount ??
            0
        );


    const deletedCount =
        Number(
            changes?.deleted ??
            changes?.deleted_count ??
            changes?.deletedCount ??
            0
        );


    const cellsChangedCount =
        Number(
            changes?.cells_changed ??
            changes?.cellsChanged ??
            changes?.changed_cells_count ??
            changes?.changedCellsCount ??
            changedCells.length ??
            0
        );


    const addedColumnsCount =
        addedColumns.length;


    const removedColumnsCount =
        removedColumns.length;


    // ============================================================
    // MAIN KPI CARDS
    // ============================================================

    const cards = [

        {
            title: "Rows",

            value: datasetData.length,

            icon: (
                <TableRows fontSize="large" />
            ),

            color: "#2563EB"
        },


        {
            title: "Columns",

            value:
                columns.length +
                calculatedFields.length,

            icon: (
                <ViewColumn fontSize="large" />
            ),

            color: "#059669"
        },


        {
            title: "Charts",

            value: charts.length,

            icon: (
                <InsertChart fontSize="large" />
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
                <SmartToy fontSize="large" />
            ),

            color: "#7C3AED"
        }

    ];


    // ============================================================
    // SQL CHANGE KPI CARDS
    // ============================================================

    const sqlChangeCards = [

        {
            key: "inserted",
            title: "Inserted",
            value: insertedCount,

            icon: (
                <AddCircle fontSize="large" />
            ),

            color: "#059669",
            background: "#ECFDF5",
            border: "#A7F3D0"
        },


        {
            key: "updated",
            title: "Updated",
            value: updatedCount,

            icon: (
                <Edit fontSize="large" />
            ),

            color: "#2563EB",
            background: "#EFF6FF",
            border: "#BFDBFE"
        },


        {
            key: "deleted",
            title: "Deleted",
            value: deletedCount,

            icon: (
                <Delete fontSize="large" />
            ),

            color: "#DC2626",
            background: "#FEF2F2",
            border: "#FECACA"
        },


        {
            key: "cells",
            title: "Cells Changed",
            value: cellsChangedCount,

            icon: (
                <ChangeCircle fontSize="large" />
            ),

            color: "#7C3AED",
            background: "#F5F3FF",
            border: "#DDD6FE"
        },


        {
            key: "added_columns",
            title: "Added Columns",
            value: addedColumnsCount,

            icon: (
                <ViewList fontSize="large" />
            ),

            color: "#0891B2",
            background: "#ECFEFF",
            border: "#A5F3FC"
        },


        {
            key: "removed_columns",
            title: "Removed Columns",
            value: removedColumnsCount,

            icon: (
                <RemoveCircle fontSize="large" />
            ),

            color: "#EA580C",
            background: "#FFF7ED",
            border: "#FED7AA"
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

                setColumns={setColumns}

                setDatasetData={setDatasetData}

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

                columns={columns}

            />


            {/* ================================================= */}
            {/* SIDEBAR */}
            {/* ================================================= */}

            <Sidebar

                columns={columns}

                calculatedFields={
                    calculatedFields
                }

                datasetName={datasetName}

                datasets={[]}

                datasetsLoading={false}

                onDatasetSelect={null}

            />


            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}

            <Box
                sx={{
                    ml: {
                        xs: 0,
                        md: "260px"
                    },

                    mt: "64px",

                    p: {
                        xs: 2,
                        sm: 3,
                        md: 4
                    }
                }}
            >

                {/* ================================================= */}
                {/* DATASET SELECTOR */}
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
                {/* MAIN KPI CARDS */}
                {/* ================================================= */}

                <Grid
                    container
                    spacing={3}
                    sx={{
                        mb: 5
                    }}
                >

                    {
                        cards.map(
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
                                                "#FFFFFF",

                                            border:
                                                "1px solid #ECECEC",

                                            transition:
                                                "all 0.3s ease",

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
                                                display: "flex",

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
                        )
                    }

                </Grid>


                {/* ================================================= */}
                {/* SQL CHANGES */}
                {/* ================================================= */}

                {
                    changes && (

                        <Paper
                            elevation={0}
                            sx={{
                                p: {
                                    xs: 2,
                                    md: 3
                                },

                                mb: 5,

                                borderRadius: 4,

                                background:
                                    "#FFFFFF",

                                border:
                                    "1px solid #ECECEC"
                            }}
                        >

                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                sx={{
                                    mb: 1
                                }}
                            >
                                SQL Changes
                            </Typography>


                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mb: 3
                                }}
                            >
                                Click a card to view
                                the affected details.
                            </Typography>


                            {/* ================================================= */}
                            {/* SQL KPI CARDS */}
                            {/* ================================================= */}

                            <Grid
                                container
                                spacing={2}
                            >

                                {
                                    sqlChangeCards.map(
                                        card => {

                                            const isSelected =
                                                selectedChange ===
                                                card.key;


                                            return (

                                                <Grid
                                                    item
                                                    xs={12}
                                                    sm={6}
                                                    md={4}
                                                    lg={2}
                                                    key={
                                                        card.key
                                                    }
                                                >

                                                    <Paper
                                                        elevation={
                                                            isSelected
                                                                ? 8
                                                                : 0
                                                        }

                                                        onClick={() =>
                                                            handleChangeCardClick(
                                                                card.key
                                                            )
                                                        }

                                                        sx={{
                                                            p: 2.5,

                                                            minHeight:
                                                                155,

                                                            borderRadius:
                                                                3,

                                                            background:
                                                                card.background,

                                                            border:
                                                                `1px solid ${card.border}`,

                                                            cursor:
                                                                "pointer",

                                                            transition:
                                                                "all 0.25s ease",

                                                            transform:
                                                                isSelected
                                                                    ? "translateY(-5px)"
                                                                    : "none",

                                                            boxShadow:
                                                                isSelected
                                                                    ? `0 10px 25px ${card.color}35`
                                                                    : "none",

                                                            "&:hover": {

                                                                transform:
                                                                    "translateY(-5px)",

                                                                boxShadow:
                                                                    `0 10px 25px ${card.color}25`

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
                                                                    "flex-start",

                                                                height:
                                                                    "100%"
                                                            }}
                                                        >

                                                            <Box>

                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        mb: 0.5
                                                                    }}
                                                                >
                                                                    {
                                                                        card.title
                                                                    }
                                                                </Typography>


                                                                <Typography
                                                                    variant="h4"
                                                                    fontWeight="bold"
                                                                    sx={{
                                                                        color:
                                                                            card.color
                                                                    }}
                                                                >
                                                                    {
                                                                        card.value
                                                                    }
                                                                </Typography>


                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        display:
                                                                            "block",

                                                                        mt: 1,

                                                                        color:
                                                                            card.color,

                                                                        fontWeight:
                                                                            600
                                                                    }}
                                                                >
                                                                    {
                                                                        isSelected
                                                                            ? "Click to close"
                                                                            : "Click to view details"
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

                                            );

                                        }
                                    )
                                }

                            </Grid>


                            {/* ================================================= */}
                            {/* SELECTED CHANGE DETAILS */}
                            {/* ================================================= */}

                            {
                                selectedChange && (

                                    <Paper
                                        elevation={0}
                                        sx={{
                                            mt: 4,

                                            p: {
                                                xs: 2,
                                                md: 3
                                            },

                                            borderRadius: 3,

                                            border:
                                                `1px solid ${getChangeColor()}40`,

                                            background:
                                                "#FFFFFF"
                                        }}
                                    >

                                        {/* ========================================= */}
                                        {/* DETAIL HEADER */}
                                        {/* ========================================= */}

                                        <Box
                                            sx={{
                                                display: "flex",

                                                justifyContent:
                                                    "space-between",

                                                alignItems:
                                                    "center",

                                                gap: 2,

                                                mb: 3,

                                                flexWrap:
                                                    "wrap"
                                            }}
                                        >

                                            <Box>

                                                <Typography
                                                    variant="h6"
                                                    fontWeight="bold"
                                                    sx={{
                                                        color:
                                                            getChangeColor()
                                                    }}
                                                >
                                                    {
                                                        getChangeTitle()
                                                    }
                                                </Typography>


                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >

                                                    {
                                                        selectedChange ===
                                                            "added_columns"

                                                            ? `${addedColumns.length} column(s) added`

                                                            : selectedChange ===
                                                                "removed_columns"

                                                                ? `${removedColumns.length} column(s) removed`

                                                                : selectedChange ===
                                                                    "cells"

                                                                    ? `${cellsChangedCount} cell(s) changed`

                                                                    : `${selectedChangeRows.length} row(s) affected`
                                                    }

                                                </Typography>

                                            </Box>


                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={
                                                    <Close />
                                                }
                                                onClick={() =>
                                                    setSelectedChange(
                                                        null
                                                    )
                                                }
                                            >
                                                Close
                                            </Button>

                                        </Box>


                                        {/* ================================================= */}
                                        {/* ADDED COLUMNS */}
                                        {/* ================================================= */}

                                        {
                                            selectedChange ===
                                                "added_columns" && (

                                                <Box>

                                                    {
                                                        addedColumns.length === 0

                                                            ? (

                                                                <Box
                                                                    sx={{
                                                                        p: 4,

                                                                        textAlign:
                                                                            "center",

                                                                        background:
                                                                            "#F8FAFC",

                                                                        borderRadius:
                                                                            2
                                                                    }}
                                                                >

                                                                    <Typography
                                                                        color="text.secondary"
                                                                    >
                                                                        No added
                                                                        column
                                                                        details
                                                                        were
                                                                        returned
                                                                        by the
                                                                        backend.
                                                                    </Typography>

                                                                </Box>

                                                            )

                                                            : (

                                                                <Box
                                                                    sx={{
                                                                        display:
                                                                            "flex",

                                                                        flexWrap:
                                                                            "wrap",

                                                                        gap: 1.5
                                                                    }}
                                                                >

                                                                    {
                                                                        addedColumns.map(
                                                                            (
                                                                                column,
                                                                                index
                                                                            ) => (

                                                                                <Chip
                                                                                    key={
                                                                                        `${column}-${index}`
                                                                                    }

                                                                                    label={
                                                                                        column
                                                                                    }

                                                                                    icon={
                                                                                        <AddCircle />
                                                                                    }

                                                                                    color="info"

                                                                                    variant="outlined"

                                                                                    sx={{
                                                                                        fontWeight:
                                                                                            600
                                                                                    }}
                                                                                />

                                                                            )
                                                                        )
                                                                    }

                                                                </Box>

                                                            )
                                                    }

                                                </Box>

                                            )
                                        }


                                        {/* ================================================= */}
                                        {/* REMOVED COLUMNS */}
                                        {/* ================================================= */}

                                        {
                                            selectedChange ===
                                                "removed_columns" && (

                                                <Box>

                                                    {
                                                        removedColumns.length === 0

                                                            ? (

                                                                <Box
                                                                    sx={{
                                                                        p: 4,

                                                                        textAlign:
                                                                            "center",

                                                                        background:
                                                                            "#F8FAFC",

                                                                        borderRadius:
                                                                            2
                                                                    }}
                                                                >

                                                                    <Typography
                                                                        color="text.secondary"
                                                                    >
                                                                        No removed
                                                                        column
                                                                        details
                                                                        were
                                                                        returned
                                                                        by the
                                                                        backend.
                                                                    </Typography>

                                                                </Box>

                                                            )

                                                            : (

                                                                <Box
                                                                    sx={{
                                                                        display:
                                                                            "flex",

                                                                        flexWrap:
                                                                            "wrap",

                                                                        gap: 1.5
                                                                    }}
                                                                >

                                                                    {
                                                                        removedColumns.map(
                                                                            (
                                                                                column,
                                                                                index
                                                                            ) => (

                                                                                <Chip
                                                                                    key={
                                                                                        `${column}-${index}`
                                                                                    }

                                                                                    label={
                                                                                        column
                                                                                    }

                                                                                    icon={
                                                                                        <RemoveCircle />
                                                                                    }

                                                                                    color="warning"

                                                                                    variant="outlined"

                                                                                    sx={{
                                                                                        fontWeight:
                                                                                            600
                                                                                    }}
                                                                                />

                                                                            )
                                                                        )
                                                                    }

                                                                </Box>

                                                            )
                                                    }

                                                </Box>

                                            )
                                        }


                                        {/* ================================================= */}
                                        {/* CELLS CHANGED */}
                                        {/* ================================================= */}

                                        {
                                            selectedChange ===
                                                "cells" && (

                                                <Box>

                                                    {
                                                        changedCells.length === 0

                                                            ? (

                                                                <Box
                                                                    sx={{
                                                                        p: 4,

                                                                        textAlign:
                                                                            "center",

                                                                        background:
                                                                            "#F5F3FF",

                                                                        border:
                                                                            "1px solid #DDD6FE",

                                                                        borderRadius:
                                                                            3
                                                                    }}
                                                                >

                                                                    <ChangeCircle
                                                                        sx={{
                                                                            fontSize:
                                                                                48,

                                                                            color:
                                                                                "#7C3AED",

                                                                            mb: 1
                                                                        }}
                                                                    />


                                                                    <Typography
                                                                        variant="h6"
                                                                        fontWeight="bold"
                                                                        sx={{
                                                                            color:
                                                                                "#5B21B6"
                                                                        }}
                                                                    >
                                                                        {
                                                                            cellsChangedCount
                                                                        }
                                                                        {" "}
                                                                        cell(s)
                                                                        changed
                                                                    </Typography>


                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        sx={{
                                                                            mt: 1,

                                                                            maxWidth:
                                                                                650,

                                                                            mx:
                                                                                "auto"
                                                                        }}
                                                                    >
                                                                        The backend
                                                                        returned
                                                                        the cell
                                                                        count,
                                                                        but did
                                                                        not return
                                                                        the
                                                                        individual
                                                                        changed
                                                                        cells.
                                                                    </Typography>


                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            mt: 2,

                                                                            color:
                                                                                "#6D28D9",

                                                                            fontWeight:
                                                                                600
                                                                        }}
                                                                    >
                                                                        To display
                                                                        the exact
                                                                        cells,
                                                                        the backend
                                                                        should
                                                                        return
                                                                        an array
                                                                        such as{" "}
                                                                        <strong>
                                                                            changed_cells
                                                                        </strong>
                                                                        {" "}or{" "}
                                                                        <strong>
                                                                            cell_changes
                                                                        </strong>.
                                                                    </Typography>

                                                                </Box>

                                                            )

                                                            : (

                                                                <TableContainer
                                                                    component={
                                                                        Paper
                                                                    }

                                                                    elevation={0}

                                                                    sx={{
                                                                        border:
                                                                            "1px solid #DDD6FE",

                                                                        borderRadius:
                                                                            2,

                                                                        maxHeight:
                                                                            500,

                                                                        overflow:
                                                                            "auto"
                                                                    }}
                                                                >

                                                                    <Table
                                                                        stickyHeader
                                                                        size="small"
                                                                    >

                                                                        <TableHead>

                                                                            <TableRow>

                                                                                {
                                                                                    changedCellColumns.map(
                                                                                        column => (

                                                                                            <TableCell
                                                                                                key={
                                                                                                    column
                                                                                                }

                                                                                                sx={{
                                                                                                    fontWeight:
                                                                                                        "bold",

                                                                                                    background:
                                                                                                        "#F5F3FF",

                                                                                                    color:
                                                                                                        "#5B21B6"
                                                                                                }}
                                                                                            >
                                                                                                {
                                                                                                    column
                                                                                                }
                                                                                            </TableCell>

                                                                                        )
                                                                                    )
                                                                                }

                                                                            </TableRow>

                                                                        </TableHead>


                                                                        <TableBody>

                                                                            {
                                                                                changedCells.map(
                                                                                    (
                                                                                        cell,
                                                                                        index
                                                                                    ) => (

                                                                                        <TableRow
                                                                                            key={
                                                                                                index
                                                                                            }

                                                                                            hover
                                                                                        >

                                                                                            {
                                                                                                changedCellColumns.map(
                                                                                                    column => (

                                                                                                        <TableCell
                                                                                                            key={
                                                                                                                column
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                renderChangeValue(
                                                                                                                    cell?.[
                                                                                                                        column
                                                                                                                    ]
                                                                                                                )
                                                                                                            }
                                                                                                        </TableCell>

                                                                                                    )
                                                                                                )
                                                                                            }

                                                                                        </TableRow>

                                                                                    )
                                                                                )
                                                                            }

                                                                        </TableBody>

                                                                    </Table>

                                                                </TableContainer>

                                                            )
                                                    }

                                                </Box>

                                            )
                                        }


                                        {/* ================================================= */}
                                        {/* INSERTED / UPDATED / DELETED */}
                                        {/* ================================================= */}

                                        {
                                            (
                                                selectedChange === "inserted" ||
                                                selectedChange === "updated" ||
                                                selectedChange === "deleted"
                                            ) && (

                                                selectedChangeRows.length === 0

                                                    ? (

                                                        <Box
                                                            sx={{
                                                                p: 4,

                                                                textAlign:
                                                                    "center",

                                                                background:
                                                                    "#F8FAFC",

                                                                borderRadius:
                                                                    2
                                                            }}
                                                        >

                                                            <Typography
                                                                color="text.secondary"
                                                            >
                                                                No row-level
                                                                details were
                                                                returned by
                                                                the backend
                                                                for this
                                                                operation.
                                                            </Typography>

                                                        </Box>

                                                    )

                                                    : (

                                                        <TableContainer
                                                            component={
                                                                Paper
                                                            }

                                                            elevation={0}

                                                            sx={{
                                                                border:
                                                                    "1px solid #E2E8F0",

                                                                borderRadius:
                                                                    2,

                                                                maxHeight:
                                                                    500,

                                                                overflow:
                                                                    "auto"
                                                            }}
                                                        >

                                                            <Table
                                                                stickyHeader
                                                                size="small"
                                                            >

                                                                <TableHead>

                                                                    <TableRow>

                                                                        {
                                                                            selectedRowColumns.map(
                                                                                column => (

                                                                                    <TableCell
                                                                                        key={
                                                                                            column
                                                                                        }

                                                                                        sx={{
                                                                                            fontWeight:
                                                                                                "bold",

                                                                                            background:
                                                                                                "#F8FAFC"
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            column
                                                                                        }
                                                                                    </TableCell>

                                                                                )
                                                                            )
                                                                        }

                                                                    </TableRow>

                                                                </TableHead>


                                                                <TableBody>

                                                                    {
                                                                        selectedChangeRows.map(
                                                                            (
                                                                                row,
                                                                                rowIndex
                                                                            ) => (

                                                                                <TableRow
                                                                                    key={
                                                                                        rowIndex
                                                                                    }

                                                                                    hover
                                                                                >

                                                                                    {
                                                                                        selectedRowColumns.map(
                                                                                            column => (

                                                                                                <TableCell
                                                                                                    key={
                                                                                                        column
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        renderChangeValue(
                                                                                                            row?.[
                                                                                                                column
                                                                                                            ]
                                                                                                        )
                                                                                                    }
                                                                                                </TableCell>

                                                                                            )
                                                                                        )
                                                                                    }

                                                                                </TableRow>

                                                                            )
                                                                        )
                                                                    }

                                                                </TableBody>

                                                            </Table>

                                                        </TableContainer>

                                                    )
                                            )
                                        }

                                    </Paper>

                                )
                            }

                        </Paper>

                    )
                }


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

                    charts={charts}

                    setCharts={setCharts}

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
