import React from "react";

import {
    AppBar,
    Toolbar,
    Typography
} from "@mui/material";

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
            sx={{
                zIndex: 1201,
                backgroundColor: "#111827"
            }}
        >

            <Toolbar>

                {/* ================================================= */}
                {/* TITLE */}
                {/* ================================================= */}

                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        fontWeight: "bold"
                    }}
                >
                    📊 Data Analytics Platform
                </Typography>


                {/* ================================================= */}
                {/* HEADER ACTIONS */}
                {/* ================================================= */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap"
                    }}
                >

                    {/* ================================================= */}
                    {/* CALCULATED FIELD BUILDER */}
                    {/* ================================================= */}

                    <CalculatedFieldBuilder
                        columns={columns}
                        onCreate={onCalculatedFieldCreate}
                    />


                    {/* ================================================= */}
                    {/* FILE UPLOAD */}
                    {/* ================================================= */}

                    <Upload
                        setColumns={setColumns}
                        setDatasetData={setDatasetData}
                        onUploadComplete={onUploadComplete}
                        onDatasetLoaded={onDatasetLoaded}
                        onRefreshDatasets={onUploadRefresh}
                    />

                </div>

            </Toolbar>

        </AppBar>

    );

}

export default Header;