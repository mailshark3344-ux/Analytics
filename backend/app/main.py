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
            # Supported files
            # ------------------------------------------------

            if not filename_lower.endswith(
                (
                    ".csv",
                    ".xlsx",
                    ".xls",
                    ".sql"
                )
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
            ".xls",
            ".sql"
        )

        if not filename_lower.endswith(
            supported_extensions
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file format. "
                    "Please upload CSV, XLSX, XLS or SQL."
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
        # ====================================================

        df = read_uploaded_file(
            data,
            filename
        )

        # ====================================================
        # VALIDATE DATAFRAME
        #
        # SQL files may contain CREATE TABLE without INSERT.
        # Therefore we only reject when there are no columns.
        # ====================================================

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
            (
                ".csv",
                ".xlsx",
                ".xls",
                ".sql"
            )
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported dataset format. "
                    "Supported formats: "
                    "CSV, XLSX, XLS and SQL."
                )
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
        # ====================================================

        df = read_uploaded_file(
            data,
            filename
        )

        # ====================================================
        # VALIDATE DATASET
        # ====================================================

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

def json_safe_value(
    value
):

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
# RECURSIVE JSON SAFE CONVERSION
# ============================================================

def make_json_safe(
    value
):
    """
    Recursively convert SQL metadata into JSON-safe
    Python values.

    This is especially important for changed_cells,
    primary_key, row, old_value and new_value.
    """

    if isinstance(
        value,
        dict
    ):

        return {
            str(key): make_json_safe(
                item
            )
            for key, item in value.items()
        }

    if isinstance(
        value,
        list
    ):

        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(
        value,
        tuple
    ):

        return [
            make_json_safe(item)
            for item in value
        ]

    return json_safe_value(
        value
    )


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
# CREATE SQL CHANGE INFORMATION
# ============================================================

