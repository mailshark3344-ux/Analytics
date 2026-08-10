import React from "react";

import {
    Drawer,
    Typography,
    Divider,
    Box,
    Chip,
    Button,
    CircularProgress,
    List,
    ListItemButton
} from "@mui/material";

import {
    StorageRounded,
    TableChartRounded,
    CheckCircleRounded,
    DragIndicatorRounded,
    FunctionsRounded,
    CloudRounded
} from "@mui/icons-material";

function Sidebar({
    columns = [],
    calculatedFields = [],
    datasetName = "",
    datasets = [],
    datasetsLoading = false,
    onDatasetSelect = null
}) {

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

        return {
            name:
                typeof column === "string"
                    ? column
                    : `Column ${index + 1}`,

            type: "string"
        };

    };


    const getTypeColor = (
        type
    ) => {

        switch (
            String(type).toLowerCase()
        ) {

            case "integer":
            case "number":
                return "#60A5FA";

            case "date":
            case "datetime":
                return "#C084FC";

            case "boolean":
                return "#34D399";

            default:
                return "#94A3B8";

        }

    };


    return (

        <Drawer
            variant="permanent"
            sx={{

                width: 280,

                flexShrink: 0,

                "& .MuiDrawer-paper": {

                    width: 280,

                    boxSizing: "border-box",

                    top: 72,

                    height:
                        "calc(100vh - 72px)",

                    borderRight:
                        "1px solid #1E293B",

                    background:
                        "#0B1220",

                    color: "#E2E8F0",

                    overflowX: "hidden"
                }

            }}
        >

            <Box
                sx={{
                    p: 2.5
                }}
            >

                {/* WORKSPACE */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 3
                    }}
                >

                    <Box
                        sx={{
                            width: 38,
                            height: 38,

                            borderRadius: 2,

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            background:
                                "linear-gradient(135deg,#312E81,#7C3AED)",

                            color: "#fff"
                        }}
                    >
                        <StorageRounded />
                    </Box>

                    <Box>

                        <Typography
                            sx={{
                                fontSize: 12,
                                color: "#64748B"
                            }}
                        >
                            WORKSPACE
                        </Typography>

                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: 14
                            }}
                        >
                            Data Explorer
                        </Typography>

                    </Box>

                </Box>


                {/* CURRENT DATASET */}

                <Box
                    sx={{
                        p: 2,

                        mb: 2.5,

                        borderRadius: 3,

                        background:
                            "linear-gradient(145deg,#111C31,#0F172A)",

                        border:
                            "1px solid #1E293B"
                    }}
                >

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1
                        }}
                    >

                        <CloudRounded
                            sx={{
                                fontSize: 18,
                                color: "#818CF8"
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 11,
                                color: "#64748B",
                                fontWeight: 700
                            }}
                        >
                            CURRENT DATASET
                        </Typography>

                    </Box>

                    <Typography
                        sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            wordBreak: "break-word",
                            mb: 1.5
                        }}
                    >
                        {datasetName ||
                            "No dataset selected"}
                    </Typography>

                    <Chip
                        size="small"
                        icon={
                            <CheckCircleRounded
                                sx={{
                                    fontSize: 14
                                }}
                            />
                        }
                        label={
                            columns.length > 0
                                ? "Ready"
                                : "Waiting"
                        }
                        sx={{
                            background:
                                columns.length > 0
                                    ? "rgba(16,185,129,.12)"
                                    : "rgba(148,163,184,.1)",

                            color:
                                columns.length > 0
                                    ? "#34D399"
                                    : "#94A3B8",

                            border:
                                "1px solid rgba(255,255,255,.06)",

                            fontWeight: 700
                        }}
                    />

                </Box>


                {/* DATASETS */}

                <Typography
                    sx={{
                        fontSize: 11,
                        color: "#64748B",
                        fontWeight: 800,
                        letterSpacing: 1,
                        mb: 1
                    }}
                >
                    DATASETS
                </Typography>


                {datasetsLoading ? (

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1
                        }}
                    >

                        <CircularProgress
                            size={16}
                            sx={{
                                color: "#818CF8"
                            }}
                        />

                        <Typography
                            fontSize={12}
                            color="#64748B"
                        >
                            Loading...
                        </Typography>

                    </Box>

                ) : datasets.length === 0 ? (

                    <Box
                        sx={{
                            p: 1.5,
                            mb: 2
                        }}
                    >

                        <Typography
                            fontSize={12}
                            color="#64748B"
                        >
                            No datasets available.
                        </Typography>

                    </Box>

                ) : (

                    <Box
                        sx={{
                            maxHeight: 160,
                            overflowY: "auto",
                            mb: 2
                        }}
                    >

                        {datasets.map(
                            (
                                dataset,
                                index
                            ) => {

                                const filename =
                                    typeof dataset === "string"
                                        ? dataset
                                        : dataset.name;

                                const selected =
                                    filename ===
                                    datasetName;

                                return (

                                    <Button
                                        key={
                                            `${filename}-${index}`
                                        }

                                        fullWidth

                                        onClick={() =>
                                            onDatasetSelect &&
                                            onDatasetSelect(
                                                filename
                                            )
                                        }

                                        sx={{
                                            justifyContent:
                                                "flex-start",

                                            textTransform:
                                                "none",

                                            color:
                                                selected
                                                    ? "#fff"
                                                    : "#94A3B8",

                                            background:
                                                selected
                                                    ? "rgba(99,102,241,.18)"
                                                    : "transparent",

                                            borderRadius: 2,

                                            mb: 0.5,

                                            "&:hover": {
                                                background:
                                                    "rgba(99,102,241,.12)"
                                            }
                                        }}
                                    >

                                        <Typography
                                            fontSize={12}
                                            noWrap
                                        >
                                            {filename}
                                        </Typography>

                                    </Button>

                                );

                            }
                        )}

                    </Box>

                )}


                <Divider
                    sx={{
                        borderColor: "#1E293B",
                        mb: 2
                    }}
                />


                {/* COLUMNS */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5
                    }}
                >

                    <Typography
                        sx={{
                            fontSize: 11,
                            color: "#64748B",
                            fontWeight: 800,
                            letterSpacing: 1
                        }}
                    >
                        DATA COLUMNS
                    </Typography>

                    <Chip
                        label={columns.length}
                        size="small"
                        sx={{
                            height: 22,
                            minWidth: 28,

                            background:
                                "rgba(99,102,241,.15)",

                            color: "#A5B4FC",

                            fontSize: 11,
                            fontWeight: 800
                        }}
                    />

                </Box>


                <Box
                    sx={{
                        maxHeight:
                            "calc(100vh - 390px)",

                        overflowY: "auto",

                        pr: 0.5
                    }}
                >

                    {columns.length === 0 ? (

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                background:
                                    "#111827"
                            }}
                        >

                            <Typography
                                fontSize={12}
                                color="#64748B"
                            >
                                Upload a dataset to see
                                available columns.
                            </Typography>

                        </Box>

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

                                    <ListItemButton
                                        key={
                                            `${name}-${index}`
                                        }

                                        draggable

                                        onDragStart={
                                            event =>
                                                handleDragStart(
                                                    event,
                                                    name
                                                )
                                        }

                                        sx={{
                                            mb: 0.5,

                                            p: 1.2,

                                            borderRadius: 2,

                                            cursor:
                                                "grab",

                                            "&:hover": {
                                                background:
                                                    "#111C31"
                                            },

                                            "&:active": {
                                                cursor:
                                                    "grabbing"
                                            }
                                        }}
                                    >

                                        <DragIndicatorRounded
                                            sx={{
                                                fontSize: 17,
                                                color: "#475569",
                                                mr: 0.8
                                            }}
                                        />

                                        <Box
                                            sx={{
                                                minWidth: 0,
                                                flexGrow: 1
                                            }}
                                        >

                                            <Typography
                                                fontSize={12}
                                                fontWeight={600}
                                                noWrap
                                            >
                                                {name}
                                            </Typography>

                                            <Typography
                                                fontSize={10}
                                                sx={{
                                                    color:
                                                        getTypeColor(
                                                            type
                                                        ),
                                                    mt: 0.2
                                                }}
                                            >
                                                {type}
                                            </Typography>

                                        </Box>

                                    </ListItemButton>

                                );

                            }
                        )

                    )}

                </Box>


                {/* CALCULATED FIELDS */}

                {calculatedFields.length > 0 && (

                    <Box
                        sx={{
                            mt: 2
                        }}
                    >

                        <Divider
                            sx={{
                                borderColor:
                                    "#1E293B",
                                mb: 2
                            }}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1
                            }}
                        >

                            <FunctionsRounded
                                sx={{
                                    fontSize: 17,
                                    color: "#A78BFA"
                                }}
                            />

                            <Typography
                                fontSize={11}
                                fontWeight={800}
                                color="#64748B"
                            >
                                CALCULATED FIELDS
                            </Typography>

                        </Box>


                        {calculatedFields.map(
                            (
                                field,
                                index
                            ) => (

                                <ListItemButton
                                    key={
                                        field.id ||
                                        index
                                    }

                                    draggable

                                    onDragStart={
                                        event =>
                                            handleDragStart(
                                                event,
                                                field.name
                                            )
                                    }

                                    sx={{
                                        p: 1,
                                        borderRadius: 2,

                                        "&:hover": {
                                            background:
                                                "#111C31"
                                        }
                                    }}
                                >

                                    <FunctionsRounded
                                        sx={{
                                            fontSize: 15,
                                            color:
                                                "#A78BFA",
                                            mr: 1
                                        }}
                                    />

                                    <Box>

                                        <Typography
                                            fontSize={12}
                                            fontWeight={600}
                                        >
                                            {field.name}
                                        </Typography>

                                        <Typography
                                            fontSize={10}
                                            color="#64748B"
                                        >
                                            {field.aggregation &&
                                            field.sourceColumn
                                                ? `${field.aggregation}(${field.sourceColumn})`
                                                : "Calculated field"}
                                        </Typography>

                                    </Box>

                                </ListItemButton>

                            )
                        )}

                    </Box>

                )}

            </Box>

        </Drawer>

    );
}

export default Sidebar;
