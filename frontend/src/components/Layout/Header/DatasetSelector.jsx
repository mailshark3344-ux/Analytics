import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = "http://127.0.0.1:8000";

const AUTO_REFRESH_INTERVAL = 5000;

function DatasetSelector({
    onDatasetLoaded,
    refreshKey = 0
}) {

    const [datasets, setDatasets] = useState([]);

    const [selectedDataset, setSelectedDataset] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [loadingDataset, setLoadingDataset] =
        useState(false);

    const [error, setError] =
        useState("");

    const selectedDatasetRef =
        useRef("");

    const firstLoadRef =
        useRef(true);


    // ============================================================
    // KEEP REF IN SYNC
    // ============================================================

    useEffect(() => {

        selectedDatasetRef.current =
            selectedDataset;

    }, [selectedDataset]);


    // ============================================================
    // GET DATASET NAME
    // ============================================================

    const getDatasetName = (dataset) => {

        if (typeof dataset === "string") {

            return dataset;

        }

        return dataset?.name || "";

    };


    // ============================================================
    // LOAD ONE DATASET
    // ============================================================

    const loadDataset = useCallback(async (filename) => {

        if (!filename) {
            return;
        }

        setLoadingDataset(true);

        setError("");

        try {

            console.log(
                "Loading dataset:",
                filename
            );


            const response =
                await fetch(
                    `${API_URL}/datasets/${encodeURIComponent(filename)}`,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            const responseText =
                await response.text();


            if (!response.ok) {

                let message =
                    `Unable to load dataset (${response.status})`;


                try {

                    const errorData =
                        JSON.parse(responseText);


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


                throw new Error(message);

            }


            let analysis;


            try {

                analysis =
                    JSON.parse(responseText);

            }
            catch {

                throw new Error(
                    "FastAPI returned invalid JSON."
                );

            }


            console.log(
                "Loaded dataset:",
                analysis.filename
            );


            // ----------------------------------------------------
            // Send complete dataset to Dashboard
            // ----------------------------------------------------

            if (
                typeof onDatasetLoaded ===
                "function"
            ) {

                onDatasetLoaded(
                    analysis
                );

            }

        }
        catch (err) {

            console.error(
                "DATASET LOAD ERROR:",
                err
            );


            setError(
                err.message ||
                "Unable to load selected dataset."
            );

        }
        finally {

            setLoadingDataset(false);

        }

    }, [onDatasetLoaded]);


    // ============================================================
    // LOAD DATASETS FROM MINIO
    // ============================================================

    const loadDatasets = useCallback(async (
        autoSelectLatest = false,
        showLoading = true
    ) => {

        if (showLoading) {

            setLoading(true);

        }

        setError("");


        try {

            const response =
                await fetch(
                    `${API_URL}/datasets`,
                    {
                        method: "GET",

                        // Prevent browser caching
                        cache: "no-store",

                        headers: {
                            "Cache-Control": "no-cache"
                        }
                    }
                );


            const responseText =
                await response.text();


            if (!response.ok) {

                let message =
                    `Unable to load datasets (${response.status})`;


                try {

                    const errorData =
                        JSON.parse(responseText);


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


                throw new Error(message);

            }


            let result;


            try {

                result =
                    JSON.parse(responseText);

            }
            catch {

                throw new Error(
                    "FastAPI returned invalid JSON."
                );

            }


            const datasetList =
                Array.isArray(result.datasets)
                    ? result.datasets
                    : [];


            console.log(
                "MinIO datasets:",
                datasetList
            );


            // ====================================================
            // UPDATE DATASET LIST
            // ====================================================

            setDatasets(
                datasetList
            );


            const currentSelected =
                selectedDatasetRef.current;


            const datasetNames =
                datasetList
                    .map(getDatasetName)
                    .filter(Boolean);


            // ====================================================
            // AUTO SELECT NEWEST DATASET
            // ====================================================

            if (
                autoSelectLatest &&
                datasetNames.length > 0
            ) {

                const latestDataset =
                    datasetNames[0];


                setSelectedDataset(
                    latestDataset
                );


                selectedDatasetRef.current =
                    latestDataset;


                await loadDataset(
                    latestDataset
                );


                return;

            }


            // ====================================================
            // KEEP CURRENT DATASET SELECTED
            // ====================================================

            if (
                currentSelected &&
                datasetNames.includes(
                    currentSelected
                )
            ) {

                // Current dataset still exists.
                // Do not reload it every 5 seconds.

                return;

            }


            // ====================================================
            // CURRENT DATASET WAS DELETED
            // ====================================================

            if (
                currentSelected &&
                !datasetNames.includes(
                    currentSelected
                )
            ) {

                console.log(
                    "Selected dataset no longer exists:",
                    currentSelected
                );


                setSelectedDataset("");

                selectedDatasetRef.current =
                    "";

            }


            // ====================================================
            // FIRST LOAD
            // ====================================================

            if (
                firstLoadRef.current &&
                datasetNames.length > 0
            ) {

                const latestDataset =
                    datasetNames[0];


                setSelectedDataset(
                    latestDataset
                );


                selectedDatasetRef.current =
                    latestDataset;


                await loadDataset(
                    latestDataset
                );

            }


            firstLoadRef.current =
                false;

        }
        catch (err) {

            console.error(
                "DATASET LIST ERROR:",
                err
            );


            // During automatic polling, don't destroy
            // the existing dropdown because of a temporary
            // network error.

            if (showLoading) {

                setError(
                    err.message ||
                    "Unable to load datasets from MinIO."
                );

                setDatasets([]);

            }

        }
        finally {

            if (showLoading) {

                setLoading(false);

            }

        }

    }, [loadDataset]);


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadDatasets(
            false,
            true
        );

    }, [loadDatasets]);


    // ============================================================
    // AUTOMATIC MINIO REFRESH
    //
    // Checks MinIO every 5 seconds.
    //
    // Example:
    //
    // 10:00:00 -> dataset list loaded
    //
    // 10:00:05 -> MinIO checked
    //
    // 10:00:10 -> MinIO checked
    //
    // If a new Excel file was manually added to MinIO,
    // it will appear automatically.
    // ============================================================

    useEffect(() => {

        const intervalId =
            setInterval(() => {

                console.log(
                    "Checking MinIO for new datasets..."
                );


                loadDatasets(
                    false,
                    false
                );

            }, AUTO_REFRESH_INTERVAL);


        return () => {

            clearInterval(
                intervalId
            );

        };

    }, [loadDatasets]);


    // ============================================================
    // REFRESH AFTER UPLOAD
    // ============================================================

    useEffect(() => {

        if (refreshKey > 0) {

            console.log(
                "Upload completed. Refreshing MinIO datasets..."
            );


            loadDatasets(
                true,
                true
            );

        }

    }, [
        refreshKey,
        loadDatasets
    ]);


    // ============================================================
    // HANDLE DATASET SELECTION
    // ============================================================

    const handleDatasetChange = async (
        event
    ) => {

        const filename =
            event.target.value;


        setSelectedDataset(
            filename
        );


        selectedDatasetRef.current =
            filename;


        await loadDataset(
            filename
        );

    };


    // ============================================================
    // MANUAL REFRESH
    // ============================================================

    const handleRefresh = async () => {

        await loadDatasets(
            false,
            true
        );

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <Box
            sx={{
                px: 2,
                py: 2
            }}
        >

            {/* ================================================= */}
            {/* TITLE */}
            {/* ================================================= */}

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1
                }}
            >

                <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                >
                    ☁️ MinIO Datasets
                </Typography>


                <Tooltip title="Refresh datasets">

                    <IconButton
                        size="small"
                        onClick={handleRefresh}
                        disabled={
                            loading ||
                            loadingDataset
                        }
                    >

                        <RefreshIcon
                            fontSize="small"
                        />

                    </IconButton>

                </Tooltip>

            </Box>


            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (

                <Alert
                    severity="error"
                    sx={{
                        mb: 2
                    }}
                >

                    {error}

                </Alert>

            )}


            {/* ================================================= */}
            {/* LOADING */}
            {/* ================================================= */}

            {loading ? (

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 1
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

            ) : datasets.length === 0 ? (

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        py: 1
                    }}
                >
                    No datasets available
                </Typography>

            ) : (

                <FormControl
                    fullWidth
                    size="small"
                >

                    <InputLabel>
                        Select Dataset
                    </InputLabel>


                    <Select

                        value={
                            selectedDataset
                        }

                        label="Select Dataset"

                        onChange={
                            handleDatasetChange
                        }

                        disabled={
                            loadingDataset
                        }

                    >

                        {datasets.map(
                            (
                                dataset,
                                index
                            ) => {

                                const filename =
                                    getDatasetName(
                                        dataset
                                    );


                                if (!filename) {
                                    return null;
                                }


                                return (

                                    <MenuItem
                                        key={
                                            `${filename}-${index}`
                                        }
                                        value={
                                            filename
                                        }
                                    >

                                        {filename}

                                    </MenuItem>

                                );

                            }
                        )}

                    </Select>


                    {/* ================================================= */}
                    {/* LOADING SELECTED DATASET */}
                    {/* ================================================= */}

                    {loadingDataset && (

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 1
                            }}
                        >

                            <CircularProgress
                                size={16}
                            />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Loading dataset...
                            </Typography>

                        </Box>

                    )}

                </FormControl>

            )}

        </Box>

    );

}


export default DatasetSelector;