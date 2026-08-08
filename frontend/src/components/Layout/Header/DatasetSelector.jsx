import React, { useEffect, useState } from "react";

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


    // ============================================================
    // LOAD DATASETS FROM MINIO
    // ============================================================

    const loadDatasets = async (
        autoSelectLatest = false
    ) => {

        setLoading(true);

        setError("");

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/datasets"
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
                        message = errorData.detail;
                    }

                }
                catch {
                    if (responseText) {
                        message = responseText;
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


            setDatasets(datasetList);


            // ----------------------------------------------------
            // Automatically select the newest dataset after upload
            // ----------------------------------------------------

            if (
                autoSelectLatest &&
                datasetList.length > 0
            ) {

                const latestDataset =
                    typeof datasetList[0] === "string"
                        ? datasetList[0]
                        : datasetList[0].name;


                if (latestDataset) {

                    setSelectedDataset(
                        latestDataset
                    );

                    await loadDataset(
                        latestDataset
                    );

                }

            }

        }
        catch (err) {

            console.error(
                "DATASET LIST ERROR:",
                err
            );


            setError(
                err.message ||
                "Unable to load datasets from MinIO."
            );

            setDatasets([]);

        }
        finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LOAD SELECTED DATASET
    // ============================================================

    const loadDataset = async (
        filename
    ) => {

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
                    `http://127.0.0.1:8000/datasets/${encodeURIComponent(filename)}`
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
                        message = errorData.detail;
                    }

                }
                catch {

                    if (responseText) {
                        message = responseText;
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
            // IMPORTANT
            // Send complete analysis to Dashboard
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

    };


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadDatasets();

    }, []);


    // ============================================================
    // REFRESH AFTER UPLOAD
    // ============================================================

    useEffect(() => {

        if (refreshKey > 0) {

            loadDatasets(true);

        }

    }, [refreshKey]);


    // ============================================================
    // HANDLE SELECT
    // ============================================================

    const handleDatasetChange = async (
        event
    ) => {

        const filename =
            event.target.value;


        setSelectedDataset(
            filename
        );


        await loadDataset(
            filename
        );

    };


    // ============================================================
    // MANUAL REFRESH
    // ============================================================

    const handleRefresh = async () => {

        await loadDatasets(false);

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
                                    typeof dataset === "string"
                                        ? dataset
                                        : dataset.name;


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