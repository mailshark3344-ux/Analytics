import React, {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

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


const API_URL =
    "http://127.0.0.1:8000";

const AUTO_REFRESH_INTERVAL =
    5000;


function DatasetSelector({
    onDatasetLoaded,
    refreshKey = 0,
    uploadedDatasetName = ""
}) {

    const [datasets, setDatasets] =
        useState([]);

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

    const mountedRef =
        useRef(true);


    // ============================================================
    // MOUNT / UNMOUNT
    // ============================================================

    useEffect(() => {

        mountedRef.current = true;

        return () => {

            mountedRef.current = false;

        };

    }, []);


    // ============================================================
    // KEEP SELECTED DATASET REF IN SYNC
    // ============================================================

    useEffect(() => {

        selectedDatasetRef.current =
            selectedDataset;

    }, [
        selectedDataset
    ]);


    // ============================================================
    // GET DATASET NAME
    // ============================================================

    const getDatasetName = useCallback(
        (dataset) => {

            if (
                typeof dataset === "string"
            ) {

                return dataset;

            }

            return dataset?.name || "";

        },
        []
    );


    // ============================================================
    // CHECK WHETHER DATASET LIST ACTUALLY CHANGED
    //
    // This is VERY important.
    //
    // MinIO may return a new array every 5 seconds even though
    // the actual dataset list is identical.
    //
    // We don't want to call setDatasets() in that case.
    // ============================================================

    const areDatasetListsEqual = useCallback(
        (
            previous,
            next
        ) => {

            if (
                previous.length !==
                next.length
            ) {

                return false;

            }


            for (
                let index = 0;
                index < next.length;
                index++
            ) {

                const previousName =
                    getDatasetName(
                        previous[index]
                    );

                const nextName =
                    getDatasetName(
                        next[index]
                    );


                if (
                    previousName !==
                    nextName
                ) {

                    return false;

                }


                const previousSize =
                    typeof previous[index] ===
                    "object"
                        ? previous[index]?.size
                        : undefined;

                const nextSize =
                    typeof next[index] ===
                    "object"
                        ? next[index]?.size
                        : undefined;


                if (
                    previousSize !==
                    nextSize
                ) {

                    return false;

                }

            }


            return true;

        },
        [
            getDatasetName
        ]
    );


    // ============================================================
    // LOAD ONE DATASET
    //
    // This function is ONLY called when the user actually
    // selects a dataset, or during the very first application
    // load.
    //
    // It is NOT called by the 5-second MinIO polling.
    // ============================================================

    const loadDataset = useCallback(
        async (
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
                            JSON.parse(
                                responseText
                            );


                        if (
                            errorData.detail
                        ) {

                            message =
                                errorData.detail;

                        }

                    }
                    catch {

                        if (
                            responseText
                        ) {

                            message =
                                responseText;

                        }

                    }


                    throw new Error(
                        message
                    );

                }


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
                    "Loaded dataset:",
                    analysis.filename
                );


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


                if (
                    mountedRef.current
                ) {

                    setError(
                        err.message ||
                        "Unable to load selected dataset."
                    );

                }

            }
            finally {

                if (
                    mountedRef.current
                ) {

                    setLoadingDataset(
                        false
                    );

                }

            }

        },
        [
            onDatasetLoaded
        ]
    );


    // ============================================================
    // LOAD DATASET LIST FROM MINIO
    //
    // IMPORTANT:
    //
    // autoSelectLatest=true:
    //     Used ONLY on initial load.
    //
    // autoSelectLatest=false:
    //     Used for polling / manual refresh.
    //
    // loadSelectedDataset=false:
    //     Refresh the MinIO list WITHOUT loading the dataset.
    // ============================================================

    const loadDatasets = useCallback(
        async (
            autoSelectLatest = false,
            showLoading = true,
            loadSelectedDataset = false
        ) => {

            if (showLoading) {

                setLoading(true);

            }


            if (showLoading) {

                setError("");

            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/datasets`,
                        {
                            method: "GET",
                            cache: "no-store",
                            headers: {
                                "Cache-Control":
                                    "no-cache"
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
                            JSON.parse(
                                responseText
                            );


                        if (
                            errorData.detail
                        ) {

                            message =
                                errorData.detail;

                        }

                    }
                    catch {

                        if (
                            responseText
                        ) {

                            message =
                                responseText;

                        }

                    }


                    throw new Error(
                        message
                    );

                }


                let result;


                try {

                    result =
                        JSON.parse(
                            responseText
                        );

                }
                catch {

                    throw new Error(
                        "FastAPI returned invalid JSON."
                    );

                }


                const datasetList =
                    Array.isArray(
                        result.datasets
                    )
                        ? result.datasets
                        : [];


                console.log(
                    "MinIO datasets:",
                    datasetList
                );


                // =================================================
                // ONLY UPDATE STATE IF LIST ACTUALLY CHANGED
                // =================================================

                setDatasets(
                    previous => {

                        if (
                            areDatasetListsEqual(
                                previous,
                                datasetList
                            )
                        ) {

                            return previous;

                        }


                        return datasetList;

                    }
                );


                const datasetNames =
                    datasetList
                        .map(
                            getDatasetName
                        )
                        .filter(Boolean);


                const currentSelected =
                    selectedDatasetRef.current;


                // =================================================
                // FIRST APPLICATION LOAD
                //
                // Load newest dataset exactly once.
                // =================================================

                if (
                    firstLoadRef.current &&
                    datasetNames.length > 0
                ) {

                    const latestDataset =
                        datasetNames[0];


                    firstLoadRef.current =
                        false;


                    selectedDatasetRef.current =
                        latestDataset;


                    setSelectedDataset(
                        latestDataset
                    );


                    await loadDataset(
                        latestDataset
                    );


                    return;

                }


                firstLoadRef.current =
                    false;


                // =================================================
                // UPLOAD REFRESH
                //
                // The upload already loaded the data through
                // Upload.jsx -> Dashboard.jsx.
                //
                // Therefore we ONLY select the filename here.
                //
                // DO NOT call loadDataset().
                // =================================================

                if (
                    loadSelectedDataset &&
                    uploadedDatasetName &&
                    datasetNames.includes(
                        uploadedDatasetName
                    )
                ) {

                    selectedDatasetRef.current =
                        uploadedDatasetName;


                    setSelectedDataset(
                        uploadedDatasetName
                    );


                    return;

                }


                // =================================================
                // KEEP CURRENT DATASET
                // =================================================

                if (
                    currentSelected &&
                    datasetNames.includes(
                        currentSelected
                    )
                ) {

                    // Nothing to do.
                    //
                    // Most importantly:
                    //
                    // DO NOT reload the dataset.

                    return;

                }


                // =================================================
                // CURRENT DATASET DISAPPEARED
                // =================================================

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


                    selectedDatasetRef.current =
                        "";

                    setSelectedDataset(
                        ""
                    );

                }

            }
            catch (err) {

                console.error(
                    "DATASET LIST ERROR:",
                    err
                );


                // Never destroy the existing dropdown during
                // silent polling.

                if (
                    showLoading &&
                    mountedRef.current
                ) {

                    setError(
                        err.message ||
                        "Unable to load datasets from MinIO."
                    );

                }

            }
            finally {

                if (
                    showLoading &&
                    mountedRef.current
                ) {

                    setLoading(
                        false
                    );

                }

            }

        },
        [
            areDatasetListsEqual,
            getDatasetName,
            loadDataset,
            uploadedDatasetName
        ]
    );


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadDatasets(
            true,
            true,
            false
        );

    }, [
        loadDatasets
    ]);


    // ============================================================
    // MINIO POLLING
    //
    // This only checks whether the LIST changed.
    //
    // It NEVER reloads the active dataset.
    // ============================================================

    useEffect(() => {

        const intervalId =
            setInterval(
                () => {

                    console.log(
                        "Checking MinIO for new datasets..."
                    );


                    loadDatasets(
                        false,
                        false,
                        false
                    );

                },
                AUTO_REFRESH_INTERVAL
            );


        return () => {

            clearInterval(
                intervalId
            );

        };

    }, [
        loadDatasets
    ]);


    // ============================================================
    // REFRESH AFTER UPLOAD
    //
    // IMPORTANT:
    //
    // Upload.jsx already loaded the uploaded file and Dashboard
    // already has the data.
    //
    // Therefore this refresh ONLY updates the dropdown.
    // ============================================================

    useEffect(() => {

        if (
            refreshKey <= 0
        ) {

            return;

        }


        console.log(
            "Upload completed. Refreshing MinIO list only..."
        );


        loadDatasets(
            false,
            true,
            true
        );

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


        if (!filename) {

            return;

        }


        if (
            filename ===
            selectedDatasetRef.current
        ) {

            return;

        }


        selectedDatasetRef.current =
            filename;


        setSelectedDataset(
            filename
        );


        await loadDataset(
            filename
        );

    };


    // ============================================================
    // MANUAL REFRESH
    //
    // Manual refresh only refreshes the list.
    //
    // It does NOT reload the selected dataset.
    // ============================================================

    const handleRefresh = async () => {

        await loadDatasets(
            false,
            true,
            false
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


                <Tooltip
                    title="Refresh datasets"
                >

                    <IconButton
                        size="small"
                        onClick={
                            handleRefresh
                        }
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
            {/* LOADING LIST */}
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
                                dataset
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
                                            filename
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


                    {/* ============================================= */}
                    {/* DATASET LOADING */}
                    {/* ============================================= */}

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