def create_sql_change_information(
    df: pd.DataFrame
):
    """
    Create dashboard-friendly SQL change information.

    IMPORTANT:

    The SQL parser already calculates the actual
    cell-level changes in:

        sql_metadata["changed_cells"]

    Example:

        {
            "table": "users",
            "column": "status",
            "old_value": 1,
            "new_value": 0,
            "row": {
                "user_id": 2,
                "status": 1
            },
            "primary_key": {
                "user_id": 2
            }
        }

    This function must NOT calculate Cells Changed
    merely from the number of columns in UPDATE
    statements.

    It uses the parser's actual changed_cells list.
    """

    sql_metadata = df.attrs.get(
        "sql_metadata",
        {}
    )

    if not isinstance(
        sql_metadata,
        dict
    ):

        sql_metadata = {}

    # ========================================================
    # GET SQL DATA
    # ========================================================

    inserts = sql_metadata.get(
        "inserts",
        []
    )

    updates = sql_metadata.get(
        "updates",
        []
    )

    deletes = sql_metadata.get(
        "deletes",
        []
    )

    # ========================================================
    # SAFETY
    # ========================================================

    if not isinstance(
        inserts,
        list
    ):

        inserts = []

    if not isinstance(
        updates,
        list
    ):

        updates = []

    if not isinstance(
        deletes,
        list
    ):

        deletes = []

    # ========================================================
    # INSERTED ROWS
    #
    # Prefer the parser's reconstructed inserted_rows.
    # Fall back to extracting rows from INSERT statements.
    # ========================================================

    inserted_rows = sql_metadata.get(
        "inserted_rows",
        []
    )

    if not isinstance(
        inserted_rows,
        list
    ):

        inserted_rows = []

    # --------------------------------------------------------
    # Fallback
    # --------------------------------------------------------

    if not inserted_rows:

        for insert in inserts:

            if not isinstance(
                insert,
                dict
            ):

                continue

            rows = insert.get(
                "rows",
                []
            )

            if not isinstance(
                rows,
                list
            ):

                continue

            for row in rows:

                if isinstance(
                    row,
                    dict
                ):

                    inserted_rows.append({

                        "table": insert.get(
                            "table"
                        ),

                        **row

                    })

    # ========================================================
    # UPDATED ROWS
    #
    # Prefer the parser's reconstructed updated_rows.
    # ========================================================

    updated_rows = sql_metadata.get(
        "updated_rows",
        []
    )

    if not isinstance(
        updated_rows,
        list
    ):

        updated_rows = []

    # --------------------------------------------------------
    # Fallback for older parser
    # --------------------------------------------------------

    if not updated_rows:

        for update in updates:

            if not isinstance(
                update,
                dict
            ):

                continue

            changes = update.get(
                "changes"
            )

            if changes is None:

                changes = update.get(
                    "set",
                    {}
                )

            if not isinstance(
                changes,
                dict
            ):

                changes = {}

            normalized_update = {

                "table": update.get(
                    "table"
                ),

                "changes": changes,

                "set": changes,

                "where": update.get(
                    "where"
                ),

                "where_conditions":
                    update.get(
                        "where_conditions",
                        {}
                    )

            }

            updated_rows.append(
                normalized_update
            )

    # ========================================================
    # DELETED ROWS
    #
    # Prefer parser's reconstructed deleted_rows.
    # ========================================================

    deleted_rows = sql_metadata.get(
        "deleted_rows",
        []
    )

    if not isinstance(
        deleted_rows,
        list
    ):

        deleted_rows = []

    # --------------------------------------------------------
    # Fallback for older parser
    # --------------------------------------------------------

    if not deleted_rows:

        for delete in deletes:

            if isinstance(
                delete,
                dict
            ):

                deleted_rows.append(
                    delete
                )

    # ========================================================
    # ACTUAL CHANGED CELLS
    #
    # THIS IS THE IMPORTANT FIX.
    #
    # The parser's build_change_details() creates:
    #
    #     sql_metadata["changed_cells"]
    #
    # We expose that array directly to the frontend.
    # ========================================================

    changed_cells = sql_metadata.get(
        "changed_cells",
        []
    )

    # --------------------------------------------------------
    # Support camelCase if another component uses it.
    # --------------------------------------------------------

    if not changed_cells:

        changed_cells = sql_metadata.get(
            "changedCells",
            []
        )

    if not isinstance(
        changed_cells,
        list
    ):

        changed_cells = []

    # ========================================================
    # CELLS CHANGED COUNT
    # ========================================================

    # --------------------------------------------------------
    # Best source:
    #
    # actual number of changed cell objects.
    # --------------------------------------------------------

    cells_changed = len(
        changed_cells
    )

    # --------------------------------------------------------
    # If changed_cells isn't available, use parser's
    # cells_changed value.
    #
    # This keeps backward compatibility.
    # --------------------------------------------------------

    if cells_changed == 0:

        parser_cells_changed = sql_metadata.get(
            "cells_changed"
        )

        if parser_cells_changed is not None:

            try:

                cells_changed = int(
                    parser_cells_changed
                )

            except (
                ValueError,
                TypeError
            ):

                cells_changed = 0

    # ========================================================
    # INSERT / UPDATE / DELETE COUNTS
    # ========================================================

    # --------------------------------------------------------
    # Prefer parser's final reconstructed counts.
    # --------------------------------------------------------

    inserted_count = sql_metadata.get(
        "inserted"
    )

    updated_count = sql_metadata.get(
        "updated"
    )

    deleted_count = sql_metadata.get(
        "deleted"
    )

    # --------------------------------------------------------
    # Fallback to reconstructed lists.
    # --------------------------------------------------------

    if inserted_count is None:

        inserted_count = len(
            inserted_rows
        )

    if updated_count is None:

        updated_count = len(
            updated_rows
        )

    if deleted_count is None:

        deleted_count = len(
            deleted_rows
        )

    try:

        inserted_count = int(
            inserted_count
        )

    except (
        ValueError,
        TypeError
    ):

        inserted_count = len(
            inserted_rows
        )

    try:

        updated_count = int(
            updated_count
        )

    except (
        ValueError,
        TypeError
    ):

        updated_count = len(
            updated_rows
        )

    try:

        deleted_count = int(
            deleted_count
        )

    except (
        ValueError,
        TypeError
    ):

        deleted_count = len(
            deleted_rows
        )

    # ========================================================
    # COLUMN CHANGES
    # ========================================================

    added_columns = sql_metadata.get(
        "added_columns",
        []
    )

    removed_columns = sql_metadata.get(
        "removed_columns",
        []
    )

    if not isinstance(
        added_columns,
        list
    ):

        added_columns = []

    if not isinstance(
        removed_columns,
        list
    ):

        removed_columns = []

    # ========================================================
    # MAKE EVERYTHING JSON SAFE
    # ========================================================

    inserted_rows = make_json_safe(
        inserted_rows
    )

    updated_rows = make_json_safe(
        updated_rows
    )

    deleted_rows = make_json_safe(
        deleted_rows
    )

    changed_cells = make_json_safe(
        changed_cells
    )

    added_columns = make_json_safe(
        added_columns
    )

    removed_columns = make_json_safe(
        removed_columns
    )

    # ========================================================
    # DEBUG LOGGING
    # ========================================================

    print("-" * 60)
    print("SQL CHANGE INFORMATION")

    print(
        "Inserted:",
        inserted_count
    )

    print(
        "Updated:",
        updated_count
    )

    print(
        "Deleted:",
        deleted_count
    )

    print(
        "Cells changed:",
        cells_changed
    )

    print(
        "Changed cell details:",
        len(changed_cells)
    )

    print("-" * 60)

    # ========================================================
    # RESULT
    # ========================================================

    return {

        # ----------------------------------------------------
        # KPI COUNTS
        # ----------------------------------------------------

        "inserted": inserted_count,

        "updated": updated_count,

        "deleted": deleted_count,

        "cells_changed": cells_changed,

        # ----------------------------------------------------
        # DETAIL DATA
        # ----------------------------------------------------

        "inserted_rows": inserted_rows,

        "updated_rows": updated_rows,

        "deleted_rows": deleted_rows,

        "changed_cells": changed_cells,

        # ----------------------------------------------------
        # Compatibility aliases
        # ----------------------------------------------------

        "insertedRows": inserted_rows,

        "updatedRows": updated_rows,

        "deletedRows": deleted_rows,

        "changedCells": changed_cells,

        # ----------------------------------------------------
        # Schema changes
        # ----------------------------------------------------

        "added_columns": added_columns,

        "removed_columns": removed_columns

    }


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
    # SOURCE TYPE
    # ========================================================

    source_type = df.attrs.get(
        "source_type"
    )

    if not source_type:

        filename_lower = filename.lower()

        if filename_lower.endswith(".sql"):

            source_type = "sql"

        elif filename_lower.endswith(".csv"):

            source_type = "csv"

        elif filename_lower.endswith(
            (".xlsx", ".xls")
        ):

            source_type = "excel"

        else:

            source_type = "unknown"

    # ========================================================
    # BASE RESPONSE
    # ========================================================

    result = {

        "filename": filename,

        "source_type": source_type,

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

    # ========================================================
    # SQL ONLY
    #
    # CSV / Excel do NOT get SQL metadata.
    # ========================================================

    if source_type == "sql":

        sql_metadata = (
            df.attrs.get(
                "sql_metadata",
                {}
            )
        )

        if not isinstance(
            sql_metadata,
            dict
        ):

            sql_metadata = {}

        # ----------------------------------------------------
        # SQL STRUCTURE / STATEMENTS
        # ----------------------------------------------------

        result["sql"] = {

            "tables": sql_metadata.get(
                "tables",
                []
            ),

            "columns": sql_metadata.get(
                "columns",
                {}
            ),

            "primary_keys": sql_metadata.get(
                "primary_keys",
                {}
            ),

            "creates": sql_metadata.get(
                "creates",
                []
            ),

            "inserts": sql_metadata.get(
                "inserts",
                []
            ),

            "updates": sql_metadata.get(
                "updates",
                []
            ),

            "deletes": sql_metadata.get(
                "deletes",
                []
            )

        }

        # ----------------------------------------------------
        # SQL CHANGE SUMMARY
        #
        # This now includes:
        #
        #   changed_cells
        #
        # so React can display the exact cells.
        # ----------------------------------------------------

        result["changes"] = (
            create_sql_change_information(
                df
            )
        )

    return result
