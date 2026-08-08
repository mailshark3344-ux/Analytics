from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .minio_client import client, bucket_name
from .file_reader import read_uploaded_file

import pandas as pd
import io
import math


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="MinIO Analytics Backend",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "MinIO Analytics Backend Running",
        "bucket": bucket_name
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    try:

        client.list_buckets()

        return {
            "status": "ok",
            "minio": True,
            "bucket": bucket_name
        }

    except Exception as e:

        return {
            "status": "error",
            "minio": False,
            "error": str(e)
        }


# ============================================================
# LIST DATASETS FROM MINIO
# ============================================================

@app.get("/datasets")
def list_datasets():

    try:

        print(
            f"Listing datasets from MinIO bucket: {bucket_name}"
        )

        objects = client.list_objects(
            bucket_name,
            recursive=True
        )

        datasets = []

        for obj in objects:

            filename = obj.object_name

            filename_lower = filename.lower()

            # ------------------------------------------------
            # Only show supported datasets
            # ------------------------------------------------

            if not filename_lower.endswith(
                (".csv", ".xlsx", ".xls")
            ):
                continue

            datasets.append({

                "name": filename,

                "size": int(
                    obj.size or 0
                ),

                "last_modified":
                    obj.last_modified.isoformat()
                    if obj.last_modified
                    else None

            })

        # ----------------------------------------------------
        # Newest first
        # ----------------------------------------------------

        datasets.sort(
            key=lambda x: x["last_modified"] or "",
            reverse=True
        )

        print(
            f"Found {len(datasets)} datasets"
        )

        return {
            "bucket": bucket_name,
            "datasets": datasets
        }

    except Exception as e:

        print(
            "LIST DATASETS ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to read datasets "
                f"from MinIO: {str(e)}"
            )
        )


# ============================================================
# UPLOAD NEW DATASET
#
# Browser
#    ↓
# FastAPI
#    ↓
# MinIO
#    ↓
# file_reader.py
#    ↓
# Pandas
#    ↓
# Analysis
#    ↓
# JSON
# ============================================================

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    try:

        # ====================================================
        # VALIDATE FILENAME
        # ====================================================

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="Filename is missing"
            )

        filename = file.filename.strip()

        filename_lower = filename.lower()

        # ====================================================
        # SUPPORTED FILES
        # ====================================================

        supported_extensions = (
            ".csv",
            ".xlsx",
            ".xls"
        )

        if not filename_lower.endswith(
            supported_extensions
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file format. "
                    "Please upload CSV, XLSX or XLS."
                )
            )

        # ====================================================
        # READ BROWSER UPLOAD
        # ====================================================

        data = await file.read()

        if not data:

            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

        print("=" * 60)

        print(
            f"Uploading: {filename}"
        )

        print(
            f"File size: {len(data)} bytes"
        )

        # ====================================================
        # READ DATASET
        #
        # This now uses file_reader.py
        # ====================================================

        df = read_uploaded_file(
            data,
            filename
        )

        # ====================================================
        # VALIDATE DATAFRAME
        # ====================================================

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The uploaded dataset "
                    "contains no data."
                )
            )

        if len(df.columns) == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The uploaded dataset "
                    "contains no columns."
                )
            )

        # ====================================================
        # STORE ORIGINAL FILE IN MINIO
        # ====================================================

        client.put_object(

            bucket_name,

            filename,

            io.BytesIO(data),

            len(data),

            content_type=(
                file.content_type
                or "application/octet-stream"
            )

        )

        print(
            f"Stored in MinIO: {filename}"
        )

        print(
            f"Dataset loaded: "
            f"{len(df)} rows, "
            f"{len(df.columns)} columns"
        )

        print(
            "Columns:",
            df.columns.tolist()
        )

        # ====================================================
        # CREATE ANALYSIS
        # ====================================================

        result = create_analysis_response(
            df,
            filename
        )

        print(
            "Analysis created successfully"
        )

        print("=" * 60)

        return result

    except HTTPException:

        raise

    except Exception as e:

        print("=" * 60)

        print(
            "UPLOAD ERROR:"
        )

        print(
            repr(e)
        )

        print("=" * 60)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# ANALYZE DATASET ALREADY IN MINIO
# ============================================================

