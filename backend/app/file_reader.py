import io

import pandas as pd

from .sql_parser import parse_sql_file


# ============================================================
# READ UPLOADED FILE
# ============================================================

def read_uploaded_file(
    data: bytes,
    filename: str
):
    """
    Read CSV, XLSX, XLS or SQL.

    SQL metadata is stored in:

        df.attrs["sql_metadata"]
    """

    # ========================================================
    # VALIDATE
    # ========================================================

    if not data:
        raise ValueError(
            "Uploaded file is empty."
        )

    if not filename:
        raise ValueError(
            "Filename is missing."
        )

    filename_lower = (
        filename.lower().strip()
    )

    # ========================================================
    # EXCEL
    # ========================================================

    if filename_lower.endswith(
        (".xlsx", ".xls")
    ):

        file_object = io.BytesIO(
            data
        )

        try:

            raw_df = pd.read_excel(
                file_object,
                header=None
            )

        except Exception as e:

            raise ValueError(
                f"Unable to read Excel file: {e}"
            )

        raw_df = raw_df.dropna(
            axis=0,
            how="all"
        )

        if raw_df.empty:

            raise ValueError(
                "Excel file contains no data."
            )

        header_row = None

        for index, row in raw_df.iterrows():

            non_empty_values = row.dropna()

            if len(non_empty_values) >= 2:

                header_row = index

                break

        if header_row is None:

            header_row = raw_df.index[0]

        print(
            f"Detected Excel header row: {header_row}"
        )

        file_object.seek(0)

        try:

            df = pd.read_excel(
                file_object,
                header=header_row
            )

        except Exception as e:

            raise ValueError(
                f"Unable to read Excel file: {e}"
            )

        df.attrs["source_type"] = "excel"

    # ========================================================
    # CSV
    # ========================================================

    elif filename_lower.endswith(".csv"):

        df = None

        encodings = [
            "utf-8",
            "utf-8-sig",
            "latin1",
            "cp1252"
        ]

        last_error = None

        for encoding in encodings:

            try:

                file_object = io.BytesIO(
                    data
                )

                df = pd.read_csv(
                    file_object,
                    encoding=encoding,
                    low_memory=False
                )

                print(
                    f"CSV encoding detected: {encoding}"
                )

                break

            except Exception as e:

                last_error = e

        if df is None:

            raise ValueError(
                "Unable to read CSV file: "
                f"{last_error}"
            )

        df.attrs["source_type"] = "csv"

    # ========================================================
    # SQL
    # ========================================================

    elif filename_lower.endswith(".sql"):

        print("=" * 60)
        print(
            f"Reading SQL file: {filename}"
        )
        print("=" * 60)

        # ----------------------------------------------------
        # PARSE
        # ----------------------------------------------------

        sql_result = parse_sql_file(
            data
        )

        if not isinstance(
            sql_result,
            dict
        ):

            raise ValueError(
                "SQL parser returned invalid data."
            )

        # ----------------------------------------------------
        # CONVERT TO DATAFRAME
        # ----------------------------------------------------

        df = sql_result_to_dataframe(
            sql_result
        )

        # ----------------------------------------------------
        # STORE SQL METADATA
        # ----------------------------------------------------

        df.attrs["source_type"] = "sql"

        df.attrs["sql_metadata"] = (
            sql_result
        )

        tables = sql_result.get(
            "tables",
            []
        )

        df.attrs["table_name"] = (
            tables[0]
            if tables
            else None
        )

        df.attrs["primary_keys"] = (
            sql_result.get(
                "primary_keys",
                {}
            )
        )

        # ----------------------------------------------------
        # LOGGING
        # ----------------------------------------------------

        print(
            "SQL dialect:",
            sql_result.get(
                "dialect"
            )
        )

        print(
            "SQL tables:",
            sql_result.get(
                "tables",
                []
            )
        )

        print(
            "SQL CREATE statements:",
            len(
                sql_result.get(
                    "creates",
                    []
                )
            )
        )

        print(
            "SQL INSERT statements:",
            len(
                sql_result.get(
                    "inserts",
                    []
                )
            )
        )

        print(
            "SQL UPDATE statements:",
            len(
                sql_result.get(
                    "updates",
                    []
                )
            )
        )

        print(
            "SQL DELETE statements:",
            len(
                sql_result.get(
                    "deletes",
                    []
                )
            )
        )

        print(
            "SQL DataFrame rows:",
            len(df)
        )

        print(
            "SQL DataFrame columns:",
            df.columns.tolist()
        )

    # ========================================================
    # UNSUPPORTED
    # ========================================================

    else:

        raise ValueError(
            "Unsupported file format. "
            "Supported formats: "
            "CSV, XLSX, XLS and SQL."
        )

    # ========================================================
    # COMMON CLEANING
    # ========================================================

    df = clean_dataframe(
        df
    )

    return df


