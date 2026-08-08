import React from "react";

import {
    Drawer,
    List,
    ListItem,
    ListItemText,
    Typography,
    Divider,
    Box,
    Chip,
    Button,
    CircularProgress
} from "@mui/material";

function Sidebar({
    columns = [],
    calculatedFields = [],
    datasetName = "",
    datasets = [],
    datasetsLoading = false,
    onDatasetSelect = null
}) {

    // ============================================================
    // DRAG COLUMN
    // ============================================================

    const handleDragStart = (
        event,
        columnName
    ) => {

        event.dataTransfer.setData(
            "text/plain",
            columnName
        );

        event.dataTransfer.effectAllowed =
            "copy";
    };


    // ============================================================
    // NORMALIZE COLUMN INFORMATION
    // ============================================================

    const getColumnInfo = (
        column,
        index
    ) => {

        if (
            typeof column === "object" &&
            column !== null
        ) {

            return {

                name:
                    column.name ??
                    `Column ${index + 1}`,

                type:
                    column.type ??
                    "string"

            };

        }


        if (
            typeof column === "string"
        ) {

            return {

                name: column,

                type: "string"

            };

        }


        return {

            name:
                `Column ${index + 1}`,

            type: "string"

        };

    };


    // ============================================================
    // FORMAT TYPE
    // ============================================================

    const getTypeColor = (
        type
    ) => {

        switch (
            String(type).toLowerCase()
        ) {

            case "integer":
            case "number":
                return "primary";

            case "date":
            case "datetime":
                return "secondary";

            case "boolean":
                return "success";

            default:
                return "default";

        }

    };


    // ============================================================
    // FORMAT FILE SIZE
    // ============================================================

    const formatFileSize = (
        bytes
    ) => {

        if (
            !bytes ||
            bytes <= 0
        ) {

            return "0 KB";

        }


        if (
            bytes < 1024
        ) {

            return `${bytes} B`;

        }


        if (
            bytes < 1024 * 1024
        ) {

            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;

        }


        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;

    };


    // ============================================================
    // SELECT DATASET
    // ============================================================

    const handleDatasetSelect = (
        filename
    ) => {

        if (
            !filename ||
            !onDatasetSelect
        ) {

            return;

        }


        onDatasetSelect(
            filename
        );

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Drawer

            variant="permanent"

            sx={{

                width: 260,

                flexShrink: 0,

                "& .MuiDrawer-paper": {

                    width: 260,

                    boxSizing: "border-box",

                    marginTop: "64px",

                    height:
                        "calc(100vh - 64px)",

                    overflowY: "auto",

                    background:
                        "#f8fafc"

                }

            }}

        >

            <Box
                sx={{
                    height: "100%",
                    overflowY: "auto"
                }}
            >

                {/* ================================================= */}
                {/* DATASET HEADER */}
                {/* ================================================= */}

                <Typography
                    variant="h6"
                    sx={{
                        padding: 2,
                        fontWeight: "bold"
                    }}
                >
                    📊 Dataset
                </Typography>


                <Divider />


                <List>

                    {/* ================================================= */}
                    {/* DATASETS AVAILABLE IN MINIO */}
                    {/* ================================================= */}

                    <ListItem>

                        <ListItemText

                            primary="☁️ MinIO Datasets"

                            secondary={
                                datasets.length > 0
                                    ? `${datasets.length} dataset${
                                        datasets.length === 1
                                            ? ""
                                            : "s"
                                    } available`
                                    : "No datasets found"
                            }

                        />

                    </ListItem>


                    {/* ================================================= */}
                    {/* DATASET LIST */}
                    {/* ================================================= */}

                    {datasetsLoading ? (

                        <ListItem>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1
                                }}
                            >

                                <CircularProgress
                                    size={18}
                                />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Loading datasets...
                                </Typography>

                            </Box>

                        </ListItem>

                    ) : datasets.length === 0 ? (

                        <ListItem>

                            <ListItemText

                                primary="No datasets available"

                                secondary={
                                    "Upload a CSV or Excel file to MinIO."
                                }

                            />

                        </ListItem>

                    ) : (

                        datasets.map(
                            (
                                dataset,
                                index
                            ) => {

                                const filename =
                                    typeof dataset === "string"
                                        ? dataset
                                        : dataset.name;

                                const size =
                                    typeof dataset === "object"
                                        ? dataset.size
                                        : 0;

                                const isSelected =
                                    filename === datasetName;


                                return (

                                    <ListItem
                                        key={
                                            `${filename}-${index}`
                                        }

                                        disablePadding

                                        sx={{
                                            px: 1
                                        }}
                                    >

                                        <Button

                                            fullWidth

                                            variant={
                                                isSelected
                                                    ? "contained"
                                                    : "text"
                                            }

                                            onClick={() =>
                                                handleDatasetSelect(
                                                    filename
                                                )
                                            }

                                            sx={{

                                                justifyContent:
                                                    "flex-start",

                                                textTransform:
                                                    "none",

                                                textAlign:
                                                    "left",

                                                borderRadius:
                                                    2,

                                                px: 1.5,

                                                py: 1,

                                                color:
                                                    isSelected
                                                        ? "#fff"
                                                        : "#334155",

                                                backgroundColor:
                                                    isSelected
                                                        ? "#2563eb"
                                                        : "transparent",

                                                "&:hover": {

                                                    backgroundColor:
                                                        isSelected
                                                            ? "#1d4ed8"
                                                            : "#e2e8f0"

                                                }

                                            }}

                                        >

                                            <Box
                                                sx={{
                                                    width: "100%"
                                                }}
                                            >

                                                <Typography
                                                    variant="body2"
                                                    fontWeight={
                                                        isSelected
                                                            ? "bold"
                                                            : "medium"
                                                    }
                                                    sx={{
                                                        wordBreak:
                                                            "break-word"
                                                    }}
                                                >

                                                    📄 {filename}

                                                </Typography>


                                                {size > 0 && (

                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            opacity:
                                                                0.75
                                                        }}
                                                    >

                                                        {formatFileSize(
                                                            size
                                                        )}

                                                    </Typography>

                                                )}

                                            </Box>

                                        </Button>

                                    </ListItem>

                                );

                            }
                        )

                    )}


                    <Divider
                        sx={{
                            my: 1
                        }}
                    />


                    {/* ================================================= */}
                    {/* CURRENT DATASET */}
                    {/* ================================================= */}

                    <ListItem>

                        <ListItemText

                            primary="📂 Current Dataset"

                            secondary={
                                datasetName ||
                                "No dataset selected"
                            }

                            secondaryTypographyProps={{
                                sx: {
                                    wordBreak:
                                        "break-word"
                                }
                            }}

                        />

                    </ListItem>


                    {/* ================================================= */}
                    {/* DATASET STATUS */}
                    {/* ================================================= */}

                    <ListItem>

                        <ListItemText
                            primary="Dataset Status"
                        />

                        <Chip

                            size="small"

                            label={
                                columns.length > 0
                                    ? "Loaded"
                                    : "No Dataset"
                            }

                            color={
                                columns.length > 0
                                    ? "success"
                                    : "default"
                            }

                        />

                    </ListItem>


                    {/* ================================================= */}
                    {/* COLUMN COUNT */}
                    {/* ================================================= */}

                    <ListItem>

                        <ListItemText

                            primary="Columns"

                            secondary={
                                `${columns.length} columns available`
                            }

                        />

                    </ListItem>


                    {/* ================================================= */}
                    {/* INSTRUCTION */}
                    {/* ================================================= */}

                    <ListItem>

                        <ListItemText

                            primary="Drag columns into chart axis boxes"

                            secondary="Use columns to build charts"

                        />

                    </ListItem>


                    <Divider
                        sx={{
                            my: 1
                        }}
                    />


                    {/* ================================================= */}
                    {/* AVAILABLE COLUMNS */}
                    {/* ================================================= */}

                    <ListItem>

                        <ListItemText

                            primary="Available Columns"

                            primaryTypographyProps={{
                                fontWeight:
                                    "bold"
                            }}

                        />

                    </ListItem>


                    {columns.length === 0 ? (

                        <ListItem>

                            <ListItemText

                                primary="No columns available"

                                secondary={
                                    "Select a dataset or upload a file"
                                }

                            />

                        </ListItem>

                    ) : (

                        columns.map(
                            (
                                column,
                                index
                            ) => {

                                const {
                                    name,
                                    type
                                } =
                                    getColumnInfo(
                                        column,
                                        index
                                    );


                                return (

                                    <ListItem

                                        key={
                                            `${name}-${index}`
                                        }

                                        disablePadding

                                        draggable

                                        onDragStart={
                                            (event) =>
                                                handleDragStart(
                                                    event,
                                                    name
                                                )
                                        }

                                        sx={{

                                            cursor:
                                                "grab",

                                            px: 2,

                                            py: 1,

                                            borderRadius:
                                                1,

                                            "&:hover": {

                                                background:
                                                    "#e2e8f0"

                                            },

                                            "&:active": {

                                                cursor:
                                                    "grabbing"

                                            }

                                        }}

                                    >

                                        <ListItemText

                                            primary={
                                                name
                                            }

                                            secondary={

                                                <Chip

                                                    size="small"

                                                    label={
                                                        type
                                                    }

                                                    color={
                                                        getTypeColor(
                                                            type
                                                        )
                                                    }

                                                    variant="outlined"

                                                    sx={{
                                                        mt: 0.5
                                                    }}

                                                />

                                            }

                                        />

                                    </ListItem>

                                );

                            }
                        )

                    )}


                    {/* ================================================= */}
                    {/* CALCULATED FIELDS */}
                    {/* ================================================= */}

                    {
                        calculatedFields.length >
                        0 && (

                            <>

                                <Divider
                                    sx={{
                                        my: 1
                                    }}
                                />


                                <ListItem>

                                    <ListItemText

                                        primary="🧮 Calculated Fields"

                                        primaryTypographyProps={{
                                            fontWeight:
                                                "bold"
                                        }}

                                    />

                                </ListItem>


                                {
                                    calculatedFields.map(
                                        (
                                            field,
                                            index
                                        ) => (

                                            <ListItem

                                                key={
                                                    field.id ||
                                                    index
                                                }

                                                disablePadding

                                                draggable

                                                onDragStart={
                                                    (event) =>
                                                        handleDragStart(
                                                            event,
                                                            field.name
                                                        )
                                                }

                                                sx={{

                                                    cursor:
                                                        "grab",

                                                    px: 2,

                                                    py: 1,

                                                    borderRadius:
                                                        1,

                                                    "&:hover": {

                                                        background:
                                                            "#e2e8f0"

                                                    }

                                                }}

                                            >

                                                <ListItemText

                                                    primary={
                                                        field.name
                                                    }

                                                    secondary={

                                                        field.aggregation &&
                                                        field.sourceColumn

                                                            ? `${field.aggregation}(${field.sourceColumn})`

                                                            : "Calculated field"

                                                    }

                                                />

                                            </ListItem>

                                        )
                                    )

                                }

                            </>

                        )
                    }

                </List>

            </Box>

        </Drawer>

    );
}

export default Sidebar;