@app.get(
    "/datasets/{filename:path}"
)
def analyze_dataset(
    filename: str
):

    response = None

    try:

        # ====================================================
        # VALIDATE FILENAME
        # ====================================================

        if not filename:

            raise HTTPException(
                status_code=400,
                detail="Filename is missing"
            )

        filename_lower = filename.lower()

        if not filename_lower.endswith(
            (".csv", ".xlsx", ".xls")
        ):

            raise HTTPException(
                status_code=400,
                detail="Unsupported dataset format"
            )

        print(
            f"Reading existing dataset from MinIO: {filename}"
        )

        # ====================================================
        # CHECK OBJECT EXISTS
        # ====================================================

        try:

            stat = client.stat_object(
                bucket_name,
                filename
            )

        except Exception:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Dataset '{filename}' "
                    "was not found in MinIO."
                )
            )

        if stat.size == 0:

            raise HTTPException(
                status_code=404,
                detail="Dataset is empty"
            )

        # ====================================================
        # GET OBJECT FROM MINIO
        # ====================================================

        response = client.get_object(
            bucket_name,
            filename
        )

        data = response.read()

        if not data:

            raise HTTPException(
                status_code=404,
                detail="Dataset is empty"
            )

        # ====================================================
        # READ DATASET
        #
        # This uses the same file_reader.py used by upload.
        # ====================================================

        df = read_uploaded_file(
            data,
            filename
        )

        # ====================================================
        # VALIDATE DATASET
        # ====================================================

        if df.empty:

            raise HTTPException(
                status_code=400,
                detail="Dataset contains no data"
            )

        if len(df.columns) == 0:

            raise HTTPException(
                status_code=400,
                detail="Dataset contains no columns"
            )

        print(
            f"Existing dataset loaded: "
            f"{len(df)} rows, "
            f"{len(df.columns)} columns"
        )

        print(
            "Columns:",
            df.columns.tolist()
        )

        # ====================================================
        # ANALYZE
        # ====================================================

        return create_analysis_response(
            df,
            filename
        )

    except HTTPException:

        raise

    except Exception as e:

        print(
            "DATASET ANALYSIS ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if response:

            response.close()

            response.release_conn()


# ============================================================
# BACKWARD COMPATIBILITY
#
# Old frontend:
#
# /csv-analysis/Details.csv
#
# ============================================================

@app.get(
    "/csv-analysis/{filename:path}"
)
def analyze_csv(
    filename: str
):

    return analyze_dataset(
        filename
    )


# ============================================================
# DETECT COLUMN TYPE
# ============================================================

def detect_column_type(
    series: pd.Series
):

    non_null = series.dropna()

    # --------------------------------------------------------
    # Empty column
    # --------------------------------------------------------

    if len(non_null) == 0:

        return "string"

    # --------------------------------------------------------
    # Boolean
    # --------------------------------------------------------

    if pd.api.types.is_bool_dtype(
        series
    ):

        return "boolean"

    # --------------------------------------------------------
    # Integer
    # --------------------------------------------------------

    if pd.api.types.is_integer_dtype(
        series
    ):

        return "integer"

    # --------------------------------------------------------
    # Float
    # --------------------------------------------------------

    if pd.api.types.is_float_dtype(
        series
    ):

        return "number"

    # --------------------------------------------------------
    # Numeric
    # --------------------------------------------------------

    if pd.api.types.is_numeric_dtype(
        series
    ):

        return "number"

    # --------------------------------------------------------
    # Native datetime
    # --------------------------------------------------------

    if pd.api.types.is_datetime64_any_dtype(
        series
    ):

        try:

            non_null_dates = (
                series.dropna()
            )

            normalized = (
                non_null_dates.dt.normalize()
            )

            if (
                normalized == non_null_dates
            ).all():

                return "date"

        except Exception:

            pass

        return "datetime"

    # ========================================================
    # STRING DETECTION
    # ========================================================

    values = (
        non_null
        .astype(str)
        .str.strip()
    )

    if len(values) == 0:

        return "string"

    # --------------------------------------------------------
    # Boolean-like strings
    # --------------------------------------------------------

    boolean_values = {

        "true",
        "false",

        "yes",
        "no",

        "y",
        "n"

    }

    lower_values = (
        values.str.lower()
    )

    unique_values = set(
        lower_values.unique()
    )

    if (
        len(unique_values) > 0
        and unique_values.issubset(
            boolean_values
        )
    ):

        return "boolean"

    # --------------------------------------------------------
    # Numeric strings
    # --------------------------------------------------------

    numeric_values = pd.to_numeric(
        values,
        errors="coerce"
    )

    numeric_ratio = (
        numeric_values.notna().mean()
    )

    if numeric_ratio >= 0.95:

        try:

            numeric_non_null = (
                numeric_values.dropna()
            )

            if (
                numeric_non_null % 1 == 0
            ).all():

                return "integer"

        except Exception:

            pass

        return "number"

    # --------------------------------------------------------
    # Date detection
    # --------------------------------------------------------

    date_like_ratio = (
        values.str.contains(
            r"[-/:]",
            regex=True
        ).mean()
    )

    if date_like_ratio >= 0.50:

        try:

            date_values = pd.to_datetime(
                values,
                errors="coerce",
                format="mixed"
            )

            date_ratio = (
                date_values.notna().mean()
            )

            if date_ratio >= 0.95:

                try:

                    has_time = (
                        date_values
                        .dropna()
                        .dt.time
                        != pd.Timestamp(
                            "00:00:00"
                        ).time()
                    ).any()

                    if has_time:

                        return "datetime"

                    return "date"

                except Exception:

                    return "date"

        except Exception:

            pass

    return "string"


# ============================================================
# COLUMN INFORMATION
# ============================================================

def get_column_information(
    df: pd.DataFrame
):

    columns = []

    for column in df.columns:

        series = df[column]

        detected_type = (
            detect_column_type(
                series
            )
        )

        columns.append({

            "name": str(column),

            "type": detected_type,

            "nullable": bool(
                series.isna().any()
            ),

            "unique": int(
                series.nunique(
                    dropna=True
                )
            ),

            "non_null": int(
                series.notna().sum()
            ),

            "null_count": int(
                series.isna().sum()
            )

        })

    return columns


# ============================================================
# JSON SAFE VALUE
# ============================================================

def json_safe_value(value):

    if value is None:

        return None

    try:

        if pd.isna(value):

            return None

    except Exception:

        pass

    # --------------------------------------------------------
    # Pandas Timestamp
    # --------------------------------------------------------

    if isinstance(
        value,
        pd.Timestamp
    ):

        return value.isoformat()

    # --------------------------------------------------------
    # Other datetime-like values
    # --------------------------------------------------------

    if hasattr(
        value,
        "isoformat"
    ):

        try:

            return value.isoformat()

        except Exception:

            pass

    # --------------------------------------------------------
    # Python float
    # --------------------------------------------------------

    if isinstance(
        value,
        float
    ):

        if not math.isfinite(value):

            return None

    # --------------------------------------------------------
    # Numpy scalar
    # --------------------------------------------------------

    if hasattr(
        value,
        "item"
    ):

        try:

            converted = value.item()

            if isinstance(
                converted,
                float
            ):

                if not math.isfinite(
                    converted
                ):

                    return None

            return converted

        except Exception:

            pass

    # --------------------------------------------------------
    # Standard types
    # --------------------------------------------------------

    if isinstance(
        value,
        str
    ):

        return value

    if isinstance(
        value,
        (
            int,
            float,
            bool
        )
    ):

        return value

    return str(value)


# ============================================================
# DATAFRAME → JSON
# ============================================================

def dataframe_to_records(
    df: pd.DataFrame
):

    records = []

    for row in df.to_dict(
        orient="records"
    ):

        clean_row = {}

        for key, value in row.items():

            clean_row[str(key)] = (
                json_safe_value(value)
            )

        records.append(
            clean_row
        )

    return records


# ============================================================
# NUMERIC SUMMARY
# ============================================================

def create_numeric_summary(
    df: pd.DataFrame
):

    result = []

    for column in df.columns:

        series = df[column]

        numeric = pd.to_numeric(
            series,
            errors="coerce"
        )

        valid = numeric.dropna()

        if len(valid) == 0:

            continue

        result.append({

            "column": str(column),

            "sum": float(
                valid.sum()
            ),

            "average": float(
                valid.mean()
            ),

            "minimum": float(
                valid.min()
            ),

            "maximum": float(
                valid.max()
            ),

            "count": int(
                valid.count()
            )

        })

    return result


# ============================================================
# CATEGORICAL SUMMARY
# ============================================================

def create_categorical_summary(
    df: pd.DataFrame
):

    result = []

    for column in df.columns:

        series = df[column]

        # ----------------------------------------------------
        # Skip numeric columns
        # ----------------------------------------------------

        if pd.api.types.is_numeric_dtype(
            series
        ):

            continue

        non_null = series.dropna()

        if len(non_null) == 0:

            continue

        unique_count = (
            non_null.nunique()
        )

        # ----------------------------------------------------
        # Avoid huge categorical datasets
        # ----------------------------------------------------

        if unique_count > 100:

            continue

        counts = (
            non_null
            .astype(str)
            .value_counts()
        )

        values = []

        for value, count in counts.items():

            values.append({

                "value": str(value),

                "count": int(count)

            })

        result.append({

            "column": str(column),

            "unique": int(
                unique_count
            ),

            "values": values

        })

    return result


# ============================================================
# CREATE ANALYSIS RESPONSE
# ============================================================

def create_analysis_response(
    df: pd.DataFrame,
    filename: str
):

    # ========================================================
    # COLUMN INFORMATION
    # ========================================================

    columns = (
        get_column_information(
            df
        )
    )

    # ========================================================
    # FULL DATA
    # ========================================================

    data = dataframe_to_records(
        df
    )

    # ========================================================
    # PREVIEW
    # ========================================================

    preview = dataframe_to_records(
        df.head(10)
    )

    # ========================================================
    # NUMERIC SUMMARY
    # ========================================================

    numeric_summary = (
        create_numeric_summary(
            df
        )
    )

    # ========================================================
    # CATEGORICAL SUMMARY
    # ========================================================

    categorical_summary = (
        create_categorical_summary(
            df
        )
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "filename": filename,

        "rows": int(
            len(df)
        ),

        "columns_count": int(
            len(df.columns)
        ),

        "columns": columns,

        "data": data,

        "preview": preview,

        "summary": {

            "rows": int(
                len(df)
            ),

            "columns": int(
                len(df.columns)
            ),

            "numeric_columns": int(
                len(numeric_summary)
            ),

            "categorical_columns": int(
                len(categorical_summary)
            )

        },

        "numeric_summary": (
            numeric_summary
        ),

        "categorical_summary": (
            categorical_summary
        )

    }