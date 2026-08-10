import React from "react";

import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Chip,
    Tooltip
} from "@mui/material";

import {
    CloudUpload,
    AutoAwesome,
    DatasetOutlined
} from "@mui/icons-material";

import Upload from "../Upload/Upload";
import CalculatedFieldBuilder from "./CalculatedFieldBuilder";

function Header({
    setColumns,
    setDatasetData,
    onCalculatedFieldCreate,
    onUploadComplete,
    onDatasetLoaded,
    onUploadRefresh,
    columns = []
}) {

    return (

        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: 1300,

                height: 72,

                background:
                    "rgba(221, 230, 216, 0.92)",

                backdropFilter:
                    "blur(18px)",

                borderBottom:
                    "1px solid #E8ECF3",

                color:
                    "#0F172A"
            }}
        >

            <Toolbar
                sx={{
                    minHeight: "72px !important",

                    px: {
                        xs: 2,
                        md: 3
                    },

                    gap: 2
                }}
            >

                {/* BRAND */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,

                        minWidth: {
                            xs: "auto",
                            md: 250
                        }
                    }}
                >

                    <Box
                        sx={{
                            width: 42,
                            height: 42,

                            borderRadius: 2.5,

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            background:
                                "linear-gradient(135deg,#4F46E5,#7C3AED)",

                            color: "#060706",

                            boxShadow:
                                "0 8px 20px rgba(79,70,229,.25)"
                        }}
                    >
                        <AutoAwesome />
                    </Box>

                    <Box
                        sx={{
                            display: {
                                xs: "none",
                                sm: "block"
                            }
                        }}
                    >

                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: 16,
                                lineHeight: 1.1
                            }}
                        >
                            InsightFlow
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 11,
                                color: "#94A3B8",
                                mt: 0.3
                            }}
                        >
                            Analytics workspace
                        </Typography>

                    </Box>

                </Box>


                {/* PAGE STATUS */}

                <Box
                    sx={{
                        flexGrow: 1,

                        display: {
                            xs: "none",
                            md: "flex"
                        },

                        alignItems: "center",

                        gap: 1
                    }}
                >

                    <Chip
                        icon={
                            <DatasetOutlined
                                sx={{
                                    fontSize: 17
                                }}
                            />
                        }
                        label={
                            columns.length > 0
                                ? `${columns.length} columns loaded`
                                : "No dataset loaded"
                        }
                        size="small"
                        sx={{
                            background:
                                columns.length > 0
                                    ? "#ECFDF5"
                                    : "#F8FAFC",

                            color:
                                columns.length > 0
                                    ? "#047857"
                                    : "#64748B",

                            fontWeight: 700,

                            border:
                                columns.length > 0
                                    ? "1px solid #A7F3D0"
                                    : "1px solid #1a1c1f"
                        }}
                    />

                </Box>


                {/* ACTIONS */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1
                    }}
                >

                    <Tooltip title="Create calculated field">

                        <Box>

                            <CalculatedFieldBuilder
                                columns={columns}
                                onCreate={onCalculatedFieldCreate}
                            />

                        </Box>

                    </Tooltip>


                    <Tooltip title="Upload dataset">

                        <Box>

                            <Upload
                                setColumns={setColumns}
                                setDatasetData={setDatasetData}
                                onUploadComplete={onUploadComplete}
                                onDatasetLoaded={onDatasetLoaded}
                                onRefreshDatasets={onUploadRefresh}
                            />

                        </Box>

                    </Tooltip>

                </Box>

            </Toolbar>

        </AppBar>

    );
}

export default Header;
