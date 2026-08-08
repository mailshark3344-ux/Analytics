import React, { useRef, useState } from "react";

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
    onDatasetLoaded
}) {

    const fileInputRef = useRef(null);

    const [fileName, setFileName] = useState("");

    const [loading, setLoading] = useState(false);

    const [successOpen, setSuccessOpen] = useState(false);

    const [errorOpen, setErrorOpen] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");


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

    const showError = (message) => {

        setErrorMessage(message);

        setErrorOpen(true);

    };


    // ============================================================
    // RESET FILE INPUT
    // ============================================================

    const resetFileInput = () => {

        if (fileInputRef.current) {

            fileInputRef.current.value = "";

        }

    };


    // ============================================================
    // FILE SELECTED
    // ============================================================

    const handleFileChange = async (event) => {

        const file =
            event.target.files?.[0];


        if (!file) {

            return;

        }


        console.log(
            "===================================="
        );

        console.log(
            "FILE SELECTED"
        );

        console.log(
            "Name:",
            file.name
        );

        console.log(
            "Size:",
            file.size
        );

        console.log(
            "Type:",
            file.type
        );

        console.log(
            "===================================="
        );


        // ========================================================
        // VALIDATE FILE EXTENSION
        // ========================================================

        const lowerName =
            file.name.toLowerCase();


        const allowedExtensions = [
            ".csv",
            ".xlsx",
            ".xls"
        ];


        const validExtension =
            allowedExtensions.some(
                (extension) =>
                    lowerName.endsWith(extension)
            );


        if (!validExtension) {

            showError(
                "Please select a CSV, XLSX or XLS file."
            );

            resetFileInput();

            return;

        }


        // ========================================================
        // VALIDATE EMPTY FILE
        // ========================================================

        if (file.size === 0) {

            showError(
                "The selected file is empty."
            );

            resetFileInput();

            return;

        }


        // ========================================================
        // SHOW SELECTED FILE NAME
        // ========================================================

        setFileName(
            file.name
        );

        setLoading(true);


        try {

            // ====================================================
            // CREATE FORM DATA
            // ====================================================

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            console.log(
                "Sending file to FastAPI..."
            );


            // ====================================================
            // SEND TO FASTAPI
            // ====================================================

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


            // ====================================================
            // READ RESPONSE
            // ====================================================

            const responseText =
                await response.text();


            console.log(
                "FastAPI response:",
                responseText
            );


            // ====================================================
            // BACKEND ERROR
            // ====================================================

            if (!response.ok) {

                let message =
                    `Upload failed (${response.status})`;


                try {

                    const errorData =
                        JSON.parse(
                            responseText
                        );


                    if (errorData.detail) {

                        message =
                            errorData.detail;

                    }

                }
                catch {

                    if (responseText) {

                        message =
                            responseText;

                    }

                }


                throw new Error(
                    message
                );

            }


            // ====================================================
            // PARSE JSON
            // ====================================================

            let analysis;


            try {

                analysis =
                    JSON.parse(
                        responseText
                    );

            }
            catch {

                throw new Error(
                    "FastAPI returned invalid JSON."
                );

            }


            console.log(
                "Upload analysis:",
                analysis
            );


            // ====================================================
            // VALIDATE FILENAME
            // ====================================================

            const uploadedFilename =
                analysis.filename ||
                file.name;


            if (!uploadedFilename) {

                throw new Error(
                    "FastAPI did not return a dataset filename."
                );

            }


            console.log(
                "Active dataset:",
                uploadedFilename
            );


            // ====================================================
            // VALIDATE COLUMNS
            // ====================================================

            const backendColumns =
                Array.isArray(
                    analysis.columns
                )
                    ? analysis.columns
                    : [];


            if (
                backendColumns.length === 0
            ) {

                throw new Error(
                    "No columns were detected in the uploaded file."
                );

            }


            // ====================================================
            // VALIDATE DATA
            // ====================================================

            const backendData =
                Array.isArray(
                    analysis.data
                )
                    ? analysis.data
                    : [];


            if (
                backendData.length === 0
            ) {

                throw new Error(
                    "The uploaded file contains no readable rows."
                );

            }


            // ====================================================
            // UPDATE COLUMNS
            // ====================================================

            if (setColumns) {

                setColumns(
                    backendColumns
                );

            }


            // ====================================================
            // UPDATE DATA
            // ====================================================

            if (setDatasetData) {

                setDatasetData(
                    backendData
                );

            }


            // ====================================================
            // SEND COMPLETE ANALYSIS TO DASHBOARD
            //
            // THIS IS WHAT UPDATES:
            //
            // Current Dataset
            // Dataset Name
            // Rows
            // Columns
            // Charts
            // ====================================================

            if (onDatasetLoaded) {

                onDatasetLoaded({

                    ...analysis,

                    // Always make sure filename exists
                    filename:
                        uploadedFilename

                });

            }


            // ====================================================
            // DO NOT RESET DATASET HERE
            //
            // onDatasetLoaded() handles the dataset state.
            //
            // If onUploadComplete is only used for calculated
            // fields/charts, you can keep it here.
            // ====================================================

            if (onUploadComplete) {

                onUploadComplete();

            }


            // ====================================================
            // SUCCESS LOG
            // ====================================================

            console.log(
                "===================================="
            );

            console.log(
                "UPLOAD SUCCESS"
            );

            console.log(
                "Active Dataset:",
                uploadedFilename
            );

            console.log(
                "Rows:",
                analysis.rows
            );

            console.log(
                "Columns:",
                analysis.columns_count
            );

            console.log(
                "===================================="
            );


            // ====================================================
            // SUCCESS MESSAGE
            // ====================================================

            setSuccessOpen(true);

        }
        catch (error) {

            console.error(
                "===================================="
            );

            console.error(
                "UPLOAD ERROR"
            );

            console.error(
                error
            );

            console.error(
                "===================================="
            );


            // ====================================================
            // CONNECTION ERROR
            // ====================================================

            if (
                error instanceof TypeError
            ) {

                showError(
                    "Cannot connect to FastAPI. Make sure the backend is running at http://127.0.0.1:8000"
                );

            }
            else {

                showError(
                    error.message ||
                    "Upload failed."
                );

            }

        }
        finally {

            setLoading(false);

            resetFileInput();

        }

    };


    // ============================================================
    // UI
    // ============================================================

    return (

        <>

            {/* ================================================= */}
            {/* HIDDEN FILE INPUT */}
            {/* ================================================= */}

            <input

                ref={fileInputRef}

                type="file"

                accept=".csv,.xlsx,.xls"

                style={{
                    display: "none"
                }}

                onChange={
                    handleFileChange
                }

            />


            {/* ================================================= */}
            {/* UPLOAD BUTTON */}
            {/* ================================================= */}

            <Button

                variant="contained"

                startIcon={
                    <UploadFileIcon />
                }

                disabled={loading}

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
                        : "Upload CSV / Excel"
                }

            </Button>


            {/* ================================================= */}
            {/* SUCCESS MESSAGE */}
            {/* ================================================= */}

            <Snackbar

                open={
                    successOpen
                }

                autoHideDuration={
                    4000
                }

                onClose={() =>
                    setSuccessOpen(false)
                }

            >

                <Alert

                    severity="success"

                    variant="filled"

                    onClose={() =>
                        setSuccessOpen(false)
                    }

                >

                    {fileName}

                    {" uploaded successfully"}

                </Alert>

            </Snackbar>


            {/* ================================================= */}
            {/* ERROR MESSAGE */}
            {/* ================================================= */}

            <Snackbar

                open={
                    errorOpen
                }

                autoHideDuration={
                    7000
                }

                onClose={() =>
                    setErrorOpen(false)
                }

            >

                <Alert

                    severity="error"

                    variant="filled"

                    onClose={() =>
                        setErrorOpen(false)
                    }

                >

                    {errorMessage}

                </Alert>

            </Snackbar>

        </>

    );

}


export default Upload;