# ============================================================
# SQL RESULT → DATAFRAME
# ============================================================

def sql_result_to_dataframe(
    sql_result
):
    """
    Convert SQL parser output into DataFrame.

    Priority:

        1. INSERT rows
        2. CREATE TABLE schema
        3. Columns referenced by UPDATE
        4. Empty DataFrame
    """

    if not isinstance(
        sql_result,
        dict
    ):

        raise ValueError(
            "Invalid SQL parser result."
        )

    # ========================================================
    # INSERT ROWS
    # ========================================================

    inserts = sql_result.get(
        "inserts",
        []
    )

    all_rows = []

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

                all_rows.append(
                    row
                )

    # ========================================================
    # DATA EXISTS
    # ========================================================

    if all_rows:

        df = pd.DataFrame(
            all_rows
        )

        return df

    # ========================================================
    # NO INSERTS
    #
    # Build DataFrame from CREATE TABLE schema.
    # ========================================================

    tables = sql_result.get(
        "tables",
        []
    )

    columns_by_table = sql_result.get(
        "columns",
        {}
    )

    if not isinstance(
        tables,
        list
    ):

        tables = []

    if not isinstance(
        columns_by_table,
        dict
    ):

        columns_by_table = {}

    # ========================================================
    # MULTI-TABLE SCHEMA
    # ========================================================

    for table_name in tables:

        columns = columns_by_table.get(
            table_name,
            []
        )

        if isinstance(
            columns,
            list
        ) and columns:

            return pd.DataFrame(
                columns=columns
            )

    # ========================================================
    # UPDATE COLUMNS FALLBACK
    # ========================================================

    update_columns = []

    for update in sql_result.get(
        "updates",
        []
    ):

        if not isinstance(
            update,
            dict
        ):

            continue

        changes = update.get(
            "set",
            {}
        )

        if isinstance(
            changes,
            dict
        ):

            for column in changes.keys():

                if column not in update_columns:

                    update_columns.append(
                        column
                    )

    if update_columns:

        return pd.DataFrame(
            columns=update_columns
        )

    # ========================================================
    # EMPTY DATAFRAME
    # ========================================================

    return pd.DataFrame()


# ============================================================
# COMMON DATAFRAME CLEANING
# ============================================================

def clean_dataframe(
    df
):
    """
    Clean CSV, Excel and SQL DataFrames.

    Existing attrs are preserved.
    """

    if df is None:

        raise ValueError(
            "No data was loaded."
        )

    if not isinstance(
        df,
        pd.DataFrame
    ):

        raise ValueError(
            "Loaded data is not a pandas DataFrame."
        )

    # ========================================================
    # SAVE ATTRIBUTES
    # ========================================================

    original_attrs = dict(
        df.attrs
    )

    # ========================================================
    # REMOVE EMPTY ROWS
    # ========================================================

    df = df.dropna(
        axis=0,
        how="all"
    )

    # ========================================================
    # REMOVE EMPTY COLUMNS
    # ========================================================

    df = df.dropna(
        axis=1,
        how="all"
    )

    # ========================================================
    # CLEAN COLUMN NAMES
    # ========================================================

    new_columns = []

    used_names = set()

    for index, column in enumerate(
        df.columns
    ):

        name = str(
            column
        ).strip()

        if (
            not name
            or name.lower().startswith(
                "unnamed:"
            )
        ):

            name = f"Column_{index + 1}"

        original_name = name

        counter = 2

        while name in used_names:

            name = (
                f"{original_name}_{counter}"
            )

            counter += 1

        used_names.add(
            name
        )

        new_columns.append(
            name
        )

    df.columns = new_columns

    # ========================================================
    # REMOVE REPEATED HEADER
    # ========================================================

    if len(df) > 0:

        first_row = [
            str(value).strip()
            for value in df.iloc[0].tolist()
        ]

        column_names = [
            str(column).strip()
            for column in df.columns
        ]

        if first_row == column_names:

            df = df.iloc[1:]

    # ========================================================
    # RESET INDEX
    # ========================================================

    df = df.reset_index(
        drop=True
    )

    # ========================================================
    # RESTORE ATTRIBUTES
    # ========================================================

    df.attrs.update(
        original_attrs
    )

    # ========================================================
    # LOG
    # ========================================================

    print(
        "Final dataset columns:",
        df.columns.tolist()
    )

    print(
        "Final dataset rows:",
        len(df)
    )

    return df