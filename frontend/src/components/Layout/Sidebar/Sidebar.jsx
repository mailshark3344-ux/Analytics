import React from "react";

import {
    Drawer,
    List,
    ListItem,
    ListItemText,
    Typography,
    Divider,
    Box,
    Chip
} from "@mui/material";

function Sidebar({
    columns = [],
    calculatedFields = [],
    datasetName = ""
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

                    background: "#f8fafc"

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
                    {/* COLUMNS */}
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