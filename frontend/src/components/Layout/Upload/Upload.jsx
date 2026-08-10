import React, {
    useRef,
    useState
} from "react";

import {
    Button,
    Snackbar,
    Alert
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";


function Upload({
    setColumns,
    setDatasetData,
    onUploadComplete,
    onDatasetLoaded,
    onRefreshDatasets
}) {

    const fileInputRef =
        useRef(null);

    const [fileName, setFileName] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [successOpen, setSuccessOpen] =
        useState(false);

    const [errorOpen, setErrorOpen] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");


    // ============================================================
    // OPEN FILE SELECTOR
    // ============================================================

    const handleButtonClick = () => {

        if (loading) {

            return;

        }


        fileInputRef.current?.click();

    };


    // ============================================================
    // SHOW ERROR
    // ============================================================

    const showError = (
        message
    ) => {

        setErrorMessage(
            message ||
            "Upload failed."
        );

        setErrorOpen(
            true
        );

    };


    // ============================================================
    // RESET FILE INPUT
    // ============================================================

    const resetFileInput = () => {

        if (
            fileInputRef.current
        ) {

            fileInputRef.current.value =
                "";

        }

    };


    // ============================================================
    // BACKEND ERROR
    // ============================================================

    const getBackendError =
        async (
            response
        ) => {

            try {

                const text =
                    await response.text();


                if (!text) {

                    return `Upload failed (${response.status})`;

                }


                try {

                    const json =
                        JSON.parse(
                            text
                        );


                    if (
                        json.detail
                    ) {

                        if (
                            typeof json.detail ===
                            "string"
                        ) {

                            return json.detail;

                        }


                        return JSON.stringify(
                            json.detail
                        );

                    }


                    if (
                        json.message
                    ) {

                        return json.message;

                    }


                    return text;

                }
                catch {

                    return text;

                }

            }
            catch {

                return `Upload failed (${response.status})`;

            }

        };


    // ============================================================
    // FILE SELECTED
    // ============================================================

    const handleFileChange =
        async (
            event
        ) => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            console.log(
                "===================================="
            );

            console.log(
                "FILE SELECTED:",
                file.name
            );

            console.log(
                "SIZE:",
                file.size
            );

            console.log(
                "TYPE:",
                file.type
            );

            console.log(
                "===================================="
            );


            // ====================================================
            // FILE NAME
            // ====================================================

            const lowerName =
                file.name
                    .toLowerCase()
                    .trim();


            // ====================================================
            // SUPPORTED EXTENSIONS
            // ====================================================

            const allowedExtensions = [

                ".csv",
                ".xlsx",
                ".xls",
                ".sql"

            ];


            const validExtension =
                allowedExtensions.some(
                    (
                        extension
                    ) =>
                        lowerName.endsWith(
                            extension
                        )
                );


            if (!validExtension) {

                showError(
                    "Please select a CSV, XLSX, XLS or SQL file."
                );

                resetFileInput();

                return;

            }


            // ====================================================
            // FILE TYPE
            // ====================================================

            const isSQL =
                lowerName.endsWith(
                    ".sql"
                );

            const isCSV =
                lowerName.endsWith(
                    ".csv"
                );

            const isExcel =
                lowerName.endsWith(
                    ".xlsx"
                ) ||
                lowerName.endsWith(
                    ".xls"
                );


            // ====================================================
            // EMPTY FILE
            // ====================================================

            if (
                file.size === 0
            ) {

                showError(
                    "The selected file is empty."
                );

                resetFileInput();

                return;

            }


            setFileName(
                file.name
            );

            setLoading(
                true
            );


            try {

                // ==================================================
                // FORM DATA
                // ==================================================

                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                console.log(
                    "Uploading:",
                    file.name
                );


                // ==================================================
                // UPLOAD
                // ==================================================

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/upload",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                console.log(
                    "FastAPI status:",
                    response.status
                );


                // ==================================================
                // ERROR
                // ==================================================

                if (
                    !response.ok
                ) {

                    const message =
                        await getBackendError(
                            response
                        );


                    throw new Error(
                        message
                    );

                }


                // ==================================================
                // JSON
                // ==================================================

                let analysis;


                try {

                    analysis =
                        await response.json();

                }
                catch {

                    throw new Error(
                        "FastAPI returned invalid JSON."
                    );

                }


                if (
                    !analysis ||
                    typeof analysis !==
                    "object"
                ) {

                    throw new Error(
                        "FastAPI returned an invalid analysis response."
                    );

                }


                // ==================================================
                // FILENAME
                // ==================================================

                const uploadedFilename =
                    analysis.filename ||
                    analysis.name ||
                    file.name;


                if (
                    !uploadedFilename
                ) {

                    throw new Error(
                        "FastAPI did not return a dataset filename."
                    );

                }


                // ==================================================
                // COLUMNS
                // ==================================================

                const backendColumns =
                    Array.isArray(
                        analysis.columns
                    )
                        ? analysis.columns
                        : [];


                // ==================================================
                // DATA
                // ==================================================

                const backendData =
                    Array.isArray(
                        analysis.data
                    )
                        ? analysis.data
                        : [];


                // ==================================================
                // CSV / EXCEL VALIDATION
                // ==================================================

                if (
                    !isSQL &&
                    backendData.length === 0
                ) {

                    throw new Error(
                        "The uploaded file contains no readable rows."
                    );

                }


                // ==================================================
                // SQL VALIDATION
                // ==================================================

                if (
                    isSQL &&
                    backendColumns.length === 0
                ) {

                    const sql =
                        analysis.sql ||
                        {};

                    const tables =
                        Array.isArray(
                            sql.tables
                        )
                            ? sql.tables
                            : [];

                    const changes =
                        analysis.changes ||
                        {};

                    const hasSQLInformation =
                        tables.length > 0 ||
                        Object.keys(
                            changes
                        ).length > 0 ||
                        Object.keys(
                            sql
                        ).length > 0 ||
                        backendData.length > 0;


                    if (
                        !hasSQLInformation
                    ) {

                        throw new Error(
                            "The SQL file was uploaded, but no tables, columns, rows or SQL changes could be detected."
                        );

                    }

                }


                // ==================================================
                // SOURCE TYPE
                // ==================================================

                const sourceType =
                    analysis.source_type ||
                    (
                        isSQL
                            ? "sql"
                            : isCSV
                                ? "csv"
                                : "excel"
                    );


                // ==================================================
                // CREATE COMPLETE DATASET OBJECT
                // ==================================================

                const datasetResult = {

                    ...analysis,

                    filename:
                        uploadedFilename,

                    name:
                        uploadedFilename,

                    source_type:
                        sourceType,

                    data:
                        backendData,

                    columns:
                        backendColumns

                };


                console.log(
                    "===================================="
                );

                console.log(
                    "UPLOAD SUCCESS"
                );

                console.log(
                    "Dataset:",
                    uploadedFilename
                );

                console.log(
                    "Rows:",
                    analysis.rows ??
                    backendData.length
                );

                console.log(
                    "Columns:",
                    analysis.columns_count ??
                    backendColumns.length
                );

                console.log(
                    "===================================="
                );


                // ==================================================
                // IMPORTANT
                //
                // DO NOT DO:
                //
                // setColumns(...)
                // setDatasetData(...)
                //
                // here.
                //
                // Dashboard's onDatasetLoaded is the ONE place
                // responsible for updating the active dataset.
                // ==================================================

                if (
                    typeof onDatasetLoaded ===
                    "function"
                ) {

                    onDatasetLoaded(
                        datasetResult
                    );

                }


                // ==================================================
                // REFRESH MINIO LIST
                //
                // This ONLY updates the dropdown.
                //
                // DatasetSelector will NOT reload the dataset.
                // ==================================================

                if (
                    typeof onRefreshDatasets ===
                    "function"
                ) {

                    try {

                        await onRefreshDatasets(
                            uploadedFilename
                        );

                    }
                    catch (
                        refreshError
                    ) {

                        console.error(
                            "MinIO refresh failed:",
                            refreshError
                        );

                        // Upload remains successful.
                    }

                }


                // ==================================================
                // UPLOAD COMPLETE
                //
                // Do NOT use this to reset charts.
                // ==================================================

                if (
                    typeof onUploadComplete ===
                    "function"
                ) {

                    onUploadComplete(
                        datasetResult
                    );

                }


                setSuccessOpen(
                    true
                );

            }
            catch (
                error
            ) {

                console.error(
                    "===================================="
                );

                console.error(
                    "UPLOAD ERROR:",
                    error
                );

                console.error(
                    "===================================="
                );


                if (
                    error instanceof TypeError
                ) {

                    showError(
                        "Cannot connect to FastAPI. Make sure the backend is running at http://127.0.0.1:8000"
                    );

                }
                else {

                    showError(
                        error?.message ||
                        "Upload failed."
                    );

                }

            }
            finally {

                setLoading(
                    false
                );

                resetFileInput();

            }

        };


    // ============================================================
    // UI
    // ============================================================

    return (

        <>

            <input

                ref={
                    fileInputRef
                }

                type="file"

                accept={[
                    ".csv",
                    ".xlsx",
                    ".xls",
                    ".sql",
                    "text/csv",
                    "application/sql",
                    "text/plain"
                ].join(",")}

                style={{
                    display: "none"
                }}

                onChange={
                    handleFileChange
                }

            />


            <Button

                variant="contained"

                startIcon={
                    <UploadFileIcon />
                }

                disabled={
                    loading
                }

                onClick={
                    handleButtonClick
                }

                sx={{

                    backgroundColor:
                        "#2563eb",

                    "&:hover": {

                        backgroundColor:
                            "#1d4ed8"

                    },

                    "&:disabled": {

                        backgroundColor:
                            "#93c5fd"

                    }

                }}

            >

                {
                    loading
                        ? "Uploading..."
                        : "Upload CSV / Excel / SQL"
                }

            </Button>


            <Snackbar

                open={
                    successOpen
                }

                autoHideDuration={
                    4000
                }

                onClose={() =>
                    setSuccessOpen(
                        false
                    )
                }

            >

                <Alert

                    severity="success"

                    variant="filled"

                    onClose={() =>
                        setSuccessOpen(
                            false
                        )
                    }

                >

                    {fileName}
                    {" uploaded successfully"}

                </Alert>

            </Snackbar>


            <Snackbar

                open={
                    errorOpen
                }

                autoHideDuration={
                    8000
                }

                onClose={() =>
                    setErrorOpen(
                        false
                    )
                }

            >

                <Alert

                    severity="error"

                    variant="filled"

                    onClose={() =>
                        setErrorOpen(
                            false
                        )
                    }

                >

                    {errorMessage}

                </Alert>

            </Snackbar>

        </>

    );

}


export default Upload;